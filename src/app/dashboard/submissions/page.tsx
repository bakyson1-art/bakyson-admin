import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { deleteSubmission } from '@/lib/admin-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default async function SubmissionsPage() {
  await requireAdmin();

  const res = await query(
    'SELECT * FROM submissions ORDER BY created_at DESC',
  );
  const submissions: Array<{
    id: number;
    name: string;
    email: string;
    phone: string | null;
    company: string | null;
    service: string | null;
    message: string;
    created_at: Date;
  }> = res.rows;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Contact Submissions</h1>
        <p className="text-muted-foreground">Messages sent through the website contact form.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Email</th>
                  <th className="pb-3 font-medium">Company</th>
                  <th className="pb-3 font-medium">Service</th>
                  <th className="pb-3 font-medium text-right">Received</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => (
                  <tr key={sub.id} className="border-b border-border last:border-0">
                    <td className="py-4 font-medium">{sub.name}</td>
                    <td className="py-4 text-muted-foreground">{sub.email}</td>
                    <td className="py-4 text-muted-foreground">{sub.company || '—'}</td>
                    <td className="py-4 text-muted-foreground">{sub.service || '—'}</td>
                    <td className="py-4 text-right text-muted-foreground">
                      {new Date(sub.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 text-right">
                      <form action={deleteSubmission} onSubmit={(e) => {
                        if (!confirm('Delete this submission?')) e.preventDefault();
                      }}>
                        <input type="hidden" name="id" value={String(sub.id)} />
                        <Button type="submit" size="sm" className="bg-red-600 text-white hover:bg-red-700">
                          Delete
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))}
                {submissions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">No submissions found.</td>
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
