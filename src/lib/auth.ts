import { getServerSession, type DefaultSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

declare module 'next-auth' {
  interface Session {
    user: {
      id?: number;
      role?: string;
    } & DefaultSession['user'];
  }
}

export type UserRole = 'admin' | 'employee' | 'user';

export interface SessionUser {
  id: number;
  email: string;
  role: UserRole;
}

export async function currentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return {
    id: (session.user as any).id as number,
    email: session.user.email,
    role: ((session.user as any).role as UserRole) || 'user',
  };
}

export async function requireRole(allowed: UserRole[]) {
  const user = await currentUser();
  if (!user || !allowed.includes(user.role)) {
    throw new Error('Forbidden');
  }
  return user;
}

export async function requireAdmin() {
  return requireRole(['admin']);
}

export async function requireStaff() {
  return requireRole(['admin', 'employee']);
}
