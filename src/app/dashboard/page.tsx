import { query } from '@/lib/db';
import { requireStaff, currentUser } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

export default async function DashboardPage() {
  await requireStaff();
  const isAdmin = (await currentUser())?.role === 'admin';

  const [
    usersRes,
    projectsRes,
    ticketsRes,
    submissionsRes,
    recentTicketsRes,
    recentActivityRes,
  ] = await Promise.all([
    query('SELECT count(*) FROM users'),
    query('SELECT count(*) FROM projects'),
    query('SELECT count(*) FROM tickets'),
    query('SELECT count(*) FROM submissions'),
    query('SELECT id, subject, priority, status, created_at FROM tickets ORDER BY created_at DESC LIMIT 5'),
    isAdmin ? query('SELECT al.action, al.target_type, al.target_id, al.created_at, u.email AS user_email FROM activity_logs al LEFT JOIN users u ON u.id = al.user_id ORDER BY al.created_at DESC LIMIT 5') : { rows: [] },
  ]);

  const stats = [
    { title: 'Total Users', value: parseInt(usersRes.rows[0].count, 10), href: '/dashboard/users' },
    { title: 'Projects', value: parseInt(projectsRes.rows[0].count, 10), href: '/dashboard/projects' },
    { title: 'Support Tickets', value: parseInt(ticketsRes.rows[0].count, 10), href: '/dashboard/tickets' },
    { title: 'Contact Submissions', value: parseInt(submissionsRes.rows[0].count, 10), href: '/dashboard/submissions' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your website and business operations.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <Link
                href={stat.href}
                className="mt-2 inline-block text-xs sm:text-sm text-primary hover:underline"
              >
                Manage →
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 sm:gap-8 md:grid-cols-12">
        {/* Recent Tickets */}
        <div className="md:span-8 lg:span-7">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Recent Support Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              {recentTicketsRes.rows.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm text-left">
                      <thead className="text-muted-foreground">
                        <tr>
                          <th className="pb-2 sm:pb-3 font-medium">Subject</th>
                          <th className="pb-2 sm:pb-3 font-medium">Priority</th>
                          <th className="pb-2 sm:pb-3 font-medium">Status</th>
                          <th className="pb-2 sm:pb-3 font-medium text-right">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentTicketsRes.rows.map((ticket: any) => (
                          <tr key={ticket.id} className="border-b border-border last:border-0">
                            <td className="py-2 sm:py-3">{ticket.subject}</td>
                            <td className="py-2 sm:py-3">
                              <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs font-semibold ${ticket.priority === 'high' ? 'bg-red-100 text-red-800' : ticket.priority === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}`}>
                                {ticket.priority}
                              </span>
                            </td>
                            <td className="py-2 sm:py-3">
                              <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs font-semibold ${ticket.status === 'open' ? 'bg-blue-100 text-blue-800' : ticket.status === 'in_progress' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                                {ticket.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-2 sm:py-3 text-right text-muted-foreground text-[10px] sm:text-xs">
                              {new Date(ticket.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Link href="/dashboard/tickets" className="mt-3 block text-sm text-primary hover:underline">View all tickets →</Link>
                </>
              ) : (
                <EmptyState
                  title="No tickets yet"
                  description="No support tickets have been created. Tickets from the contact form will appear here."
                  action={
                    <Link href="/dashboard/tickets" className="px-4 py-2 text-sm text-primary underline">View all tickets</Link>
                  }
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity (Admin only) */}
        {isAdmin && (
          <div className="md:span-4 lg:span-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivityRes.rows.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivityRes.rows.map((log: any) => (
                      <div key={log.action + log.created_at} className="flex items-start gap-2 text-xs sm:text-sm">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {log.action.replace('.', ' ')}
                        </span>
                        <div className="text-muted-foreground text-[10px] sm:text-xs">
                          {log.user_email || 'System'}<br />
                          {new Date(log.created_at).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No activity yet"
                    description="Admin actions will appear here in the activity log."
                  />
                )}
                <Link href="/dashboard/activity-logs" className="mt-3 block text-sm text-primary hover:underline">View full activity log →</Link>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className={isAdmin ? "md:span-4 lg:span-5" : "md:span-4 lg:span-9"}>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/dashboard/tickets" className="block px-3 py-2.5 text-sm text-left rounded-lg bg-primary text-white hover:bg-primary-800">Respond to tickets</Link>
              <Link href="/dashboard/projects" className="block px-3 py-2.5 text-sm text-left rounded-lg bg-white border border-border text-gray-900 hover:bg-gray-50">Manage projects</Link>
              {isAdmin && (
                <>
                  <Link href="/dashboard/users" className="block px-3 py-2.5 text-sm text-left rounded-lg bg-white border border-border text-gray-900 hover:bg-gray-50">Manage users & access</Link>
                  <Link href="/dashboard/activity-logs" className="block px-3 py-2.5 text-sm text-left rounded-lg bg-white border border-border text-gray-900 hover:bg-gray-50">View activity log</Link>
                </>
              )}
              <Link href="/dashboard/submissions" className="block px-3 py-2.5 text-sm text-left rounded-lg bg-white border border-border text-gray-900 hover:bg-gray-50">Review contact submissions</Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
