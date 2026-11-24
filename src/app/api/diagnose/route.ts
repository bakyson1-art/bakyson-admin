import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Temporary troubleshooting endpoint for the admin sign-in.
 *
 * Enabled only when DIAG_TOKEN is set (falls back to NEXTAUTH_SECRET so it can
 * be used without adding a Railway variable). Remove the env var - or delete
 * this file - once sign-in works.
 */

const MAX_PASSWORD_CHECKS = 10;
let passwordChecks = 0;

function authorised(req: Request, token: string | null): boolean {
  const expected = process.env.DIAG_TOKEN || process.env.NEXTAUTH_SECRET;
  if (!expected || !token) return false;
  if (token.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i += 1) {
    mismatch |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

function describeDatabaseUrl(url: string | undefined) {
  if (!url) return 'missing';
  try {
    const parsed = new URL(url);
    return `set (${parsed.hostname}:${parsed.port || 5432}${parsed.pathname})`;
  } catch {
    return 'set (unparseable URL)';
  }
}

async function collect(email: string | null, password: string | null) {
  const result: Record<string, unknown> = {
    env: {
      DATABASE_URL: describeDatabaseUrl(process.env.DATABASE_URL),
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'set' : 'missing',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? 'missing',
      NODE_ENV: process.env.NODE_ENV,
    },
  };

  try {
    const { rows } = await query(
      `SELECT id, email, role, password_hash, created_at FROM users ORDER BY id`
    );
    result.schema = {
      usersTable: true,
      userCount: rows.length,
    };
    result.users = rows.map((row) => ({
      id: row.id,
      email: row.email,
      role: row.role,
      hashScheme: String(row.password_hash ?? '').split('$')[1] ?? '(unknown)',
      hashLength: String(row.password_hash ?? '').length,
      createdAt: row.created_at,
    }));
  } catch (error) {
    result.schema = {
      usersTable: false,
      error: String((error as Error)?.message ?? error),
    };
    return result;
  }

  if (email) {
    const { rows } = await query(
      `SELECT id, email, role, password_hash, created_at FROM users WHERE lower(email) = $1`,
      [email.trim().toLowerCase()]
    );
    const user = rows[0];
    const lookup: Record<string, unknown> = {
      email: email.trim().toLowerCase(),
      exists: Boolean(user),
    };
    if (user) {
      lookup.id = user.id;
      lookup.role = user.role;
      lookup.createdAt = user.created_at;
      if (password) {
        if (passwordChecks >= MAX_PASSWORD_CHECKS) {
          lookup.passwordMatches = 'locked (too many checks, restart the service)';
        } else {
          passwordChecks += 1;
          lookup.passwordMatches = await bcrypt.compare(password, user.password_hash);
        }
      }
    }
    result.lookup = lookup;
  }

  return result;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (!authorised(req, url.searchParams.get('token'))) {
    return new NextResponse('Not found', { status: 404 });
  }
  const email = url.searchParams.get('email');
  return NextResponse.json(await collect(email, null));
}

export async function POST(req: Request) {
  if (!authorised(req, req.headers.get('x-diag-token'))) {
    return new NextResponse('Not found', { status: 404 });
  }
  let body: { email?: string; password?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Expected JSON body { email, password }' }, { status: 400 });
  }
  return NextResponse.json(await collect(body.email ?? null, body.password ?? null));
}
