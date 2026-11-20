import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { updateNewsletter, deleteNewsletter } from '@/lib/admin-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const statuses = ['active', 'unsubscribed'] as const;

export default async function NewsletterPage() {
  await requireAdmin();

  const res = await query(
    'SELECT * FROM newsletter_subscriptions ORDER BY created_at DESC',
  );
  const subscriptions: Array<{
    id: number;
    email: string;
    status: string;
    created_at: Date;
  }> = res.rows;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Newsletter</h1>
        <p className="text-muted-foreground">Manage newsletter subscribers.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscribers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Subscribed</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="border-b border-border last:border-0">
                    <td className="py-4 font-medium">{sub.email}</td>
                    <td className="py-4">
                      <form action={updateNewsletter} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={String(sub.id)} />
                        <select
                          name="status"
                          defaultValue={sub.status}
                          className="border border-border rounded-md px-2 py-1 text-sm bg-transparent focus:ring-0"
                          onChange={(e) => (e.currentTarget as HTMLSelectElement).form?.requestSubmit?.()}
                        >
                          {statuses.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <span className={`ml-2 text-xs font-semibold ${sub.status === 'active' ? 'text-green-600' : 'text-gray-500'}`}>
                          {sub.status}
                        </span>
                      </form>
                    </td>
                    <td className="py-4 text-right text-muted-foreground">
                      {new Date(sub.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 text-right">
                      <form action={deleteNewsletter} onSubmit={(e) => {
                        if (!confirm('Remove this subscriber?')) e.preventDefault();
                      }}>
                        <input type="hidden" name="id" value={String(sub.id)} />
                        <Button type="submit" size="sm" className="bg-red-600 text-white hover:bg-red-700">
                          Remove
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))}
                {subscriptions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">No subscribers found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
