'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function PortalNav({
  links,
}: {
  links: ReadonlyArray<{ label: string; href: string }>;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi portal"
      className="-mx-1 flex max-w-full gap-1 overflow-x-auto px-1 pb-1 text-sm text-zinc-600 sm:flex-wrap sm:overflow-visible sm:pb-0"
    >
      {links.map(({ label, href }) => {
        const linkPathname = href.split('?')[0];
        const active =
          pathname === linkPathname ||
          (linkPathname !== '/portal' && pathname.startsWith(`${linkPathname}/`));
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'shrink-0 rounded-lg px-2.5 py-1.5 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900',
              active
                ? 'bg-zinc-900 font-medium text-white'
                : 'hover:bg-zinc-100 hover:text-zinc-900',
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
