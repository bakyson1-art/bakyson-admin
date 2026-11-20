import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { updateApplication, deleteApplication } from '@/lib/admin-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const statuses = ['new', 'reviewing', 'interview', 'hired', 'rejected'] as const;

export default async function ApplicationsPage() {
  await requireAdmin();

  const res = await query(
    'SELECT * FROM job_applications ORDER BY created_at DESC',
  );
  const applications: Array<{
    id: number;
    name: string;
    email: string;
    phone: string | null;
    position: string;
    resume_url: string | null;
    cover_letter: string | null;
    status: string | null;
    created_at: Date;
  }> = res.rows;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Job Applications</h1>
        <p className="text-muted-foreground">Review applications submitted through the careers page.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="pb-3 font-medium">Applicant</th>
                  <th className="pb-3 font-medium">Position</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Applied</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id} className="border-b border-border last:border-0">
                    <td className="py-4 font-medium">{app.name}</td>
                    <td className="py-4 text-muted-foreground">{app.position}</td>
                    <td className="py-4">
                      <form action={updateApplication} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={String(app.id)} />
                        <select
                          name="status"
                          defaultValue={app.status || 'new'}
                          className="border border-border rounded-md px-2 py-1 text-sm bg-transparent focus:ring-0"
                          onChange={(e) => (e.currentTarget as HTMLSelectElement).form?.requestSubmit?.()}
                        >
                          {statuses.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        {app.status && (
                          <span className={`ml-2 text-xs font-semibold ${app.status === 'hired' ? 'text-green-600' : app.status === 'rejected' ? 'text-red-600' : 'text-gray-500'}`}>
                            {app.status}
                          </span>
                        )}
                      </form>
                    </td>
                    <td className="py-4 text-right text-muted-foreground">
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex gap-2">
                        {app.resume_url && (
                          <a
                            href={app.resume_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs border border-border rounded-md px-2 py-1 text-gray-600 hover:bg-gray-50"
                          >
                            Resume
                          </a>
                        )}
                        <form action={deleteApplication} onSubmit={(e) => {
                          if (!confirm('Delete this application?')) e.preventDefault();
                        }}>
                          <input type="hidden" name="id" value={String(app.id)} />
                          <Button type="submit" size="sm" className="bg-red-600 text-white hover:bg-red-700">
                            Delete
                          </Button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
                {applications.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">No applications found.</td>
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
