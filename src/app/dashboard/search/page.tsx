'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { EmptyState, PageHeader, StatusBadge } from '@/components/ui';

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
      <PageHeader
        title="Smart search"
        description="Bahasa natural ke filter aman. Klik hasil untuk buka entitas."
      />
      <div className="mt-4 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void run()}
          placeholder='Contoh: "penyewa belum bayar" / "kamar available"'
          className="tk-input flex-1"
        />
        <button
          type="button"
          disabled={busy || !workspaceId}
          onClick={() => void run()}
          className="tk-btn disabled:opacity-50"
        >
          {busy ? '…' : 'Cari'}
        </button>
      </div>
      {error && (
        <div className="tk-alert mt-3" data-variant="error">
          {error}
        </div>
      )}
      {result && (
        <div className="mt-6 space-y-3">
          <p className="text-xs text-zinc-500">
            Entity: <b>{String(result.entity ?? '-')}</b> · {result.count ?? 0}{' '}
            hasil
          </p>
          {(result.results ?? []).length === 0 ? (
            <EmptyState title="Tidak ada hasil" body="Coba ubah kata kunci." />
          ) : (
          <ul className="tk-list">
              {(result.results ?? []).map((row, i) => {
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
                      {row.status != null ? (
                        <StatusBadge
                          status={String(row.status)}
                          kind="invoice"
                        />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
          </ul>
          )}
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
