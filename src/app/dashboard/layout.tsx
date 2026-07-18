import Link from 'next/link';
import { LogoutLink } from '@kinde-oss/kinde-auth-nextjs/components';
import { requireAuth } from '@/lib/auth';
import { getMe } from '@/lib/api';
import { DashboardNav } from './dashboard-nav';
import { CommandPalette } from '@/components/command-palette';

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

  const paletteItems = menu.map((m) => ({
    href: m.href,
    label: m.label,
    group: 'Menu',
  }));

  return (
    <div className="relative flex min-h-full flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/80 via-zinc-50 to-zinc-100">
      <div
        className="pointer-events-none absolute inset-0 [background-size:32px_32px] [background-image:linear-gradient(to_right,#e4e4e720_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e720_1px,transparent_1px)]"
        aria-hidden
      />
      <header className="sticky top-0 z-30 border-b border-zinc-200/60 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-xl">
        <div className="relative mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent" />
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="shrink-0 bg-gradient-to-r from-zinc-900 to-indigo-700 bg-clip-text text-sm font-semibold tracking-tight text-transparent"
            >
              Tempat Kost
            </Link>
            <DashboardNav items={menu} />
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <CommandPalette items={paletteItems} />
            <Link
              href="/dashboard/notifications"
              className="rounded-full px-2.5 py-1.5 text-xs text-zinc-600 transition hover:bg-white hover:shadow-sm"
            >
              Notif
            </Link>
            <LogoutLink className="rounded-full px-2.5 py-1.5 text-xs text-zinc-600 transition hover:bg-white hover:shadow-sm">
              Keluar
            </LogoutLink>
          </div>
        </div>
      </header>
      <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
