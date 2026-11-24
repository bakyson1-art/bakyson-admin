# Bakyson Admin Dashboard

Standalone admin/employee dashboard for Bakyson ICT Solutions. This is a separate
Next.js application from the public website and is deployed as its own service.

- **Public site repo:** https://github.com/bakyson1-art/bakyson
- **This repo:** https://github.com/bakyson1-art/bakyson-admin

## What it does

| Route | Purpose |
| --- | --- |
| `/login` | Staff sign-in (NextAuth credentials) |
| `/dashboard` | KPIs, recent tickets, recent activity |
| `/dashboard/users` | Create users, change roles, delete accounts |
| `/dashboard/projects` | Create projects, update status/progress |
| `/dashboard/tickets` | Update ticket status (sends customer e-mail) |
| `/dashboard/submissions` | Contact form submissions |
| `/dashboard/applications` | Job applications |
| `/dashboard/newsletter` | Newsletter subscribers |
| `/dashboard/activity-logs` | Audit trail of admin actions |
| `/dashboard/settings` | Account settings |

Access is limited to users whose `role` is `admin` or `employee` in the shared
`users` table. Destructive actions require `admin`.

## Architecture

This app shares the **same PostgreSQL database** as the public site. It does not
have its own migrations or copy of the schema - the schema lives in the public
repo at `database/schema.sql`. Apply it once (and create admin accounts) with the
public repo's setup script: `node scripts/db-setup.mjs`.

`NEXTAUTH_SECRET` must match the public site exactly. Sessions are still scoped to
the host, so signing into the public site does not sign you into the dashboard.

## Local development

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3001
```

Use port 3001 so it does not clash with the public site on 3000:

```bash
npm run dev -- -p 3001
```

Set `NEXTAUTH_URL=http://localhost:3001` before starting, otherwise redirects
after login will point at the wrong port.

## Deploying

The repo includes a `Dockerfile` and `railway.toml`, so Railway can build it
directly:

1. Create a new service from this repo.
2. Attach the existing PostgreSQL database (`DATABASE_URL` is injected by Railway).
3. Set `NEXTAUTH_SECRET` (same value as the public site) and `NEXTAUTH_URL`
   (this service's public URL).
4. Optionally set `RESEND_API_KEY`.
5. Deploy. Healthcheck: `GET /api/health`.

## Troubleshooting sign-in

"Invalid email or password" means the credentials provider rejected the attempt.
To see exactly why, set a `DIAG_TOKEN` variable on the service and open:

```
https://YOUR-ADMIN-DOMAIN/api/diagnose?token=YOUR-DIAG-TOKEN
```

It reports whether `DATABASE_URL`/`NEXTAUTH_SECRET` are present, whether the
`users` table exists, and which accounts exist. To test a password as well:

```powershell
Invoke-RestMethod -Uri "https://YOUR-ADMIN-DOMAIN/api/diagnose" -Method Post `
  -Headers @{ "x-diag-token" = "YOUR-DIAG-TOKEN" } -ContentType "application/json" `
  -Body '{"email":"you@example.com","password":"your-password"}'
```

Unset `DIAG_TOKEN` (or delete `src/app/api/diagnose`) when finished.

## Security notes

- Change the seeded admin password immediately after first login.
- The Resend sender address in `src/lib/email.ts` must be on a domain you have
  verified with Resend; otherwise ticket e-mails will fail silently.
- Never commit `.env*` files. Only `.env.example` belongs in the repo.
