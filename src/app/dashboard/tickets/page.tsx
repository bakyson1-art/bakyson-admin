import { query } from '@/lib/db';
import { requireStaff } from '@/lib/auth';
import { updateTicket, deleteTicket } from '@/lib/admin-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AutoSubmitForm, ConfirmForm } from '@/components/admin/interactive-forms';
import { EmptyState } from '@/components/ui/empty-state';

const statuses = ['open', 'in_progress', 'resolved', 'closed'] as const;

export default async function TicketsPage() {
  await requireStaff();

  const res = await query(
    `SELECT t.id, t.subject, t.description, t.priority, t.status, t.created_at,
            u.email AS user_email, p.name AS project_name
     FROM tickets t
     LEFT JOIN users u ON u.id = t.user_id
     LEFT JOIN projects p ON p.id = t.project_id
     ORDER BY t.created_at DESC`,
  );
  const tickets: Array<{
    id: number;
    subject: string;
    description: string | null;
    priority: string | null;
    status: string | null;
    user_email: string | null;
    project_name: string | null;
    created_at: Date;
  }> = res.rows;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Support Tickets</h1>
        <p className="text-muted-foreground">View and update customer support tickets.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">All Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm text-left">
                  <thead className="text-muted-foreground">
                    <tr>
                      <th className="pb-2 sm:pb-3 font-medium">Subject</th>
                      <th className="pb-2 sm:pb-3 font-medium">Customer</th>
                      <th className="pb-2 sm:pb-3 font-medium">Project</th>
                      <th className="pb-2 sm:pb-3 font-medium">Priority</th>
                      <th className="pb-2 sm:pb-3 font-medium">Status</th>
                      <th className="pb-2 sm:pb-3 font-medium text-right">Created</th>
                      <th className="pb-2 sm:pb-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((ticket) => (
                      <tr key={ticket.id} className="border-b border-border last:border-0">
                        <td className="py-2 sm:py-3 font-medium">{ticket.subject}</td>
                        <td className="py-2 sm:py-3 text-muted-foreground">{ticket.user_email || '—'}</td>
                        <td className="py-2 sm:py-3 text-muted-foreground">{ticket.project_name || '—'}</td>
                        <td className="py-2 sm:py-3">
                          <span className={`px-2 py-1 rounded-full text-[10px] sm:text-xs font-semibold ${ticket.priority === 'high' ? 'bg-red-100 text-red-800' : ticket.priority === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}`}>
                            {ticket.priority || '—'}
                          </span>
                        </td>
                        <td className="py-2 sm:py-3">
                          <AutoSubmitForm
                            action={updateTicket}
                            hidden={{ id: ticket.id }}
                            className="flex items-center gap-2"
                          >
                            <select
                              name="status"
                              defaultValue={ticket.status || 'open'}
                              className="border border-border rounded-md px-2 py-1 text-xs sm:text-xs bg-transparent focus:ring-0"
                            >
                              {statuses.map((s) => (
                                <option key={s} value={s}>{s.replace('_', ' ')}</option>
                              ))}
                            </select>
                          </AutoSubmitForm>
                        </td>
                        <td className="py-2 sm:py-3 text-right text-muted-foreground text-[10px] sm:text-xs">
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-2 sm:py-3 text-right">
                          <ConfirmForm
                            action={deleteTicket}
                            hidden={{ id: ticket.id }}
                            confirmMessage="Delete this ticket?"
                          >
                            <Button type="submit" size="sm" className="bg-red-600 text-white hover:bg-red-700">
                              Delete
                            </Button>
                          </ConfirmForm>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <EmptyState
              title="No tickets found"
              description="Support tickets from the contact form will appear here."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
