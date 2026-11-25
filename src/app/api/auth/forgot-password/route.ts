import { query } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';
import {
  PASSWORD_RESET_TTL_MINUTES,
  generateResetToken,
  hashResetToken,
} from '@/lib/password-reset';

export const runtime = 'nodejs';

const RESET_COOLDOWN_SECONDS = 60;

const GENERIC_MESSAGE =
  'If an account exists for that email, a password reset link has been sent.';

function noStore(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function resolveBaseUrl(req: Request): string {
  const configured = process.env.NEXTAUTH_URL?.trim().replace(/\/+$/, '');
  if (configured) return configured;

  try {
    return new URL(req.url).origin;
  } catch {
    return '';
  }
}

export async function POST(req: Request) {
  try {
    // Password resets are link-based, so email delivery is required. Fail
    // clearly (and before looking up the account) when it is not configured.
    if (!process.env.RESEND_API_KEY) {
      console.error('[forgot-password] RESEND_API_KEY is not configured');
      return noStore(
        { error: 'Password reset is temporarily unavailable. Please contact support.' },
        503
      );
    }

    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return noStore({ error: 'Email is required' }, 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find the user.
    const userRes = await query(
      'SELECT id, email FROM users WHERE lower(email) = $1',
      [normalizedEmail]
    );
    const user = userRes.rows[0];

    // Always return the same response to avoid email enumeration.
    if (!user) {
      return noStore({ message: GENERIC_MESSAGE });
    }

    // Throttle issuance: at most one link per minute per account.
    const recent = await query(
      `SELECT 1 FROM password_reset_tokens
       WHERE user_id = $1 AND created_at > NOW() - ($2 * INTERVAL '1 second')
       LIMIT 1`,
      [user.id, RESET_COOLDOWN_SECONDS]
    );
    if (recent.rowCount) {
      return noStore({ message: GENERIC_MESSAGE });
    }

    const rawToken = generateResetToken();
    const expiresAt = new Date(
      Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000
    ).toISOString();

    // Invalidate any existing unused tokens for this user.
    await query(
      'UPDATE password_reset_tokens SET used = TRUE WHERE user_id = $1 AND used = FALSE',
      [user.id]
    );

    // Store only a hash of the token. The raw token travels in the email link.
    await query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, hashResetToken(rawToken), expiresAt]
    );

    const baseUrl = resolveBaseUrl(req);
    if (!baseUrl) {
      console.error('[forgot-password] could not determine the public app URL');
      return noStore({ message: GENERIC_MESSAGE });
    }

    const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

    const sent = await sendPasswordResetEmail({
      to: user.email,
      resetUrl,
      expiresInMinutes: PASSWORD_RESET_TTL_MINUTES,
    });

    if (!sent) {
      // Do not reveal whether the account exists, but make the failure visible
      // to operators in the deployment logs.
      console.error(
        '[forgot-password] reset email could not be delivered for user id',
        user.id
      );
    }

    return noStore({ message: GENERIC_MESSAGE });
  } catch (error) {
    console.error('[forgot-password] error:', error);
    return noStore({ error: 'Internal server error' }, 500);
  }
}
