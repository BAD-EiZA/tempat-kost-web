import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Alert,
  ConfirmSubmitButton,
  EmptyState,
  PageHeader,
  StatusBadge,
  WorkspaceChips,
} from '@/components/ui';
import { requireAuth } from '@/lib/auth';
import {
  confirmPayment,
  listPayments,
  listWorkspaces,
  rejectPayment,
} from '@/lib/api';
import { formatIdr } from '@/lib/format';

async function confirmAction(formData: FormData) {
  'use server';
  await requireAuth();
  const id = String(formData.get('id') ?? '');
  const workspaceId = String(formData.get('workspaceId') ?? '');
  if (!id) return;
  await confirmPayment(id);
  redirect(`/dashboard/payments?workspaceId=${workspaceId}`);
}

async function rejectAction(formData: FormData) {
  'use server';
  await requireAuth();
  const id = String(formData.get('id') ?? '');
  const workspaceId = String(formData.get('workspaceId') ?? '');
  if (!id) return;
  await rejectPayment(id);
  redirect(`/dashboard/payments?workspaceId=${workspaceId}`);
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ workspaceId?: string }>;
}) {
  await requireAuth();
  const { workspaceId: qWs } = await searchParams;

  let workspaces: Awaited<ReturnType<typeof listWorkspaces>> = [];
  let payments: Awaited<ReturnType<typeof listPayments>> = [];
  let error: string | null = null;
  let workspaceId = qWs ?? '';

  try {
    workspaces = await listWorkspaces();
    if (!workspaceId && workspaces[0]) workspaceId = workspaces[0].id;
    if (workspaceId) payments = await listPayments(workspaceId);
  } catch (e) {
    error = e instanceof Error ? e.message : 'Gagal memuat pembayaran';
  }

  return (
    <>
      <PageHeader
        title="Pembayaran"
        description="Konfirmasi atau tolak pembayaran manual."
        actions={
          <Link
            href={`/dashboard/billing?workspaceId=${workspaceId}`}
            className="text-sm font-medium text-emerald-800 underline-offset-2 hover:underline"
          >
            Tagihan
          </Link>
        }
      />

      {workspaces.length > 0 && (
        <WorkspaceChips
          workspaces={workspaces}
          workspaceId={workspaceId}
          hrefFor={(id) => `/dashboard/payments?workspaceId=${id}`}
        />
      )}

      {error && (
        <Alert variant="error" className="mt-4">
          {error}
        </Alert>
      )}

      {payments.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="Belum ada pembayaran"
          body="Pembayaran manual dari tagihan akan muncul di sini untuk dikonfirmasi."
        />
      ) : (
        <ul className="mt-6 space-y-2">
          {payments.map((p) => (
            <li key={p.id} className="tk-card px-5 py-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-zinc-900">
                      {p.paymentNumber}
                    </p>
                    <StatusBadge status={p.status} kind="payment" />
                    {p.method ? (
                      <span className="text-xs text-zinc-400">{p.method}</span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-base font-semibold tabular-nums text-zinc-900">
                    {formatIdr(p.amount)}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {p.tenant?.fullName ?? '-'}
                    {p.manualReference ? ` · ref ${p.manualReference}` : ''}
                  </p>
                  {p.allocations?.map(
                    (a: {
                      id: string;
                      invoice?: { invoiceNumber: string; status?: string };
                    }) => (
                      <p key={a.id} className="text-xs text-zinc-400">
                        {a.invoice?.invoiceNumber}
                        {a.invoice?.status ? ` (${a.invoice.status})` : ''}
                      </p>
                    ),
                  )}
                  <Link
                    href={`/dashboard/payments/${p.id}?workspaceId=${workspaceId}`}
                    className="mt-2 inline-block text-xs font-medium text-emerald-800 underline-offset-2 hover:underline"
                  >
                    Detail / OCR / kuitansi
                  </Link>
                </div>
                {p.status === 'PENDING' && (
                  <div className="flex flex-wrap gap-2">
                    <form action={confirmAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <input
                        type="hidden"
                        name="workspaceId"
                        value={workspaceId}
                      />
                      <ConfirmSubmitButton
                        className="tk-btn-sm"
                        title="Konfirmasi pembayaran?"
                        description={`Pembayaran ${p.paymentNumber} akan dikonfirmasi dan dialokasikan ke tagihan terkait.`}
                        confirmLabel="Ya, konfirmasi"
                        pendingLabel="Mengonfirmasi..."
                      >
                        Konfirmasi
                      </ConfirmSubmitButton>
                    </form>
                    <form action={rejectAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <input
                        type="hidden"
                        name="workspaceId"
                        value={workspaceId}
                      />
                      <ConfirmSubmitButton
                        className="tk-btn-secondary !px-2.5 !py-1 !text-xs"
                        title="Tolak pembayaran?"
                        description={`Pembayaran ${p.paymentNumber} akan ditolak.`}
                        confirmLabel="Ya, tolak"
                        pendingLabel="Menolak..."
                        danger
                      >
                        Tolak
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
