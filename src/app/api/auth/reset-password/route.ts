import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { email, otp, newPassword } = await req.json();

    if (!email || !otp || !newPassword) {
      return Response.json({ error: 'Email, OTP, and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 12) {
      return Response.json({ error: 'Password must be at least 12 characters' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find the user
    const userRes = await query(
      'SELECT id FROM users WHERE lower(email) = $1',
      [normalizedEmail]
    );
    const user = userRes.rows[0];

    if (!user) {
      return Response.json({ error: 'Invalid email or OTP' }, { status: 400 });
    }

    // Find a valid, unused, unexpired token
    const tokenRes = await query(
      'SELECT id, token, expires_at, used FROM password_reset_tokens WHERE user_id = $1 AND used = FALSE ORDER BY created_at DESC LIMIT 1',
      [user.id]
    );
    const token = tokenRes.rows[0];

    if (!token) {
      return Response.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }

    if (token.token !== otp) {
      return Response.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    if (new Date(token.expires_at) < new Date()) {
      return Response.json({ error: 'OTP has expired' }, { status: 400 });
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update the user's password
    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [passwordHash, user.id]
    );

    // Mark the token as used
    await query(
      'UPDATE password_reset_tokens SET used = TRUE WHERE id = $1',
      [token.id]
    );

    return Response.json({ message: 'Password reset successful. You can now sign in with your new password.' });
  } catch (error) {
    console.error('[reset-password] error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
