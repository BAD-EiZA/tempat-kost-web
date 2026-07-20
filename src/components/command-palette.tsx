'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { groupLabelForHref } from '@/lib/nav-taxonomy';

type Item = { href: string; label: string; group?: string };

const DEFAULT_HREFS: Array<{ href: string; label: string }> = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/properties', label: 'Properti' },
  { href: '/dashboard/rooms', label: 'Kamar' },
  { href: '/dashboard/tenants', label: 'Penyewa' },
  { href: '/dashboard/leases', label: 'Kontrak' },
  { href: '/dashboard/billing', label: 'Tagihan' },
  { href: '/dashboard/payments', label: 'Pembayaran' },
  { href: '/dashboard/expenses', label: 'Pengeluaran' },
  { href: '/dashboard/deposits', label: 'Deposit' },
  { href: '/dashboard/reports', label: 'Laporan' },
  { href: '/dashboard/crm', label: 'CRM Prospects' },
  { href: '/dashboard/crm/bookings', label: 'CRM Bookings' },
  { href: '/dashboard/surveys', label: 'Survey' },
  { href: '/dashboard/publish', label: 'Publish public' },
  { href: '/dashboard/maintenance', label: 'Maintenance' },
  { href: '/dashboard/meters', label: 'Meter' },
  { href: '/dashboard/inventory', label: 'Inventaris' },
  { href: '/dashboard/inspections', label: 'Inspeksi' },
  { href: '/dashboard/ops', label: 'Ops lapangan' },
  { href: '/dashboard/import', label: 'Import data' },
  { href: '/dashboard/structure', label: 'Struktur' },
  { href: '/dashboard/team', label: 'Tim' },
  { href: '/dashboard/roles', label: 'Roles' },
  { href: '/dashboard/settings', label: 'Settings' },
  { href: '/dashboard/ai', label: 'AI Assistant' },
  { href: '/dashboard/search', label: 'Smart search' },
  { href: '/dashboard/insights', label: 'Insights' },
  { href: '/dashboard/ops/offline', label: 'Offline drafts' },
  { href: '/dashboard/notifications', label: 'Notifikasi' },
  { href: '/dashboard/flags', label: 'Feature flags' },
  { href: '/dashboard/approvals', label: 'Approvals' },
  { href: '/dashboard/audit-log', label: 'Audit log' },
  { href: '/portal', label: 'Portal penyewa' },
  { href: '/onboarding', label: 'Onboarding workspace' },
  { href: '/onboarding/wizard', label: 'Onboarding AI wizard' },
  { href: '/admin', label: 'Super admin' },
];

const DEFAULT_ITEMS: Item[] = DEFAULT_HREFS.map((item) => ({
  ...item,
  group: groupLabelForHref(item.href),
}));

export function CommandPalette({ items }: { items?: Item[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const listboxId = useId();
  const source = items?.length ? items : DEFAULT_ITEMS;

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return source.slice(0, 40);
    return source
      .filter(
        (i) =>
          i.label.toLowerCase().includes(s) ||
          i.href.toLowerCase().includes(s) ||
          (i.group ?? '').toLowerCase().includes(s),
      )
      .slice(0, 40);
  }, [q, source]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => {
          if (!v) restoreFocusRef.current = document.activeElement as HTMLElement;
          return !v;
        });
        setQ('');
        setIdx(0);
      }
      if (!open) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'input, button, [href], [tabindex]:not([tabindex="-1"])',
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setIdx((i) => Math.min(i + 1, filtered.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setIdx((i) => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter' && filtered[idx]) {
        e.preventDefault();
        router.push(filtered[idx].href);
        setOpen(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, filtered, idx, router]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      return;
    }
    const previous = restoreFocusRef.current;
    (previous?.isConnected ? previous : triggerRef.current)?.focus();
    restoreFocusRef.current = null;
  }, [open]);

  function show() {
    restoreFocusRef.current = document.activeElement as HTMLElement;
    setQ('');
    setIdx(0);
    setOpen(true);
  }

  if (!open) {
    return (
      <button
        ref={triggerRef}
        type="button"
        onClick={show}
        aria-haspopup="dialog"
        className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] text-zinc-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
        title="Ctrl/Cmd+K"
      >
        <span className="md:hidden">Cari</span>
        <span className="hidden md:inline">⌘K</span>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[max(4rem,12vh)]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setOpen(false);
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Cari halaman"
        className="w-full max-w-lg overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl"
      >
        <div className="flex border-b border-zinc-100">
        <input
          ref={inputRef}
          role="combobox"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded="true"
          aria-activedescendant={filtered[idx] ? `${listboxId}-${idx}` : undefined}
          aria-label="Cari halaman"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setIdx(0);
          }}
          placeholder="Cari halaman… (Ctrl/Cmd+K)"
          className="w-full px-4 py-3 text-sm outline-none"
        />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-4 text-sm text-zinc-500 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-zinc-900"
            aria-label="Tutup pencarian"
          >
            Esc
          </button>
        </div>
        <ul id={listboxId} role="listbox" className="max-h-80 overflow-auto py-1">
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-sm text-zinc-500">Tidak ada hasil</li>
          ) : (
            filtered.map((item, i) => (
              <li key={item.href + item.label} role="none">
                <button
                  id={`${listboxId}-${i}`}
                  role="option"
                  aria-selected={i === idx}
                  type="button"
                  onClick={() => {
                    router.push(item.href);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm ${
                    i === idx
                      ? 'bg-emerald-800 text-white'
                      : 'hover:bg-zinc-50'
                  }`}
                >
                  <span>{item.label}</span>
                  <span
                    className={`text-[10px] ${i === idx ? 'text-emerald-100' : 'text-zinc-400'}`}
                  >
                    {item.group}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
        <div className="border-t border-zinc-100 px-4 py-2 text-[10px] text-zinc-400">
          ↑↓ pilih · Enter buka · Esc tutup
        </div>
      </div>
    </div>
  );
}
