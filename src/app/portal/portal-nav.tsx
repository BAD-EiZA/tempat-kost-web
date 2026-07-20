'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type NavLink = { label: string; href: string };

function pathOf(href: string) {
  return href.split('?')[0];
}

function isActive(pathname: string, href: string, exact = false) {
  const linkPath = pathOf(href);
  if (exact || linkPath === '/portal') {
    return pathname === linkPath;
  }
  return pathname === linkPath || pathname.startsWith(`${linkPath}/`);
}

export function PortalNav({
  primary,
  more,
}: {
  primary: ReadonlyArray<NavLink>;
  more: ReadonlyArray<NavLink>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    function onClick(e: MouseEvent) {
      const t = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(t) &&
        buttonRef.current &&
        !buttonRef.current.contains(t)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  const moreActive = more.some((l) => isActive(pathname, l.href));

  return (
    <>
      {/* Desktop top nav */}
      <nav
        aria-label="Navigasi portal"
        className="hidden min-w-0 flex-1 items-center gap-1 md:flex"
      >
        {primary.map((link) => {
          const active = isActive(pathname, link.href, pathOf(link.href) === '/portal');
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'shrink-0 rounded-lg px-2.5 py-1.5 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800',
                active
                  ? 'bg-emerald-800 font-medium text-white'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
              )}
            >
              {link.label}
            </Link>
          );
        })}
        <div className="relative">
          <button
            ref={buttonRef}
            type="button"
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((v) => !v)}
            className={cn(
              'rounded-lg px-2.5 py-1.5 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800',
              moreActive || open
                ? 'bg-emerald-800 font-medium text-white'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
            )}
          >
            Lainnya
          </button>
          {open ? (
            <div
              ref={panelRef}
              id={menuId}
              role="menu"
              className="absolute right-0 top-full z-40 mt-1 min-w-[11rem] rounded-xl border border-zinc-200 bg-white p-1 shadow-lg"
            >
              {more.map((link) => {
                const active = isActive(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className={cn(
                      'block rounded-lg px-3 py-2 text-sm',
                      active
                        ? 'bg-emerald-50 font-medium text-emerald-900'
                        : 'text-zinc-700 hover:bg-zinc-50',
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>
      </nav>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="Menu portal"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-0.5 px-1 pt-1">
          {primary.map((link) => {
            const active = isActive(
              pathname,
              link.href,
              pathOf(link.href) === '/portal',
            );
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-[3rem] flex-col items-center justify-center rounded-lg px-1 py-1 text-[11px] font-medium transition',
                  active
                    ? 'bg-emerald-50 text-emerald-900'
                    : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800',
                )}
              >
                <span className="truncate">{link.label}</span>
              </Link>
            );
          })}
          <div className="relative">
            <button
              type="button"
              aria-expanded={open}
              aria-controls={`${menuId}-mobile`}
              onClick={() => setOpen((v) => !v)}
              className={cn(
                'flex min-h-[3rem] w-full flex-col items-center justify-center rounded-lg px-1 py-1 text-[11px] font-medium transition',
                moreActive || open
                  ? 'bg-emerald-50 text-emerald-900'
                  : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800',
              )}
            >
              Lainnya
            </button>
            {open ? (
              <div
                id={`${menuId}-mobile`}
                role="menu"
                className="absolute bottom-[calc(100%+0.35rem)] right-0 z-40 min-w-[11rem] rounded-xl border border-zinc-200 bg-white p-1 shadow-lg"
              >
                {more.map((link) => {
                  const active = isActive(pathname, link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      role="menuitem"
                      onClick={() => setOpen(false)}
                      className={cn(
                        'block rounded-lg px-3 py-2.5 text-sm',
                        active
                          ? 'bg-emerald-50 font-medium text-emerald-900'
                          : 'text-zinc-700 hover:bg-zinc-50',
                      )}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </nav>
    </>
  );
}
