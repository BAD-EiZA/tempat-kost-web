'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

type Row = {
  id?: string;
  _href?: string;
  _label?: string;
  fullName?: string;
  name?: string;
  status?: string;
  invoiceNumber?: string;
  title?: string;
  [key: string]: unknown;
};

function SearchInner() {
  const sp = useSearchParams();
  const workspaceId = sp.get('workspaceId') ?? '';
  const [q, setQ] = useState('');
  const [result, setResult] = useState<{
    entity?: string;
    count?: number;
    results?: Row[];
    dsl?: unknown;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    if (!workspaceId || !q.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: '/v1/search/smart',
          body: { workspaceId, query: q },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Gagal');
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Smart search</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Bahasa natural → filter aman. Klik hasil untuk buka entitas.
      </p>
      <div className="mt-4 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void run()}
          placeholder='Contoh: "penyewa belum bayar" / "kamar available"'
          className="flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm shadow-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
        />
        <button
          type="button"
          disabled={busy || !workspaceId}
          onClick={() => void run()}
          className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? '…' : 'Cari'}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {result && (
        <div className="mt-6 space-y-3">
          <p className="text-xs text-zinc-500">
            Entity: <b>{String(result.entity ?? '—')}</b> · {result.count ?? 0}{' '}
            hasil
          </p>
          <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
            {(result.results ?? []).length === 0 ? (
              <li className="p-4 text-sm text-zinc-500">Tidak ada hasil.</li>
            ) : (
              (result.results ?? []).map((row, i) => {
                const href =
                  row._href ??
                  `/dashboard?workspaceId=${encodeURIComponent(workspaceId)}`;
                const label =
                  row._label ??
                  String(
                    row.fullName ??
                      row.name ??
                      row.invoiceNumber ??
                      row.title ??
                      row.id ??
                      i,
                  );
                return (
                  <li key={String(row.id ?? i)}>
                    <Link
                      href={href}
                      className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-zinc-50"
                    >
                      <span className="font-medium">{label}</span>
                      {row.status != null && (
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] uppercase text-zinc-600">
                          {String(row.status)}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">…</p>}>
      <SearchInner />
    </Suspense>
  );
}
