import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import {
  EmptyState,
  PageHeader,
  StatusBadge,
  WorkspaceChips,
} from '@/components/ui';
import {
  apiFetch,
  listDeposits,
  listWorkspaces,
  recordDepositTxn,
} from '@/lib/api';
import { formatIdr } from '@/lib/format';

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
      <PageHeader
        title="Deposit"
        description="Ledger per kontrak. Aktifkan lease untuk membuat akun deposit."
      />

      {workspaces.length > 0 && (
        <WorkspaceChips
          workspaces={workspaces}
          workspaceId={workspaceId}
          hrefFor={(id) => `/dashboard/deposits?workspaceId=${id}`}
        />
      )}

      {error && (
        <div className="tk-alert mt-4" data-variant="warning">
          {error}
        </div>
      )}

      {deposits.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="Belum ada akun deposit"
          body="Aktifkan kontrak dulu agar akun deposit dibuat otomatis."
        />
      ) : (
      <ul className="mt-6 space-y-4">
          {deposits.map((d) => (
            <li
              key={d.id}
              className="tk-card p-6 text-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-zinc-900">
                    {d.tenant?.fullName}
                  </p>
                  <p className="text-xs text-zinc-500">{d.lease?.leaseNumber}</p>
                  <p className="mt-2 text-lg font-semibold tabular-nums">
                    {formatIdr(d.balance)}
                  </p>
                  <p className="text-xs text-zinc-500">Saldo deposit</p>
                </div>
                {d.lease?.status ? (
                  <StatusBadge status={d.lease.status} kind="lease" />
                ) : null}
              </div>
              {d.transactions && d.transactions.length > 0 && (
                <ul className="mt-3 space-y-1 border-t border-zinc-100 pt-3 text-xs text-zinc-500">
                  {d.transactions.map((t) => (
                    <li key={t.id} className="flex justify-between gap-2">
                      <span>
                        {t.type}
                        {t.reason ? ` · ${t.reason}` : ''}
                      </span>
                      <span className="tabular-nums font-medium text-zinc-700">
                        {formatIdr(t.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <form action={recordAction} className="mt-4 flex flex-wrap gap-2">
                <input type="hidden" name="workspaceId" value={workspaceId} />
                <input type="hidden" name="depositAccountId" value={d.id} />
                <select
                  name="type"
                  className="tk-select !py-1 !text-xs"
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
                  className="tk-input w-28 !py-1 !text-xs"
                />
                <input
                  name="reason"
                  placeholder="Alasan"
                  className="tk-input min-w-[8rem] flex-1 !py-1 !text-xs"
                />
                <button type="submit" className="tk-btn-sm">
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
                  className="tk-input w-24 !py-1 !text-xs"
                />
                <input
                  name="damageReason"
                  placeholder="Alasan potongan"
                  className="tk-input min-w-[8rem] flex-1 !py-1 !text-xs"
                />
                <label className="flex items-center gap-1 text-[10px]">
                  <input type="checkbox" name="requireApproval" /> Approval
                </label>
                <button type="submit" className="tk-btn-secondary !px-2 !py-1 !text-xs">
                  Settle checkout
                </button>
              </form>
            </li>
          ))}
      </ul>
      )}
    </>
  );
}
