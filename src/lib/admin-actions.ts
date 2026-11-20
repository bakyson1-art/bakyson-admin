'use server';

import { revalidatePath } from 'next/cache';
import { query } from '@/lib/db';
import { requireAdmin, requireStaff, currentUser } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { sendTicketStatusEmail } from '@/lib/email';
import bcrypt from 'bcryptjs';

async function withLog<T>(
  action: Parameters<typeof logActivity>[0]['action'],
  targetType: string | undefined,
  targetId: number | undefined,
  metadata: Record<string, unknown> | undefined,
  fn: () => Promise<T>,
): Promise<T> {
  const result = await fn();
  await logActivity({ action, targetType, targetId, metadata });
  return result;
}

export async function updateUserRole(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  const role = String(formData.get('role'));
  const email = String(formData.get('email') ?? '');
  if (!['admin', 'employee', 'user'].includes(role)) throw new Error('Invalid role');
  return withLog(
    'user.updated',
    'user',
    id,
    { role, email },
    async () => {
      await query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
      revalidatePath('/admin/users');
    },
  );
}

export async function deleteUser(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  const me = await requireAdmin();
  if (id === me.id) throw new Error('You cannot delete your own account');
  const userRes = await query('SELECT email FROM users WHERE id = $1', [id]);
  const email = userRes.rows[0]?.email as string | undefined;
  return withLog(
    'user.deleted',
    'user',
    id,
    { email },
    async () => {
      await query('DELETE FROM users WHERE id = $1', [id]);
      revalidatePath('/admin/users');
    },
  );
}

export async function createProject(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get('name'));
  const status = String(formData.get('status') || 'active');
  const location = String(formData.get('location') || null);
  const manager = String(formData.get('manager') || null);
  const startDate = String(formData.get('start_date') || null);
  const endDate = String(formData.get('end_date') || null);
  if (!name) throw new Error('Project name is required');
  const user = await currentUser();
  return withLog(
    'project.created',
    'project',
    undefined,
    { name, status, location, manager },
    async () => {
      const res = await query(
        `INSERT INTO projects (user_id, name, status, location, manager, start_date, end_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [user?.id ?? null, name, status, location, manager, startDate, endDate],
      );
      revalidatePath('/dashboard/projects');
      return res.rows[0]?.id;
    },
  );
}

export async function updateProject(formData: FormData) {
  await requireStaff();
  const id = Number(formData.get('id'));
  const status = String(formData.get('status'));
  const progress = Number(formData.get('progress')) || null;
  const name = String(formData.get('name') || null);
  const location = String(formData.get('location') || null);
  const manager = String(formData.get('manager') || null);
  return withLog(
    'project.updated',
    'project',
    id,
    { status, progress, name, location, manager },
    async () => {
      await query(
        `UPDATE projects
         SET status = $1, progress = $2, name = COALESCE($3, name),
             location = COALESCE($4, location), manager = COALESCE($5, manager)
         WHERE id = $6`,
        [status, progress, name, location, manager, id],
      );
      revalidatePath('/dashboard/projects');
    },
  );
}

export async function deleteProject(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  const projRes = await query('SELECT name FROM projects WHERE id = $1', [id]);
  const name = projRes.rows[0]?.name as string | undefined;
  return withLog(
    'project.deleted',
    'project',
    id,
    { name },
    async () => {
      await query('DELETE FROM projects WHERE id = $1', [id]);
      revalidatePath('/dashboard/projects');
    },
  );
}

export async function updateTicket(formData: FormData) {
  await requireStaff();
  const id = Number(formData.get('id'));
  const status = String(formData.get('status'));
  const ticketRes = await query(
    `SELECT t.subject, t.status AS old_status, u.email AS user_email
     FROM tickets t
     LEFT JOIN users u ON u.id = t.user_id
     WHERE t.id = $1`,
    [id],
  );
  const ticket = ticketRes.rows[0];
  const oldStatus = ticket?.old_status as string | undefined;
  if (!ticket) throw new Error('Ticket not found');
  if (status === oldStatus) {
    revalidatePath('/dashboard/tickets');
    return;
  }
  return withLog(
    'ticket.updated',
    'ticket',
    id,
    { status, old_status: oldStatus, subject: ticket.subject },
    async () => {
      await query('UPDATE tickets SET status = $1 WHERE id = $2', [status, id]);
      revalidatePath('/dashboard/tickets');
      if (ticket.user_email) {
        await sendTicketStatusEmail({
          to: ticket.user_email,
          subject: ticket.subject,
          status,
          ticketId: id,
        });
      }
    },
  );
}

export async function deleteTicket(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  const tkRes = await query('SELECT subject FROM tickets WHERE id = $1', [id]);
  const subject = tkRes.rows[0]?.subject as string | undefined;
  return withLog(
    'ticket.deleted',
    'ticket',
    id,
    { subject },
    async () => {
      await query('DELETE FROM tickets WHERE id = $1', [id]);
      revalidatePath('/dashboard/tickets');
    },
  );
}

export async function deleteSubmission(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  const subRes = await query('SELECT name FROM submissions WHERE id = $1', [id]);
  const name = subRes.rows[0]?.name as string | undefined;
  return withLog(
    'submission.deleted',
    'submission',
    id,
    { name },
    async () => {
      await query('DELETE FROM submissions WHERE id = $1', [id]);
      revalidatePath('/dashboard/submissions');
    },
  );
}

export async function updateApplication(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  const status = String(formData.get('status'));
  const appRes = await query('SELECT name, position FROM job_applications WHERE id = $1', [id]);
  const app = appRes.rows[0];
  return withLog(
    'application.updated',
    'application',
    id,
    { status, position: app?.position },
    async () => {
      await query('UPDATE job_applications SET status = $1 WHERE id = $2', [status, id]);
      revalidatePath('/dashboard/applications');
    },
  );
}

export async function deleteApplication(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  const appRes = await query('SELECT name FROM job_applications WHERE id = $1', [id]);
  const name = appRes.rows[0]?.name as string | undefined;
  return withLog(
    'application.deleted',
    'application',
    id,
    { name },
    async () => {
      await query('DELETE FROM job_applications WHERE id = $1', [id]);
      revalidatePath('/dashboard/applications');
    },
  );
}

export async function updateNewsletter(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  const status = String(formData.get('status'));
  const subRes = await query('SELECT email FROM newsletter_subscriptions WHERE id = $1', [id]);
  const email = subRes.rows[0]?.email as string | undefined;
  return withLog(
    'newsletter.updated',
    'newsletter',
    id,
    { status, email },
    async () => {
      await query('UPDATE newsletter_subscriptions SET status = $1 WHERE id = $2', [status, id]);
      revalidatePath('/dashboard/newsletter');
    },
  );
}

export async function deleteNewsletter(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  const subRes = await query('SELECT email FROM newsletter_subscriptions WHERE id = $1', [id]);
  const email = subRes.rows[0]?.email as string | undefined;
  return withLog(
    'newsletter.deleted',
    'newsletter',
    id,
    { email },
    async () => {
      await query('DELETE FROM newsletter_subscriptions WHERE id = $1', [id]);
      revalidatePath('/dashboard/newsletter');
    },
  );
}

export async function changePassword(formData: FormData) {
  const user = await requireStaff();
  const password = String(formData.get('password'));
  if (password.length < 8) throw new Error('Password must be at least 8 characters');
  const hash = await bcrypt.hash(password, 10);
  return withLog(
    'password.changed',
    'user',
    user.id,
    {},
    async () => {
      await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, user.id]);
      revalidatePath('/dashboard/settings');
    },
  );
}
