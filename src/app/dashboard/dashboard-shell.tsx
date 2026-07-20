'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { LogoutLink } from '@kinde-oss/kinde-auth-nextjs/components';
import { CommandPalette } from '@/components/command-palette';
import {
  groupMenuItems,
  isNavActive,
  type MenuItem,
  paletteItemsFromMenu,
} from '@/lib/nav-taxonomy';
import { withWorkspace } from '@/lib/workspace-query';
import { cn } from '@/lib/utils';

function NavLink({
  item,
  workspaceId,
  onNavigate,
  dense,
}: {
  item: MenuItem;
  workspaceId: string | null;
  onNavigate?: () => void;
  dense?: boolean;
}) {
  const pathname = usePathname();
  const active = isNavActive(pathname, item.href);
  const href = withWorkspace(item.href, workspaceId);

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      onClick={onNavigate}
      className={cn(
        'block rounded-lg font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800',
        dense ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm',
        active
          ? 'bg-emerald-800 text-white'
          : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
      )}
    >
      {item.label}
    </Link>
  );
}

function NavSections({
  sections,
  workspaceId,
  onNavigate,
}: {
  sections: ReturnType<typeof groupMenuItems>['sections'];
  workspaceId: string | null;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <div key={section.id}>
          <p className="mb-1.5 px-3 text-[10px] font-semibold tracking-wide text-zinc-400 uppercase">
            {section.label}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => (
              <li key={item.href}>
                <NavLink
                  item={item}
                  workspaceId={workspaceId}
                  onNavigate={onNavigate}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function DashboardShell({
  menu,
  children,
}: {
  menu: MenuItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get('workspaceId');
  const grouped = useMemo(() => groupMenuItems(menu), [menu]);
  const paletteItems = useMemo(() => paletteItemsFromMenu(menu), [menu]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pathForDrawer, setPathForDrawer] = useState(pathname);
  if (pathForDrawer !== pathname) {
    setPathForDrawer(pathname);
    if (drawerOpen) setDrawerOpen(false);
  }

  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!drawerOpen) return;
    const t = window.setTimeout(() => {
      drawerRef.current?.querySelector<HTMLElement>('a, button')?.focus();
    }, 0);
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setDrawerOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  const closeDrawer = () => setDrawerOpen(false);

  const sidebarBody = (
    <>
      <div className="mb-4 px-1">
        <Link
          href="/"
          className="block px-3 py-1 text-sm font-semibold tracking-tight text-zinc-900"
          onClick={closeDrawer}
        >
          Tempat Kost
        </Link>
      </div>

      {grouped.primary.length > 0 ? (
        <div className="mb-5">
          <p className="mb-1.5 px-3 text-[10px] font-semibold tracking-wide text-zinc-400 uppercase">
            Utama
          </p>
          <ul className="space-y-0.5">
            {grouped.primary.map((item) => (
              <li key={item.href}>
                <NavLink
                  item={item}
                  workspaceId={workspaceId}
                  onNavigate={closeDrawer}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <NavSections
        sections={grouped.sections}
        workspaceId={workspaceId}
        onNavigate={closeDrawer}
      />
    </>
  );

  return (
    <div className="relative flex min-h-full bg-zinc-50">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-[100dvh] w-60 shrink-0 flex-col border-r border-zinc-200 bg-white md:flex">
        <div className="flex-1 overflow-y-auto px-2 py-4">{sidebarBody}</div>
        <div className="space-y-1 border-t border-zinc-100 px-2 py-3">
          <div className="flex items-center gap-1 px-1">
            <CommandPalette items={paletteItems} />
            <Link
              href={withWorkspace('/dashboard/notifications', workspaceId)}
              className="rounded-lg px-2.5 py-1.5 text-xs text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
            >
              Notif
            </Link>
            <LogoutLink className="rounded-lg px-2.5 py-1.5 text-xs text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900">
              Keluar
            </LogoutLink>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-zinc-200 bg-white/95 px-4 backdrop-blur-md md:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <button
              ref={buttonRef}
              type="button"
              aria-expanded={drawerOpen}
              aria-controls={menuId}
              className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-800 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
              onClick={() => setDrawerOpen((v) => !v)}
            >
              Menu
            </button>
            <Link
              href="/"
              className="truncate text-sm font-semibold tracking-tight text-zinc-900"
            >
              Tempat Kost
            </Link>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <CommandPalette items={paletteItems} />
            <LogoutLink className="rounded-lg px-2 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100">
              Keluar
            </LogoutLink>
          </div>
        </header>

        {/* Mobile drawer */}
        {drawerOpen ? (
          <div className="fixed inset-0 z-40 md:hidden">
            <button
              type="button"
              aria-label="Tutup menu"
              className="absolute inset-0 bg-zinc-900/40"
              onClick={closeDrawer}
            />
            <aside
              ref={drawerRef}
              id={menuId}
              className="absolute inset-y-0 left-0 flex w-[min(18rem,88vw)] flex-col bg-white shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-3">
                <span className="text-sm font-semibold text-zinc-900">Menu</span>
                <button
                  type="button"
                  className="rounded-lg px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100"
                  onClick={closeDrawer}
                >
                  Tutup
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-2 py-3">{sidebarBody}</div>
              <div className="border-t border-zinc-100 px-3 py-3">
                <Link
                  href={withWorkspace('/dashboard/notifications', workspaceId)}
                  onClick={closeDrawer}
                  className="block rounded-lg px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100"
                >
                  Notifikasi
                </Link>
              </div>
            </aside>
          </div>
        ) : null}

        <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
