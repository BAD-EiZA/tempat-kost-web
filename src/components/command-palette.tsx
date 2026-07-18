'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Item = { href: string; label: string; group?: string };

const DEFAULT_ITEMS: Item[] = [
  { href: '/dashboard', label: 'Overview', group: 'Dashboard' },
  { href: '/dashboard/properties', label: 'Properti', group: 'Dashboard' },
  { href: '/dashboard/rooms', label: 'Kamar', group: 'Dashboard' },
  { href: '/dashboard/tenants', label: 'Penyewa', group: 'Dashboard' },
  { href: '/dashboard/leases', label: 'Kontrak', group: 'Dashboard' },
  { href: '/dashboard/billing', label: 'Tagihan', group: 'Finance' },
  { href: '/dashboard/payments', label: 'Pembayaran', group: 'Finance' },
  { href: '/dashboard/expenses', label: 'Pengeluaran', group: 'Finance' },
  { href: '/dashboard/deposits', label: 'Deposit', group: 'Finance' },
  { href: '/dashboard/reports', label: 'Laporan', group: 'Finance' },
  { href: '/dashboard/crm', label: 'CRM Prospects', group: 'Growth' },
  { href: '/dashboard/crm/bookings', label: 'CRM Bookings', group: 'Growth' },
  { href: '/dashboard/surveys', label: 'Survey', group: 'Growth' },
  { href: '/dashboard/publish', label: 'Publish public', group: 'Growth' },
  { href: '/dashboard/maintenance', label: 'Maintenance', group: 'Ops' },
  { href: '/dashboard/meters', label: 'Meter', group: 'Ops' },
  { href: '/dashboard/inventory', label: 'Inventaris', group: 'Ops' },
  { href: '/dashboard/inspections', label: 'Inspeksi', group: 'Ops' },
  { href: '/dashboard/ops', label: 'Ops lapangan', group: 'Ops' },
  { href: '/dashboard/import', label: 'Import data', group: 'Ops' },
  { href: '/dashboard/structure', label: 'Struktur', group: 'Setup' },
  { href: '/dashboard/team', label: 'Tim', group: 'Setup' },
  { href: '/dashboard/roles', label: 'Roles', group: 'Setup' },
  { href: '/dashboard/settings', label: 'Settings', group: 'Setup' },
  { href: '/dashboard/ai', label: 'AI Assistant', group: 'AI' },
  { href: '/dashboard/search', label: 'Smart search', group: 'AI' },
  { href: '/dashboard/insights', label: 'Insights', group: 'AI' },
  { href: '/dashboard/ops/offline', label: 'Offline drafts', group: 'Ops' },
  { href: '/dashboard/notifications', label: 'Notifikasi', group: 'AI' },
  { href: '/dashboard/flags', label: 'Feature flags', group: 'Setup' },
  { href: '/dashboard/approvals', label: 'Approvals', group: 'Setup' },
  { href: '/portal', label: 'Portal penyewa', group: 'Portal' },
  { href: '/onboarding', label: 'Onboarding workspace', group: 'Setup' },
  { href: '/onboarding/wizard', label: 'Onboarding AI wizard', group: 'Setup' },
  { href: '/admin', label: 'Super admin', group: 'Admin' },
];

export function CommandPalette({ items }: { items?: Item[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
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
        setOpen((v) => !v);
        setQ('');
        setIdx(0);
      }
      if (!open) return;
      if (e.key === 'Escape') setOpen(false);
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

  useEffect(() => setIdx(0), [q]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] text-zinc-500 md:inline"
        title="Ctrl/Cmd+K"
      >
        ⌘K
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[12vh]">
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl">
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari halaman… (Ctrl/Cmd+K)"
          className="w-full border-b border-zinc-100 px-4 py-3 text-sm outline-none"
        />
        <ul className="max-h-80 overflow-auto py-1">
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-sm text-zinc-500">Tidak ada hasil</li>
          ) : (
            filtered.map((item, i) => (
              <li key={item.href + item.label}>
                <button
                  type="button"
                  onClick={() => {
                    router.push(item.href);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm ${
                    i === idx ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-50'
                  }`}
                >
                  <span>{item.label}</span>
                  <span
                    className={`text-[10px] ${i === idx ? 'text-zinc-300' : 'text-zinc-400'}`}
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
      <button
        type="button"
        className="absolute inset-0 -z-10 cursor-default"
        aria-label="close"
        onClick={() => setOpen(false)}
      />
    </div>
  );
}
