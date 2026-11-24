import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

/**
 * Railway's internal URL (postgres.railway.internal) works without TLS, but the
 * public proxy (*.proxy.rlwy.net) requires it. Passing no ssl option means `pg`
 * connects in plaintext, which the proxy rejects.
 */
function needsSsl(url: string | undefined): boolean {
  if (!url) return false;
  if (/[?&]sslmode=require/i.test(url)) return true;
  try {
    const { hostname } = new URL(url);
    return /\.rlwy\.net$/i.test(hostname);
  } catch {
    return false;
  }
}

export const pool = new Pool({
  connectionString,
  ...(needsSsl(connectionString) ? { ssl: { rejectUnauthorized: false } } : {}),
});

export async function query(text: string, params?: any[]) {
  const res = await pool.query(text, params);
  return res;
}
