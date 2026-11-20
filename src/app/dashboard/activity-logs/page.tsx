import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function ActivityLogsPage() {
  await requireAdmin();

  const res = await query(
    `SELECT al.id, al.action, al.target_type, al.target_id, al.metadata, al.created_at,
            u.email AS user_email
     FROM activity_logs al
     LEFT JOIN users u ON u.id = al.user_id
     ORDER BY al.created_at DESC
     LIMIT 100`,
  );
  const logs: Array<{
    id: number;
    action: string;
    target_type: string | null;
    target_id: number | null;
    metadata: Record<string, unknown> | null;
    created_at: Date;
    user_email: string | null;
  }> = res.rows;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Activity Log</h1>
        <p className="text-muted-foreground">Recent actions taken by admins and employees.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="pb-3 font-medium">Time</th>
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium">Action</th>
                  <th className="pb-3 font-medium">Target</th>
                  <th className="pb-3 font-medium text-right">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-border last:border-0">
                    <td className="py-4 text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-4 font-medium">{log.user_email || '—'}</td>
                    <td className="py-4">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {log.action.replace('.', ' ')}
                      </span>
                    </td>
                    <td className="py-4 text-muted-foreground">
                      {log.target_type && log.target_id
                        ? `${log.target_type} #${log.target_id}`
                        : '—'}
                    </td>
                    <td className="py-4 text-right">
                      {log.metadata && Object.keys(log.metadata).length > 0 ? (
                        <span className="text-xs text-primary underline">View</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">No activity logged yet.</td>
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
