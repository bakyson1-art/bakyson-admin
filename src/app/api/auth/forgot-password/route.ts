import { randomInt } from 'node:crypto';
import { query } from '@/lib/db';
import { sendPasswordResetOTP } from '@/lib/email';

export const runtime = 'nodejs';

const OTP_COOLDOWN_SECONDS = 60;

function generateOTP(): string {
  return randomInt(100000, 1000000).toString();
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find the user
    const userRes = await query(
      'SELECT id, email FROM users WHERE lower(email) = $1',
      [normalizedEmail]
    );
    const user = userRes.rows[0];

    // Always return success to avoid email enumeration
    if (!user) {
      return Response.json({ message: 'If an account exists, a reset code has been sent.' });
    }

    // Throttle issuance: at most one code per minute per account.
    const recent = await query(
      `SELECT 1 FROM password_reset_tokens
       WHERE user_id = $1 AND created_at > NOW() - ($2 * INTERVAL '1 second')
       LIMIT 1`,
      [user.id, OTP_COOLDOWN_SECONDS]
    );
    if (recent.rowCount) {
      return Response.json({ message: 'If an account exists, a reset code has been sent.' });
    }

    // Generate OTP and expiry (15 minutes)
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Invalidate any existing unused tokens for this user
    await query(
      'UPDATE password_reset_tokens SET used = TRUE WHERE user_id = $1 AND used = FALSE',
      [user.id]
    );

    // Store the new token
    await query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, otp, expiresAt]
    );

    // Send the OTP via email
    await sendPasswordResetOTP({ to: normalizedEmail, otp });

    return Response.json({ message: 'If an account exists, a reset code has been sent.' });
  } catch (error) {
    console.error('[forgot-password] error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
