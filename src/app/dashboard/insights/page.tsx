'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function formatIdr(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);
}

function BarChart({
  series,
}: {
  series: Array<{ month: string; cashIn: number; cashOut: number; net: number }>;
}) {
  if (!series?.length) return null;
  const max = Math.max(
    1,
    ...series.flatMap((s) => [s.cashIn, s.cashOut, Math.abs(s.net)]),
  );
  return (
    <div className="mt-4 space-y-2">
      <p className="text-xs font-medium text-zinc-500">Riwayat kas (bulan)</p>
      <div className="flex h-40 items-end gap-2 rounded-xl border border-zinc-100 bg-zinc-50/80 p-3">
        {series.map((s) => (
          <div key={s.month} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-28 w-full items-end justify-center gap-0.5">
              <div
                className="w-1/3 rounded-t bg-emerald-500/80"
                style={{ height: `${(s.cashIn / max) * 100}%` }}
                title={`In ${s.cashIn}`}
              />
              <div
                className="w-1/3 rounded-t bg-rose-400/80"
                style={{ height: `${(s.cashOut / max) * 100}%` }}
                title={`Out ${s.cashOut}`}
              />
            </div>
            <span className="text-[9px] text-zinc-500">
              {s.month.slice(5)}
            </span>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-zinc-400">
        Hijau = cash in · merah = cash out
      </p>
    </div>
  );
}

function InsightsInner() {
  const sp = useSearchParams();
  const workspaceId = sp.get('workspaceId') ?? '';
  const [propertyId, setPropertyId] = useState('');
  const [tab, setTab] = useState<'summary' | 'cashflow' | 'history' | 'rent'>(
    'summary',
  );
  const [roomId, setRoomId] = useState('');
  const [out, setOut] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    if (!workspaceId) return;
    if (tab === 'rent' && !roomId.trim()) {
      setError('Isi roomId untuk rekomendasi sewa');
      return;
    }
    setBusy(true);
    setError(null);
    const path =
      tab === 'summary'
        ? '/v1/insights/financial-summary'
        : tab === 'cashflow'
          ? '/v1/insights/cash-flow-forecast'
          : tab === 'history'
            ? '/v1/insights/cash-history'
            : '/v1/insights/rent-recommendation';
    const body: Record<string, unknown> = {
      workspaceId,
      ...(propertyId ? { propertyId } : {}),
    };
    if (tab === 'history') body.months = 6;
    if (tab === 'rent') body.roomId = roomId;
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Gagal');
      setOut(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  const history = (out?.history ?? out?.series) as
    | Array<{ month: string; cashIn: number; cashOut: number; net: number }>
    | undefined;
  const metrics = out?.metrics as Record<string, number> | undefined;
  const scenarios = out?.scenarios as Record<string, number> | undefined;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Insights</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Ringkasan · forecast · riwayat · rekomendasi sewa (human review)
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {(
          [
            ['summary', 'Financial'],
            ['cashflow', 'Forecast 30d'],
            ['history', 'Cash history'],
            ['rent', 'Rent rec'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              tab === k
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          value={propertyId}
          onChange={(e) => setPropertyId(e.target.value)}
          placeholder="propertyId (opsional)"
          className="min-w-[10rem] flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm"
        />
        {tab === 'rent' && (
          <input
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="roomId (wajib)"
            className="min-w-[10rem] flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-sm"
          />
        )}
      </div>
      <button
        type="button"
        disabled={busy || !workspaceId}
        onClick={() => void run()}
        className="mt-4 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {busy ? '…' : 'Generate'}
      </button>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {out != null && (
        <div className="mt-6 space-y-4 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
          {typeof out.summary === 'string' && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {out.summary}
            </p>
          )}
          {Array.isArray(out.insights) && (
            <ul className="list-disc space-y-1 pl-5 text-xs text-zinc-600">
              {(out.insights as string[]).map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          )}
          {metrics && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(
                [
                  ['collected', 'Terkumpul'],
                  ['outstanding', 'Outstanding'],
                  ['expenses', 'Biaya'],
                  ['occupancyRate', 'Okupansi %'],
                  ['overdueInvoices', 'Invoice overdue'],
                  ['marginProxy', 'Margin proxy'],
                ] as const
              ).map(([k, label]) =>
                metrics[k] != null ? (
                  <div
                    key={k}
                    className="rounded-xl border border-zinc-100 bg-zinc-50 p-3"
                  >
                    <p className="text-[10px] uppercase tracking-wide text-zinc-500">
                      {label}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold tabular-nums">
                      {k === 'occupancyRate' || k === 'overdueInvoices'
                        ? String(metrics[k])
                        : formatIdr(Number(metrics[k]))}
                    </p>
                  </div>
                ) : null,
              )}
            </div>
          )}
          {scenarios && (
            <div className="grid grid-cols-3 gap-2 text-center">
              {(['pessimistic', 'base', 'optimistic'] as const).map((k) => (
                <div
                  key={k}
                  className="rounded-xl border border-zinc-100 p-3"
                >
                  <p className="text-[10px] uppercase text-zinc-500">{k}</p>
                  <p className="font-semibold tabular-nums">
                    {formatIdr(Number(scenarios[k] ?? 0))}
                  </p>
                </div>
              ))}
            </div>
          )}
          {out.action != null && (
            <div className="text-sm">
              <p>
                Saran: <b>{String(out.action)}</b>
                {out.low != null && (
                  <>
                    {' '}
                    · {formatIdr(Number(out.low))} –{' '}
                    {formatIdr(Number(out.high ?? 0))}
                  </>
                )}
              </p>
              {out.peerAvgRent != null && (
                <p className="text-xs text-zinc-500">
                  Peer avg: {formatIdr(Number(out.peerAvgRent))} · vacant{' '}
                  {String(out.vacantDays ?? 0)}h
                </p>
              )}
              <p className="mt-1 text-xs text-zinc-500">
                {String(out.rationale ?? '')}
              </p>
            </div>
          )}
          {Array.isArray(history) && <BarChart series={history} />}
          {Array.isArray(out.series) && !history && (
            <BarChart
              series={
                out.series as Array<{
                  month: string;
                  cashIn: number;
                  cashOut: number;
                  net: number;
                }>
              }
            />
          )}
        </div>
      )}
      <Link
        href={`/dashboard/reports?workspaceId=${workspaceId}`}
        className="mt-6 inline-block text-sm text-zinc-600 underline"
      >
        Laporan angka →
      </Link>
    </div>
  );
}

export default function InsightsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">…</p>}>
      <InsightsInner />
    </Suspense>
  );
}
