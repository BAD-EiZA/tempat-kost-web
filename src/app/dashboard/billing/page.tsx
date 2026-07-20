import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Alert,
  ConfirmSubmitButton,
  EmptyState,
  PageHeader,
  PendingSubmitButton,
  StatusBadge,
  WorkspaceChips,
} from '@/components/ui';
import { requireAuth } from '@/lib/auth';
import {
  apiFetch,
  createInvoiceFromLease,
  createPayment,
  issueInvoice,
  listInvoices,
  listLeases,
  listWorkspaces,
  voidInvoice,
} from '@/lib/api';
import { formatDateId, formatIdr } from '@/lib/format';
import { ProofUploadField } from './proof-upload';

async function fromLeaseAction(formData: FormData) {
  'use server';
  await requireAuth();
  const leaseId = String(formData.get('leaseId') ?? '');
  const workspaceId = String(formData.get('workspaceId') ?? '');
  if (!leaseId) return;
  await createInvoiceFromLease(leaseId);
  redirect(`/dashboard/billing?workspaceId=${workspaceId}`);
}

async function issueAction(formData: FormData) {
  'use server';
  await requireAuth();
  const id = String(formData.get('id') ?? '');
  const workspaceId = String(formData.get('workspaceId') ?? '');
  if (!id) return;
  await issueInvoice(id);
  redirect(`/dashboard/billing?workspaceId=${workspaceId}`);
}

async function voidAction(formData: FormData) {
  'use server';
  await requireAuth();
  const id = String(formData.get('id') ?? '');
  const workspaceId = String(formData.get('workspaceId') ?? '');
  if (!id) return;
  await voidInvoice(id);
  redirect(`/dashboard/billing?workspaceId=${workspaceId}`);
}

async function lateFeeAction(formData: FormData) {
  'use server';
  await requireAuth();
  const id = String(formData.get('id') ?? '');
  const workspaceId = String(formData.get('workspaceId') ?? '');
  if (!id) return;
  await apiFetch(`/v1/invoices/${id}/late-fee`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  redirect(`/dashboard/billing?workspaceId=${workspaceId}`);
}

async function adjustAction(formData: FormData) {
  'use server';
  await requireAuth();
  const id = String(formData.get('id') ?? '');
  const workspaceId = String(formData.get('workspaceId') ?? '');
  const description = String(formData.get('description') ?? '').trim();
  const amount = Number(formData.get('amount') ?? 0);
  if (!id || !description) return;
  await apiFetch(`/v1/invoices/${id}/adjust`, {
    method: 'POST',
    body: JSON.stringify({ description, amount }),
  });
  redirect(`/dashboard/billing?workspaceId=${workspaceId}`);
}

async function payAction(formData: FormData) {
  'use server';
  await requireAuth();
  const workspaceId = String(formData.get('workspaceId') ?? '');
  const invoiceId = String(formData.get('invoiceId') ?? '');
  const amount = Number(formData.get('amount') ?? 0);
  const manualReference =
    String(formData.get('manualReference') ?? '').trim() || undefined;
  const proofUrl = String(formData.get('proofUrl') ?? '').trim() || undefined;
  const proofBase64 =
    String(formData.get('proofBase64') ?? '').trim() || undefined;
  const runAiOcr = String(formData.get('runAiOcr') ?? '') === '1';
  if (!workspaceId || !invoiceId || !amount) return;
  await createPayment({
    workspaceId,
    invoiceId,
    amount,
    method: 'BANK_TRANSFER',
    manualReference,
    proofUrl,
    proofBase64,
    runAiOcr,
  });
  redirect(`/dashboard/payments?workspaceId=${workspaceId}`);
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ workspaceId?: string }>;
}) {
  await requireAuth();
  const { workspaceId: qWs } = await searchParams;

  let workspaces: Awaited<ReturnType<typeof listWorkspaces>> = [];
  let invoices: Awaited<ReturnType<typeof listInvoices>> = [];
  let leases: Awaited<ReturnType<typeof listLeases>> = [];
  let error: string | null = null;
  let workspaceId = qWs ?? '';

  try {
    workspaces = await listWorkspaces();
    if (!workspaceId && workspaces[0]) workspaceId = workspaces[0].id;
    if (workspaceId) {
      [invoices, leases] = await Promise.all([
        listInvoices(workspaceId),
        listLeases(workspaceId),
      ]);
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Gagal memuat tagihan';
  }

  const activeLeases = leases.filter((l) => l.status === 'ACTIVE');

  return (
    <>
      <PageHeader
        title="Tagihan"
        description="Draft, issue, catat bayar manual, lalu konfirmasi di Pembayaran."
        actions={
          <Link
            href={`/dashboard/payments?workspaceId=${workspaceId}`}
            className="text-sm font-medium text-emerald-800 underline-offset-2 hover:underline"
          >
            Pembayaran
          </Link>
        }
      />

      {workspaces.length > 0 && (
        <WorkspaceChips
          workspaces={workspaces}
          workspaceId={workspaceId}
          hrefFor={(id) => `/dashboard/billing?workspaceId=${id}`}
        />
      )}

      {error && (
        <Alert variant="error" className="mt-4">{error}</Alert>
      )}

      {invoices.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="Belum ada tagihan"
          body="Buat tagihan dari kontrak aktif lewat form di bawah."
        />
      ) : (
      <ul className="tk-list mt-6">
          {invoices.map((inv) => {
            const outstanding =
              Number(inv.total) - Number(inv.amountPaid || 0);
            return (
              <li key={inv.id} className="px-6 py-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{inv.invoiceNumber}</p>
                      <StatusBadge status={inv.status} kind="invoice" />
                      {inv.type ? (
                        <span className="text-xs text-zinc-400">{inv.type}</span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      {inv.tenant?.fullName ?? '-'} · {formatIdr(inv.total)}
                      {outstanding > 0
                        ? ` · sisa ${formatIdr(outstanding)}`
                        : ''}
                    </p>
                    <p className="text-xs text-zinc-400">
                      Jatuh tempo {formatDateId(inv.dueDate)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(inv.status === 'DRAFT' || inv.status === 'SCHEDULED') && (
                      <form action={issueAction}>
                        <input type="hidden" name="id" value={inv.id} />
                        <input
                          type="hidden"
                          name="workspaceId"
                          value={workspaceId}
                        />
                        <PendingSubmitButton
                          className="tk-btn-sm"
                          pendingLabel="Issuing..."
                        >
                          Issue
                        </PendingSubmitButton>
                      </form>
                    )}
                    {(inv.status === 'OPEN' ||
                      inv.status === 'PARTIALLY_PAID' ||
                      inv.status === 'OVERDUE') &&
                      outstanding > 0 && (
                        <form
                          action={payAction}
                          className="flex w-full max-w-md flex-col gap-1 sm:ml-auto"
                        >
                          <input type="hidden" name="invoiceId" value={inv.id} />
                          <input
                            type="hidden"
                            name="workspaceId"
                            value={workspaceId}
                          />
                          <input
                            type="hidden"
                            name="amount"
                            value={outstanding}
                          />
                          <input type="hidden" name="runAiOcr" value="1" />
                          <div className="flex flex-col gap-1">
                            <input
                              name="manualReference"
                              placeholder="Ref transfer"
                              className="tk-input w-full !px-2 !py-1 !text-xs"
                            />
                            <ProofUploadField workspaceId={workspaceId} />
                            <PendingSubmitButton
                              className="tk-btn-sm"
                              pendingLabel="Mencatat..."
                            >
                              Catat + OCR
                            </PendingSubmitButton>
                          </div>
                        </form>
                      )}
                    {inv.status !== 'PAID' && inv.status !== 'VOID' && (
                      <>
                        <form action={lateFeeAction}>
                          <input type="hidden" name="id" value={inv.id} />
                          <input
                            type="hidden"
                            name="workspaceId"
                            value={workspaceId}
                          />
                          <button
                            type="submit"
                            className="rounded-lg border px-3 py-1.5 text-xs"
                          >
                            + Denda
                          </button>
                        </form>
                        <form action={voidAction}>
                          <input type="hidden" name="id" value={inv.id} />
                          <input
                            type="hidden"
                            name="workspaceId"
                            value={workspaceId}
                          />
                          <ConfirmSubmitButton
                            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs"
                            title="Void tagihan?"
                            description={`Tagihan ${inv.invoiceNumber} akan dibatalkan dan tidak dapat dibayar.`}
                            confirmLabel="Ya, void"
                            pendingLabel="Membatalkan..."
                            danger
                          >
                            Void
                          </ConfirmSubmitButton>
                        </form>
                      </>
                    )}
                  </div>
                </div>
                {(inv.status === 'OPEN' || inv.status === 'OVERDUE') && (
                  <form
                    action={adjustAction}
                    className="mt-2 flex flex-wrap gap-1 border-t border-zinc-50 pt-2"
                  >
                    <input type="hidden" name="id" value={inv.id} />
                    <input type="hidden" name="workspaceId" value={workspaceId} />
                    <input
                      name="description"
                      placeholder="Adjustment"
                      className="tk-input !px-2 !py-1 !text-xs"
                    />
                    <input
                      name="amount"
                      type="number"
                      placeholder="±Rp"
                      className="tk-input w-24 !px-2 !py-1 !text-xs"
                    />
                    <button
                      type="submit"
                      className="tk-input !px-2 !py-1 !text-xs"
                    >
                      Adjust
                    </button>
                  </form>
                )}
              </li>
            );
          })}
      </ul>
      )}

      {workspaceId && activeLeases.length > 0 && (
        <form
          action={fromLeaseAction}
          className="tk-card mt-8 p-6"
        >
          <h2 className="font-medium">Buat tagihan sewa dari kontrak aktif</h2>
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <label className="mt-4 flex flex-col gap-1 text-sm">
            <span>Kontrak</span>
            <select
              name="leaseId"
              required
              className="tk-input"
            >
              {activeLeases.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.leaseNumber} · {l.tenant?.fullName} ·{' '}
                  {formatIdr(l.rentAmount)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="tk-btn mt-4"
          >
            Buat draft tagihan
          </button>
        </form>
      )}
    </>
  );
}
