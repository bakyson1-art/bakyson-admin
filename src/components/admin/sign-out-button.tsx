'use client';

import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function SignOutButton({ className }: { className?: string }) {
  return (
    <form action="/api/admin/signout" method="POST" className={className}>
      <Button type="submit" size="sm" className="w-full text-left gap-2 px-3 py-2 text-sm">
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>
    </form>
  );
}
