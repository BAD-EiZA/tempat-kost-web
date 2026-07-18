'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function DashboardNav({
  items,
}: {
  items: Array<{ href: string; label: string }>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs shadow-sm md:hidden"
        onClick={() => setOpen((v) => !v)}
      >
        Menu
      </button>
      <nav
        className={cn(
          open ? 'flex' : 'hidden',
          'absolute left-0 right-0 top-12 z-20 max-h-[70vh] flex-col gap-1 overflow-auto border-b border-zinc-200/80 bg-white/95 p-3 shadow-lg backdrop-blur-md md:static md:flex md:max-h-none md:flex-row md:flex-wrap md:gap-1.5 md:overflow-visible md:border-0 md:bg-transparent md:p-0 md:shadow-none',
        )}
      >
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                'rounded-full px-2.5 py-1 text-sm transition',
                active
                  ? 'bg-zinc-900 font-medium text-white shadow-md shadow-zinc-900/15'
                  : 'text-zinc-600 hover:bg-white hover:text-zinc-900 hover:shadow-sm',
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
