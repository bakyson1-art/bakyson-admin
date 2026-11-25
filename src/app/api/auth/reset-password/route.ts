import bcrypt from 'bcryptjs';
import {
  consumeResetToken,
  findValidResetToken,
  isPlausibleResetToken,
} from '@/lib/password-reset';

export const runtime = 'nodejs';

const INVALID_LINK_MESSAGE =
  'This password reset link is invalid or has expired. Request a new one.';

function noStore(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST(req: Request) {
  try {
    const { token, newPassword } = await req.json();

    if (!isPlausibleResetToken(token) || typeof newPassword !== 'string') {
      return noStore({ error: 'A valid reset link and new password are required' }, 400);
    }

    if (newPassword.length < 12) {
      return noStore({ error: 'Password must be at least 12 characters' }, 400);
    }

    // Validate the link before doing the expensive password hash so invalid
    // tokens cannot be used to burn CPU.
    const validToken = await findValidResetToken(token);
    if (!validToken) {
      return noStore({ error: INVALID_LINK_MESSAGE }, 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    const userId = await consumeResetToken(token, passwordHash);

    if (!userId) {
      return noStore({ error: INVALID_LINK_MESSAGE }, 400);
    }

    return noStore({
      message: 'Password reset successful. You can now sign in with your new password.',
    });
  } catch (error) {
    console.error('[reset-password] error:', error);
    return noStore({ error: 'Internal server error' }, 500);
  }
}
