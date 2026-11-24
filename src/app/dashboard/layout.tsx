import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import DashboardShell from '@/app/dashboard/shell';

const STAFF_ROLES = new Set(['admin', 'employee']);

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Authorization happens here, in the Node.js runtime, instead of in
  // middleware. Middleware runs on the Edge runtime where `next-auth`'s
  // `withAuth` cannot see the secure session cookie name that the Node
  // runtime issues (`__Secure-next-auth.session-token`), which redirected
  // every valid login back to /login.
  const user = await currentUser();

  if (!user) {
    redirect('/login');
  }

  if (!STAFF_ROLES.has(user.role)) {
    redirect('/login?error=AccessDenied');
  }

  return <DashboardShell user={user}>{children}</DashboardShell>;
}
