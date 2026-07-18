import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import {
  apiFetch,
  listDeposits,
  listWorkspaces,
  recordDepositTxn,
} from '@/lib/api';

function formatIdr(n: string | number) {
  const v = typeof n === 'string' ? Number(n) : n;
  if (Number.isNaN(v)) return String(n);
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(v);
}

async function recordAction(formData: FormData) {
  'use server';
  await requireAuth();
  const workspaceId = String(formData.get('workspaceId') ?? '');
  const depositAccountId = String(formData.get('depositAccountId') ?? '');
  const type = String(formData.get('type') ?? 'PAID');
  const amount = Number(formData.get('amount') ?? 0);
  const reason = String(formData.get('reason') ?? '').trim() || undefined;
  if (!depositAccountId || !amount) return;
  await recordDepositTxn({ depositAccountId, type, amount, reason });
  redirect(`/dashboard/deposits?workspaceId=${workspaceId}`);
}

async function settleAction(formData: FormData) {
  'use server';
  await requireAuth();
  const workspaceId = String(formData.get('workspaceId') ?? '');
  const depositAccountId = String(formData.get('depositAccountId') ?? '');
  if (!depositAccountId) return;
  await apiFetch('/v1/deposits/settle', {
    method: 'POST',
    body: JSON.stringify({
      depositAccountId,
      damageAmount: Number(formData.get('damageAmount') ?? 0) || 0,
      damageReason: String(formData.get('damageReason') ?? '') || undefined,
      requireApproval: formData.get('requireApproval') === 'on',
    }),
  });
  redirect(`/dashboard/deposits?workspaceId=${workspaceId}`);
}

export default async function DepositsPage({
  searchParams,
}: {
  searchParams: Promise<{ workspaceId?: string }>;
}) {
  await requireAuth();
  const { workspaceId: qWs } = await searchParams;
  let workspaces: Awaited<ReturnType<typeof listWorkspaces>> = [];
  let deposits: Awaited<ReturnType<typeof listDeposits>> = [];
  let error: string | null = null;
  let workspaceId = qWs ?? '';

  try {
    workspaces = await listWorkspaces();
    if (!workspaceId && workspaces[0]) workspaceId = workspaces[0].id;
    if (workspaceId) deposits = await listDeposits(workspaceId);
  } catch (e) {
    error = e instanceof Error ? e.message : 'Gagal memuat deposit';
  }

  return (
    <>
      <h1 className="text-2xl font-semibold">Deposit</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Ledger per kontrak. Aktifkan lease → akun deposit otomatis (CHARGED).
      </p>

      {workspaces.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/dashboard/deposits?workspaceId=${ws.id}`}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                ws.id === workspaceId
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-700'
              }`}
            >
              {ws.name}
            </Link>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
          {error}
        </div>
      )}

      <ul className="mt-6 space-y-4">
        {deposits.length === 0 ? (
          <li className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
            Belum ada akun deposit. Aktifkan kontrak dulu.
          </li>
        ) : (
          deposits.map((d) => (
            <li
              key={d.id}
              className="rounded-xl border border-zinc-200 bg-white p-6 text-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {d.tenant?.fullName} · {d.lease?.leaseNumber}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Saldo {formatIdr(d.balance)} · lease {d.lease?.status}
                  </p>
                </div>
              </div>
              {d.transactions && d.transactions.length > 0 && (
                <ul className="mt-3 space-y-1 border-t border-zinc-100 pt-3 text-xs text-zinc-500">
                  {d.transactions.map((t) => (
                    <li key={t.id}>
                      {t.type} {formatIdr(t.amount)}
                      {t.reason ? ` — ${t.reason}` : ''}
                    </li>
                  ))}
                </ul>
              )}
              <form action={recordAction} className="mt-4 flex flex-wrap gap-2">
                <input type="hidden" name="workspaceId" value={workspaceId} />
                <input type="hidden" name="depositAccountId" value={d.id} />
                <select
                  name="type"
                  className="rounded border border-zinc-300 px-2 py-1 text-xs"
                  defaultValue="PAID"
                >
                  <option value="PAID">Bayar deposit</option>
                  <option value="ADDITIONAL">Tambahan</option>
                  <option value="DEDUCTION">Potongan</option>
                  <option value="REFUND">Refund</option>
                </select>
                <input
                  name="amount"
                  type="number"
                  min={1}
                  step={1000}
                  required
                  placeholder="Nominal"
                  className="w-28 rounded border border-zinc-300 px-2 py-1 text-xs"
                />
                <input
                  name="reason"
                  placeholder="Alasan"
                  className="min-w-[8rem] flex-1 rounded border border-zinc-300 px-2 py-1 text-xs"
                />
                <button
                  type="submit"
                  className="rounded bg-zinc-900 px-3 py-1 text-xs text-white"
                >
                  Catat
                </button>
              </form>
              <form
                action={settleAction}
                className="mt-2 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-2"
              >
                <input type="hidden" name="workspaceId" value={workspaceId} />
                <input type="hidden" name="depositAccountId" value={d.id} />
                <span className="text-[10px] font-medium text-zinc-500">
                  Settlement:
                </span>
                <input
                  name="damageAmount"
                  type="number"
                  placeholder="Rusak"
                  className="w-24 rounded border px-2 py-1 text-xs"
                />
                <input
                  name="damageReason"
                  placeholder="Alasan potongan"
                  className="min-w-[8rem] flex-1 rounded border px-2 py-1 text-xs"
                />
                <label className="flex items-center gap-1 text-[10px]">
                  <input type="checkbox" name="requireApproval" /> Approval
                </label>
                <button
                  type="submit"
                  className="rounded border border-zinc-900 px-2 py-1 text-xs"
                >
                  Settle checkout
                </button>
              </form>
            </li>
          ))
        )}
      </ul>
    </>
  );
}
