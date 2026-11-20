'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignOutButton } from '@/components/admin/sign-out-button';
import {
  LayoutDashboard,
  Users,
  Building2,
  Ticket,
  FileText,
  Briefcase,
  Mail,
  Settings,
  ShieldAlert,
  Menu,
  Activity,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/users', label: 'Users', icon: Users, role: 'admin' as const },
  { href: '/dashboard/projects', label: 'Projects', icon: Building2 },
  { href: '/dashboard/tickets', label: 'Tickets', icon: Ticket },
  { href: '/dashboard/submissions', label: 'Submissions', icon: FileText },
  { href: '/dashboard/applications', label: 'Job Applications', icon: Briefcase },
  { href: '/dashboard/newsletter', label: 'Newsletter', icon: Mail },
  { href: '/dashboard/activity-logs', label: 'Activity Log', icon: Activity, role: 'admin' as const },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardShell({
  user,
  children,
}: {
  user: { role?: string; email?: string } | null;
  children: React.ReactNode;
}) {
  const role = user?.role;
  const pathname = usePathname();
  const activeCls = 'bg-slate-800 text-white shadow-sm';
  const inactiveCls = 'text-slate-300 hover:bg-slate-800/50 hover:text-white';

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden">
      <aside className="fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-slate-200 transform -translate-x-full transition-transform duration-300 lg:translate-x-0">
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
          <Link href="/dashboard" className="font-bold text-xl tracking-tight text-white">
            Bakyson Admin
          </Link>
          <button className="lg:hidden p-2 text-slate-400 hover:text-white" aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </button>
        </div>
        <nav className="mt-6 px-3 space-y-1" aria-label="Main navigation">
          {navItems
            .filter((item) => !item.role || item.role === role)
            .map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition ${isActive ? activeCls : inactiveCls}`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
        </nav>
        <div className="mt-auto px-6 pb-6 border-t border-slate-800">
          <p className="text-xs text-slate-500 mb-3">Logged in as {user?.email}</p>
          <SignOutButton />
        </div>
      </aside>

      <div className="lg:hidden fixed inset-0 z-20 bg-black/40 hidden" aria-hidden="true" />

      <div className="flex-1 pl-0 lg:pl-64 overflow-y-auto">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-6 lg:px-8">
          <button className="lg:hidden p-2 text-gray-500 hover:text-gray-700" aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="flex-1 text-sm font-semibold text-gray-700 uppercase tracking-wider">
            {navItems.find((i) => i.href === pathname)?.label || 'Admin'}
          </h1>
          <ShieldAlert className="h-5 w-5 text-primary" aria-label="Admin area" />
        </header>
        <main className="p-6 lg:p-8 space-y-6 flex-1">{children}</main>
      </div>
    </div>
  );
}
