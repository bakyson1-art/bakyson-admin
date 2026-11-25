import { createHash, randomBytes } from 'node:crypto';
import { pool, query } from '@/lib/db';

/** How long an emailed reset link stays valid. */
export const PASSWORD_RESET_TTL_MINUTES = 30;

/** Reset tokens shorter than this cannot be valid links. */
const MIN_TOKEN_LENGTH = 20;
const MAX_TOKEN_LENGTH = 256;

export interface ValidResetToken {
  id: number;
  userId: number;
}

/**
 * Creates a high-entropy token. Only the SHA-256 hash is stored in the
 * database, so a database leak cannot be used to reset accounts.
 */
export function generateResetToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function isPlausibleResetToken(token: unknown): token is string {
  return (
    typeof token === 'string' &&
    token.length >= MIN_TOKEN_LENGTH &&
    token.length <= MAX_TOKEN_LENGTH
  );
}

/**
 * Looks up an unused, unexpired reset token without consuming it. Used by the
 * reset page to decide whether it may render the password form.
 */
export async function findValidResetToken(
  rawToken: string | null | undefined
): Promise<ValidResetToken | null> {
  if (!isPlausibleResetToken(rawToken)) return null;

  const res = await query(
    `SELECT id, user_id
       FROM password_reset_tokens
      WHERE token = $1
        AND used = FALSE
        AND expires_at > NOW()
      LIMIT 1`,
    [hashResetToken(rawToken)]
  );

  const row = res.rows[0];
  if (!row) return null;

  return { id: row.id as number, userId: row.user_id as number };
}

/**
 * Atomically consumes a reset token and stores the new password hash.
 * Returns the affected user id, or null when the token is invalid/expired.
 */
export async function consumeResetToken(
  rawToken: string,
  passwordHash: string
): Promise<number | null> {
  if (!isPlausibleResetToken(rawToken)) return null;

  const tokenHash = hashResetToken(rawToken);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const tokenRes = await client.query(
      `SELECT id, user_id
         FROM password_reset_tokens
        WHERE token = $1
          AND used = FALSE
          AND expires_at > NOW()
        FOR UPDATE`,
      [tokenHash]
    );

    const token = tokenRes.rows[0];
    if (!token) {
      await client.query('ROLLBACK');
      return null;
    }

    await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [
      passwordHash,
      token.user_id,
    ]);

    // Burn this token and every other outstanding token for the account.
    await client.query(
      'UPDATE password_reset_tokens SET used = TRUE WHERE user_id = $1 AND used = FALSE',
      [token.user_id]
    );

    await client.query('COMMIT');
    return token.user_id as number;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
