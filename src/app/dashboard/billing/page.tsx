import Link from 'next/link';
import { redirect } from 'next/navigation';
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
import { ProofUploadField } from './proof-upload';

function formatIdr(n: string | number) {
  const v = typeof n === 'string' ? Number(n) : n;
  if (Number.isNaN(v)) return String(n);
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(v);
}

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Tagihan</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Draft → issue → catat bayar manual → konfirmasi di Pembayaran.
          </p>
        </div>
        <Link
          href={`/dashboard/payments?workspaceId=${workspaceId}`}
          className="text-sm underline"
        >
          Pembayaran →
        </Link>
      </div>

      {workspaces.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/dashboard/billing?workspaceId=${ws.id}`}
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

      <ul className="mt-6 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
        {invoices.length === 0 ? (
          <li className="p-6 text-sm text-zinc-600">Belum ada tagihan.</li>
        ) : (
          invoices.map((inv) => {
            const outstanding =
              Number(inv.total) - Number(inv.amountPaid || 0);
            return (
              <li key={inv.id} className="px-6 py-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {inv.invoiceNumber}{' '}
                      <span className="text-xs font-normal text-zinc-500">
                        {inv.status} · {inv.type}
                      </span>
                    </p>
                    <p className="text-xs text-zinc-500">
                      {inv.tenant?.fullName ?? '—'} · {formatIdr(inv.total)}
                      {outstanding > 0
                        ? ` · sisa ${formatIdr(outstanding)}`
                        : ''}
                    </p>
                    <p className="text-xs text-zinc-400">
                      jatuh tempo {String(inv.dueDate).slice(0, 10)}
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
                        <button
                          type="submit"
                          className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white"
                        >
                          Issue
                        </button>
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
                              className="w-full rounded border border-zinc-300 px-2 py-1 text-xs"
                            />
                            <ProofUploadField workspaceId={workspaceId} />
                            <button
                              type="submit"
                              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white"
                            >
                              Catat + OCR
                            </button>
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
                          <button
                            type="submit"
                            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs"
                          >
                            Void
                          </button>
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
                      className="rounded border px-2 py-1 text-xs"
                    />
                    <input
                      name="amount"
                      type="number"
                      placeholder="±Rp"
                      className="w-24 rounded border px-2 py-1 text-xs"
                    />
                    <button
                      type="submit"
                      className="rounded border px-2 py-1 text-xs"
                    >
                      Adjust
                    </button>
                  </form>
                )}
              </li>
            );
          })
        )}
      </ul>

      {workspaceId && activeLeases.length > 0 && (
        <form
          action={fromLeaseAction}
          className="mt-8 rounded-xl border border-zinc-200 bg-white p-6"
        >
          <h2 className="font-medium">Buat tagihan sewa dari kontrak aktif</h2>
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <label className="mt-4 flex flex-col gap-1 text-sm">
            <span>Kontrak</span>
            <select
              name="leaseId"
              required
              className="rounded-lg border border-zinc-300 px-3 py-2"
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
            className="mt-4 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white"
          >
            Buat draft tagihan
          </button>
        </form>
      )}
    </>
  );
}
