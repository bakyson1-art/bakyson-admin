import { currentUser } from '@/lib/auth';
import DashboardShell from '@/app/dashboard/shell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
