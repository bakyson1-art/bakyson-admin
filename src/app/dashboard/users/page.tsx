import { query } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { updateUserRole, deleteUser } from '@/lib/admin-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import bcrypt from 'bcryptjs';

const roles = ['admin', 'employee', 'user'] as const;

export default async function UsersPage() {
  await requireAdmin();

  const res = await query(
    'SELECT id, email, role, created_at FROM users ORDER BY id ASC',
  );
  const users: Array<{ id: number; email: string; role: string; created_at: Date }> =
    res.rows;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-muted-foreground">Manage website users, employees, and admin access.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>All Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-muted-foreground">
                  <tr>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Role</th>
                    <th className="pb-3 font-medium text-right">Joined</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-border last:border-0">
                      <td className="py-4">{user.email}</td>
                      <td className="py-4">
                        <form action={updateUserRole} className="flex items-center gap-2">
                          <input type="hidden" name="id" value={String(user.id)} />
                          <select
                            name="role"
                            defaultValue={user.role}
                            className="border border-border rounded-md px-2 py-1 text-sm bg-transparent focus:ring-0"
                            onChange={(e) => (e.currentTarget as HTMLSelectElement).form?.requestSubmit?.()}
                          >
                            {roles.map((r) => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </form>
                      </td>
                      <td className="py-4 text-right text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 text-right">
                        <form action={deleteUser} onSubmit={(e) => {
                          if (!confirm('Delete this user? This cannot be undone.')) e.preventDefault();
                        }}>
                          <input type="hidden" name="id" value={String(user.id)} />
                          <Button type="submit" size="sm" className="bg-red-600 text-white hover:bg-red-700" disabled={user.id === 1}>
                            Delete
                          </Button>
                        </form>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted-foreground">No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full lg:w-80">
          <CardHeader>
            <CardTitle>Add User</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              action={async (formData: FormData) => {
                'use server';
                await requireAdmin();
                const email = String(formData.get('email'));
                const password = String(formData.get('password'));
                const role = String(formData.get('role'));
                if (!email || !password) throw new Error('Email and password are required');
                if (password.length < 8) throw new Error('Password must be at least 8 characters');
                const hash = await bcrypt.hash(password, 10);
                await query(
                  'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)',
                  [email, hash, role],
                );
              }}
            >
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <Input name="email" type="email" placeholder="email@company.com" required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Password</label>
                <Input name="password" type="password" required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Role</label>
                <select name="role" defaultValue="user" className="w-full border border-border rounded-md px-3 py-2 text-sm bg-white">
                  {roles.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <Button type="submit" className="w-full">Create user</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
