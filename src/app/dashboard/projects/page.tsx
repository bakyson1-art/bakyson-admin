import { query } from '@/lib/db';
import { requireStaff } from '@/lib/auth';
import { createProject, updateProject, deleteProject } from '@/lib/admin-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AutoSubmitForm, ConfirmForm } from '@/components/admin/interactive-forms';

const statuses = ['active', 'on_hold', 'completed', 'cancelled'] as const;

export default async function ProjectsPage() {
  await requireStaff();

  const res = await query(
    `SELECT p.id, p.name, p.status, p.progress, p.location, p.manager, p.created_at,
            u.email AS manager_email
     FROM projects p
     LEFT JOIN users u ON u.id = p.user_id
     ORDER BY p.created_at DESC`,
  );
  const projects: Array<{
    id: number;
    name: string;
    status: string | null;
    progress: number | null;
    location: string | null;
    manager: string | null;
    manager_email: string | null;
    created_at: Date;
  }> = res.rows;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Projects</h1>
        <p className="text-muted-foreground">Track project status and progress across the business.</p>
      </div>

      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle>Create Project</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createProject} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Project name</Label>
              <Input id="name" name="name" placeholder="e.g. Nairobi HQ Cabling" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue="active"
                className="w-full border border-border rounded-md px-3 py-2 text-sm bg-white"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" placeholder="City / site" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="manager">Manager</Label>
              <Input id="manager" name="manager" placeholder="Project manager name" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="start_date">Start date</Label>
              <Input id="start_date" name="start_date" type="date" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="end_date">End date</Label>
              <Input id="end_date" name="end_date" type="date" />
            </div>
            <Button type="submit" className="md:col-span-1 w-full">Create project</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="pb-3 font-medium">Project</th>
                  <th className="pb-3 font-medium">Location</th>
                  <th className="pb-3 font-medium">Manager</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Progress</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id} className="border-b border-border last:border-0">
                    <td className="py-4 font-medium">{project.name}</td>
                    <td className="py-4 text-muted-foreground">{project.location || '—'}</td>
                    <td className="py-4 text-muted-foreground">{project.manager_email || project.manager || '—'}</td>
                    <td className="py-4">
                      <AutoSubmitForm
                        action={updateProject}
                        hidden={{ id: project.id }}
                        className="flex items-center gap-2"
                      >
                        <select
                          name="status"
                          defaultValue={project.status || 'active'}
                          className="border border-border rounded-md px-2 py-1 text-sm bg-transparent focus:ring-0"
                        >
                          {statuses.map((s) => (
                            <option key={s} value={s}>{s.replace('_', ' ')}</option>
                          ))}
                        </select>
                      </AutoSubmitForm>
                    </td>
                    <td className="py-4 text-right">
                      <AutoSubmitForm
                        action={updateProject}
                        hidden={{ id: project.id }}
                        className="flex items-center gap-2"
                      >
                        <input
                          name="progress"
                          type="number"
                          min="0"
                          max="100"
                          defaultValue={project.progress ?? 0}
                          className="w-20 border border-border rounded-md px-2 py-1 text-sm text-right bg-transparent focus:ring-0"
                        />
                        <span className="text-xs text-muted-foreground">%</span>
                      </AutoSubmitForm>
                    </td>
                    <td className="py-4 text-right">
                      <ConfirmForm
                        action={deleteProject}
                        hidden={{ id: project.id }}
                        confirmMessage="Delete this project?"
                      >
                        <Button type="submit" variant="destructive" size="sm">
                          Delete
                        </Button>
                      </ConfirmForm>
                    </td>
                  </tr>
                ))}
                {projects.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">No projects found.</td>
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
