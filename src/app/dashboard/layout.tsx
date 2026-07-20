import { Suspense } from 'react';
import { requireAuth } from '@/lib/auth';
import { getMe } from '@/lib/api';
import { DashboardShell } from './dashboard-shell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  let menu: Array<{ href: string; label: string }> = [];
  try {
    const me = await getMe();
    menu = me.menu ?? [];
  } catch {
    menu = [{ href: '/dashboard', label: 'Overview' }];
  }

  if (menu.length === 0) {
    menu = [{ href: '/dashboard', label: 'Overview' }];
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-full bg-zinc-50 px-4 py-8 sm:px-6">
          <div className="mx-auto max-w-6xl animate-pulse">
            <div className="h-7 w-40 rounded bg-zinc-200" />
            <div className="mt-8 h-40 rounded-2xl border border-zinc-200 bg-white" />
          </div>
        </div>
      }
    >
      <DashboardShell menu={menu}>{children}</DashboardShell>
    </Suspense>
  );
}
