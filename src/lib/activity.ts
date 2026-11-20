import { query } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export type ActivityAction =
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'project.created'
  | 'project.updated'
  | 'project.deleted'
  | 'ticket.updated'
  | 'ticket.deleted'
  | 'submission.deleted'
  | 'application.updated'
  | 'application.deleted'
  | 'newsletter.updated'
  | 'newsletter.deleted'
  | 'password.changed';

export async function logActivity({
  action,
  targetType,
  targetId,
  metadata,
}: {
  action: ActivityAction;
  targetType?: string;
  targetId?: number;
  metadata?: Record<string, unknown>;
}) {
  const user = await currentUser();
  if (!user) return;
  await query(
    `INSERT INTO activity_logs (user_id, action, target_type, target_id, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [user.id, action, targetType ?? null, targetId ?? null, metadata ?? null],
  );
}
