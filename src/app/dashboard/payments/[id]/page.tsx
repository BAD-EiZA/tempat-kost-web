import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Alert,
  ConfirmSubmitButton,
  PageHeader,
  StatusBadge,
} from '@/components/ui';
import { requireAuth } from '@/lib/auth';
import {
  apiFetch,
  confirmPayment,
  getPayment,
  rejectPayment,
} from '@/lib/api';
import { formatIdr } from '@/lib/format';
import { PdfDownload } from './pdf-download';

async function confirmAction(formData: FormData) {
  'use server';
  await requireAuth();
  const id = String(formData.get('id') ?? '');
  const workspaceId = String(formData.get('workspaceId') ?? '');
  if (!id) return;
  await confirmPayment(id);
  redirect(`/dashboard/payments/${id}?workspaceId=${workspaceId}`);
}

async function rejectAction(formData: FormData) {
  'use server';
  await requireAuth();
  const id = String(formData.get('id') ?? '');
  const workspaceId = String(formData.get('workspaceId') ?? '');
  if (!id) return;
  await rejectPayment(id);
  redirect(`/dashboard/payments/${id}?workspaceId=${workspaceId}`);
}

async function confirmAi(formData: FormData) {
  'use server';
  await requireAuth();
  const jobId = String(formData.get('jobId') ?? '');
  const paymentId = String(formData.get('paymentId') ?? '');
  const workspaceId = String(formData.get('workspaceId') ?? '');
  if (!jobId) return;
  await apiFetch(`/v1/ai/jobs/${jobId}/confirm`, { method: 'POST' });
  redirect(`/dashboard/payments/${paymentId}?workspaceId=${workspaceId}`);
}

export default async function PaymentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ workspaceId?: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const { workspaceId = '' } = await searchParams;
  let payment: Awaited<ReturnType<typeof getPayment>> | null = null;
  let error: string | null = null;
  try {
    payment = await getPayment(id);
  } catch (e) {
    error = e instanceof Error ? e.message : 'Gagal memuat';
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

  return (
    <>
      <PageHeader
        title={payment?.paymentNumber ?? 'Detail pembayaran'}
        description={
          payment
            ? `${payment.method ?? ''} · ${formatIdr(payment.amount)}`
            : undefined
        }
        actions={
          <Link
            href={`/dashboard/payments?workspaceId=${workspaceId}`}
            className="text-sm font-medium text-emerald-800 underline-offset-2 hover:underline"
          >
            Kembali
          </Link>
        }
      />
      {payment ? (
        <div className="mt-2">
          <StatusBadge status={payment.status} kind="payment" />
        </div>
      ) : null}
      {error && (
        <Alert variant="error" className="mt-4">
          {error}
        </Alert>
      )}
      {payment && (
        <div className="mt-4 space-y-4">
          <div className="tk-card p-6">
            <p className="text-2xl font-semibold tabular-nums text-zinc-900">
              {formatIdr(payment.amount)}
            </p>
            <p className="mt-1 text-sm text-zinc-600">
              {payment.method}
              {payment.manualReference ? ` · ref ${payment.manualReference}` : ''}
            </p>
            {payment.manualReference && (
              <p className="text-xs text-zinc-500">
                Ref: {payment.manualReference}
              </p>
            )}
            {payment.notes && (
              <p className="mt-2 text-xs text-zinc-500">{payment.notes}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {payment.status === 'PENDING' && (
                <>
                  <form action={confirmAction}>
                    <input type="hidden" name="id" value={payment.id} />
                    <input
                      type="hidden"
                      name="workspaceId"
                      value={workspaceId}
                    />
                    <ConfirmSubmitButton
                      className="tk-btn-sm"
                      title="Konfirmasi pembayaran?"
                      description={`Pembayaran ${payment.paymentNumber} akan dikonfirmasi dan dialokasikan ke tagihan terkait.`}
                      confirmLabel="Ya, konfirmasi"
                      pendingLabel="Mengonfirmasi..."
                    >
                      Konfirmasi
                    </ConfirmSubmitButton>
                  </form>
                  <form action={rejectAction}>
                    <input type="hidden" name="id" value={payment.id} />
                    <input
                      type="hidden"
                      name="workspaceId"
                      value={workspaceId}
                    />
                    <ConfirmSubmitButton
                      className="tk-btn-secondary !px-3 !py-1.5 !text-xs"
                      title="Tolak pembayaran?"
                      description={`Pembayaran ${payment.paymentNumber} akan ditolak.`}
                      confirmLabel="Ya, tolak"
                      pendingLabel="Menolak..."
                      danger
                    >
                      Tolak
                    </ConfirmSubmitButton>
                  </form>
                </>
              )}
              {payment.status === 'CONFIRMED' && (
                <>
                  <a
                    href={`${apiBase}/v1/receipts/by-payment/${payment.id}/html?print=1`}
                    target="_blank"
                    rel="noreferrer"
                    className="tk-btn-sm"
                  >
                    Cetak HTML
                  </a>
                  <PdfDownload paymentId={payment.id} />
                </>
              )}
            </div>
          </div>

          <div className="tk-card p-6">
            <h2 className="text-base font-semibold text-zinc-900">
              AI OCR / risk
            </h2>
            {!payment.aiJobs?.length ? (
              <p className="mt-2 text-sm text-zinc-500">
                Belum ada job AI. Upload bukti dengan OCR saat catat bayar di
                halaman Tagihan.
              </p>
            ) : (
              payment.aiJobs.map(
                (job: {
                  id: string;
                  status?: string;
                  resultJson?: unknown;
                }) => (
                  <div
                    key={job.id}
                    className="mt-3 rounded-xl border border-zinc-100 bg-zinc-50 p-3 text-xs"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-[10px] text-zinc-500">
                        {job.id.slice(0, 12)}…
                      </p>
                      {job.status ? (
                        <StatusBadge status={job.status} kind="payment" />
                      ) : null}
                    </div>
                    <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-white p-2 text-[11px] text-zinc-700">
                      {JSON.stringify(job.resultJson, null, 2)}
                    </pre>
                    {job.status === 'NEEDS_REVIEW' && (
                      <form action={confirmAi} className="mt-2">
                        <input type="hidden" name="jobId" value={job.id} />
                        <input
                          type="hidden"
                          name="paymentId"
                          value={payment.id}
                        />
                        <input
                          type="hidden"
                          name="workspaceId"
                          value={workspaceId}
                        />
                        <button type="submit" className="tk-btn-sm">
                          Konfirmasi hasil AI
                        </button>
                      </form>
                    )}
                  </div>
                ),
              )
            )}
          </div>

          {payment.receipt && (
            <div className="tk-card p-6">
              <h2 className="font-medium">
                Kuitansi {payment.receipt.receiptNumber}
              </h2>
              <pre className="mt-2 whitespace-pre-wrap text-xs text-zinc-700">
                {payment.receipt.bodyText}
              </pre>
            </div>
          )}
        </div>
      )}
    </>
  );
}
