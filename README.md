# Bakyson Admin Dashboard

Standalone admin/employee dashboard for Bakyson ICT Solutions. This is a separate
Next.js application from the public website and is deployed as its own service.

- **Public site repo:** https://github.com/bakyson1-art/bakyson
- **This repo:** https://github.com/bakyson1-art/bakyson-admin

## What it does

| Route | Purpose |
| --- | --- |
| `/login` | Staff sign-in (NextAuth credentials) |
| `/forgot-password` | Request a secure password reset link by email |
| `/reset-password?token=...` | Choose a new password (only reachable from a valid emailed link) |
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

Authorization is enforced in `src/app/dashboard/layout.tsx` (Node.js runtime) and
by `requireAdmin`/`requireStaff` inside every server action - deliberately **not**
in middleware. NextAuth v4's `withAuth` runs on the Edge runtime, where it can
disagree with the Node runtime about the session cookie name
(`next-auth.session-token` vs `__Secure-next-auth.session-token`) and bounce valid
logins back to `/login`.

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
4. Set `RESEND_API_KEY` and `RESEND_FROM` to enable password-reset emails
   (required for the forgot-password flow; also enables ticket emails).
5. Deploy. Healthcheck: `GET /api/health`.

## Password resets

`/forgot-password` always shows the same "check your email" screen so it never
reveals whether an account exists. For real accounts it emails a random,
single-use link that expires after 30 minutes. Only a SHA-256 hash of the token
is stored in `password_reset_tokens`, so reading the database cannot produce a
working reset URL.

The reset page validates the token before rendering the form. Submitting the new
password consumes the token and invalidates every other outstanding link for
that account.

This flow needs email delivery to work:

- Set `RESEND_API_KEY`.
- Set `RESEND_FROM` to a sender on a domain verified in Resend. Resend's
  `onboarding@resend.dev` sender only delivers to the Resend account owner.
- `NEXTAUTH_URL` must be this admin app's public URL, because it is used to build
  the link in the email.

If email delivery fails, the API still returns the same generic response (to
avoid account enumeration) but logs the failure in the deployment logs.

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
