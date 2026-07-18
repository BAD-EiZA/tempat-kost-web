'use client';

import { useState } from 'react';
import Link from 'next/link';

export function AiActions({ workspaceId }: { workspaceId: string }) {
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [maintDesc, setMaintDesc] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [commPurpose, setCommPurpose] = useState('');
  const [commContext, setCommContext] = useState('');
  const [commChannel, setCommChannel] = useState('whatsapp');
  const [commTone, setCommTone] = useState('friendly');
  const [copied, setCopied] = useState(false);

  async function call(path: string, body: object) {
    setBusy(true);
    setError(null);
    setResult(null);
    setCopied(false);
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Request failed');
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  function draftBody(): string | null {
    if (result == null) return null;
    const r = result as Record<string, unknown>;
    if (r.resultJson && typeof r.resultJson === 'object') {
      const j = r.resultJson as { body?: string; subject?: string };
      if (j.body) {
        return j.subject ? `${j.subject}\n\n${j.body}` : j.body;
      }
    }
    return null;
  }

  async function copyDraft() {
    const t = draftBody();
    if (!t) return;
    await navigator.clipboard.writeText(t);
    setCopied(true);
  }

  function renderResult() {
    if (result == null) return null;
    const r = result as Record<string, unknown>;

    if (Array.isArray(r.results) && r.entity) {
      return (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            {String(r.entity)} · {String(r.count)} hasil
          </p>
          <ul className="divide-y rounded-xl border bg-zinc-50 text-xs">
            {(r.results as Array<Record<string, unknown>>).slice(0, 30).map(
              (row, i) => {
                const href = String(row._href ?? '');
                const label = String(
                  row._label ??
                    row.fullName ??
                    row.name ??
                    row.invoiceNumber ??
                    row.id ??
                    i,
                );
                return (
                  <li key={i} className="px-3 py-2">
                    {href ? (
                      <Link href={href} className="underline">
                        {label}
                      </Link>
                    ) : (
                      label
                    )}
                  </li>
                );
              },
            )}
          </ul>
        </div>
      );
    }

    if (r.summary || r.metrics) {
      return (
        <div className="space-y-2 text-sm">
          {r.summary ? (
            <p className="whitespace-pre-wrap">{String(r.summary)}</p>
          ) : null}
          {Array.isArray(r.insights) && (
            <ul className="list-disc pl-5 text-xs text-zinc-600">
              {(r.insights as string[]).map((x, i) => (
                <li key={i}>{x}</li>
              ))}
            </ul>
          )}
        </div>
      );
    }

    if (r.scenarios) {
      const s = r.scenarios as Record<string, number>;
      return (
        <div className="space-y-2 text-sm">
          <p className="text-xs text-zinc-500">
            {String(r.label)} · {String(r.horizon)}
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            {(['pessimistic', 'base', 'optimistic'] as const).map((k) => (
              <div key={k} className="rounded-xl border p-2">
                <p className="text-[10px] uppercase text-zinc-500">{k}</p>
                <p className="font-semibold tabular-nums">
                  {Number(s[k] ?? 0).toLocaleString('id-ID')}
                </p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (r.action && (r.low != null || r.currentRent != null)) {
      return (
        <div className="text-sm">
          <p>
            Saran: <b>{String(r.action)}</b> · Rp{' '}
            {Number(r.low ?? 0).toLocaleString('id-ID')} – Rp{' '}
            {Number(r.high ?? 0).toLocaleString('id-ID')}
          </p>
          {r.peerAvgRent != null && (
            <p className="text-xs text-zinc-500">
              Peer avg Rp {Number(r.peerAvgRent).toLocaleString('id-ID')} ·
              vacant {String(r.vacantDays ?? 0)} hari
            </p>
          )}
          <p className="mt-1 text-xs text-zinc-500">
            {String(r.rationale ?? '')}
          </p>
        </div>
      );
    }

    // expense categorization job
    if (r.resultJson && typeof r.resultJson === 'object') {
      const j = r.resultJson as {
        categories?: Array<{ key: string; label: string; confidence: number }>;
        body?: string;
        subject?: string;
        suggestedVendor?: string;
        lowAmount?: number;
        highAmount?: number;
      };
      if (j.categories?.length) {
        return (
          <div className="space-y-2 text-sm">
            <p className="text-xs text-zinc-500">
              Job {String(r.id)} · {String(r.status)}
            </p>
            <ul className="space-y-1">
              {j.categories.map((c, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-lg border px-3 py-2 text-xs"
                >
                  <span>
                    <b>{c.label}</b> ({c.key})
                  </span>
                  <span className="text-zinc-500">
                    {Math.round((c.confidence ?? 0) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
            {j.suggestedVendor && (
              <p className="text-xs text-zinc-500">
                Vendor: {j.suggestedVendor}
              </p>
            )}
          </div>
        );
      }
      if (j.body) {
        return (
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500">
                Draft · {String(r.status)} · tidak auto-kirim
              </p>
              <button
                type="button"
                onClick={() => void copyDraft()}
                className="rounded-lg border px-2 py-1 text-[10px]"
              >
                {copied ? 'Tersalin' : 'Salin'}
              </button>
            </div>
            {j.subject && (
              <p className="text-xs font-medium">Subjek: {j.subject}</p>
            )}
            <p className="whitespace-pre-wrap rounded-xl bg-zinc-50 p-3">
              {j.body}
            </p>
          </div>
        );
      }
      if (j.lowAmount != null || j.highAmount != null) {
        return (
          <div className="text-sm">
            <p>
              Estimasi: Rp {Number(j.lowAmount ?? 0).toLocaleString('id-ID')} –{' '}
              Rp {Number(j.highAmount ?? 0).toLocaleString('id-ID')}
            </p>
            <pre className="mt-2 max-h-60 overflow-auto text-[10px]">
              {JSON.stringify(j, null, 2)}
            </pre>
          </div>
        );
      }
    }

    if (r.resultJson != null || r.status) {
      return (
        <pre className="max-h-80 overflow-auto text-xs">
          {JSON.stringify(r.resultJson ?? r, null, 2)}
        </pre>
      );
    }

    return (
      <pre className="max-h-96 overflow-auto text-xs">
        {JSON.stringify(result, null, 2)}
      </pre>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <form
          className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            void call('/v1/search/smart', {
              workspaceId,
              query: String(fd.get('query') ?? ''),
            });
          }}
        >
          <h2 className="font-medium">Smart search</h2>
          <input
            name="query"
            required
            placeholder="Penyewa belum bayar"
            className="mt-3 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={busy}
            className="mt-3 rounded-xl bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            Cari
          </button>
        </form>

        <form
          className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm"
          onSubmit={(e) => {
            e.preventDefault();
            let context: Record<string, unknown> = {
              purpose: commPurpose,
            };
            try {
              if (commContext.trim()) {
                context = {
                  ...context,
                  ...JSON.parse(commContext),
                };
              }
            } catch {
              context.notes = commContext;
            }
            void call('/v1/ai/communication-draft', {
              workspaceId,
              purpose: commPurpose,
              audience: 'tenant',
              context,
              tone: commTone,
              channel: commChannel,
            });
          }}
        >
          <h2 className="font-medium">Draft komunikasi</h2>
          <p className="mt-0.5 text-[10px] text-zinc-500">
            Generate saja — tidak mengirim WA/email
          </p>
          <input
            value={commPurpose}
            onChange={(e) => setCommPurpose(e.target.value)}
            required
            placeholder="Reminder sewa sopan"
            className="mt-3 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
          />
          <textarea
            value={commContext}
            onChange={(e) => setCommContext(e.target.value)}
            rows={2}
            placeholder='Konteks: {"tenant":"Budi","amount":1500000} atau teks bebas'
            className="mt-2 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
          />
          <div className="mt-2 flex gap-2">
            <select
              value={commChannel}
              onChange={(e) => setCommChannel(e.target.value)}
              className="flex-1 rounded-xl border border-zinc-200 px-2 py-1.5 text-xs"
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </select>
            <select
              value={commTone}
              onChange={(e) => setCommTone(e.target.value)}
              className="flex-1 rounded-xl border border-zinc-200 px-2 py-1.5 text-xs"
            >
              <option value="friendly">Friendly</option>
              <option value="formal">Formal</option>
              <option value="firm">Firm</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="mt-3 rounded-xl bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            Generate draft
          </button>
        </form>

        <form
          className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm"
          onSubmit={(e) => {
            e.preventDefault();
            void call('/v1/ai/expense-categorization', {
              workspaceId,
              description: expenseDesc,
              amount: expenseAmount ? Number(expenseAmount) : undefined,
            });
          }}
        >
          <h2 className="font-medium">Kategori expense (AI)</h2>
          <input
            value={expenseDesc}
            onChange={(e) => setExpenseDesc(e.target.value)}
            required
            placeholder="Bayar listrik PLN Maret"
            className="mt-3 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
          />
          <input
            value={expenseAmount}
            onChange={(e) => setExpenseAmount(e.target.value)}
            type="number"
            placeholder="Nominal (opsional)"
            className="mt-2 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={busy}
            className="mt-3 rounded-xl bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            Klasifikasi
          </button>
        </form>

        <button
          type="button"
          disabled={busy}
          onClick={() =>
            void call('/v1/insights/financial-summary', { workspaceId })
          }
          className="rounded-2xl border border-zinc-200/80 bg-white p-5 text-left shadow-sm hover:border-zinc-400 disabled:opacity-50"
        >
          <h2 className="font-medium">Ringkasan keuangan</h2>
          <p className="mt-1 text-xs text-zinc-500">Metrics + narasi AI</p>
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={() =>
            void call('/v1/insights/cash-flow-forecast', { workspaceId })
          }
          className="rounded-2xl border border-zinc-200/80 bg-white p-5 text-left shadow-sm hover:border-zinc-400 disabled:opacity-50"
        >
          <h2 className="font-medium">Arus kas 30 hari</h2>
          <p className="mt-1 text-xs text-zinc-500">Base / opt / pess + history</p>
        </button>

        <form
          className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm"
          onSubmit={(e) => {
            e.preventDefault();
            if (!roomId) return;
            void call('/v1/insights/rent-recommendation', {
              workspaceId,
              roomId,
            });
          }}
        >
          <h2 className="font-medium">Rekomendasi sewa</h2>
          <input
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="roomId"
            className="mt-3 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            required
          />
          <button
            type="submit"
            disabled={busy}
            className="mt-3 rounded-xl bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            Analisis
          </button>
        </form>

        <form
          className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm"
          onSubmit={(e) => {
            e.preventDefault();
            void call('/v1/ai/maintenance-triage', {
              workspaceId,
              description: maintDesc,
            });
          }}
        >
          <h2 className="font-medium">Triage maintenance</h2>
          <textarea
            value={maintDesc}
            onChange={(e) => setMaintDesc(e.target.value)}
            required
            rows={2}
            placeholder="Deskripsi kerusakan"
            className="mt-3 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={busy}
            className="mt-3 rounded-xl bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            Klasifikasi
          </button>
        </form>

        <form
          className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm"
          onSubmit={(e) => {
            e.preventDefault();
            void call('/v1/ai/repair-estimate', {
              workspaceId,
              description: maintDesc || 'Perbaikan kamar',
            });
          }}
        >
          <h2 className="font-medium">Estimasi biaya perbaikan</h2>
          <p className="mt-0.5 text-[10px] text-zinc-500">
            Pakai deskripsi triage di atas jika diisi
          </p>
          <button
            type="submit"
            disabled={busy || !maintDesc}
            className="mt-3 rounded-xl bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            Estimasi
          </button>
        </form>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}
      {result != null && (
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-medium">Hasil</h2>
            <Link
              href={`/dashboard/rooms?workspaceId=${workspaceId}`}
              className="text-[10px] underline"
            >
              Room list
            </Link>
          </div>
          {renderResult()}
        </div>
      )}
    </div>
  );
}
