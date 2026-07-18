import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Alert, ConfirmSubmitButton } from '@/components/ui';
import { requireAuth } from '@/lib/auth';
import {
  apiFetch,
  confirmPayment,
  getPayment,
  rejectPayment,
} from '@/lib/api';
import { PdfDownload } from './pdf-download';

function formatIdr(n: string | number) {
  const v = typeof n === 'string' ? Number(n) : n;
  if (Number.isNaN(v)) return String(n);
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(v);
}

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
      <Link
        href={`/dashboard/payments?workspaceId=${workspaceId}`}
        className="text-sm underline"
      >
        ← Pembayaran
      </Link>
      {error && (
        <Alert variant="error" className="mt-4">{error}</Alert>
      )}
      {payment && (
        <div className="mt-4 space-y-4">
          <div className="rounded-xl border bg-white p-6">
            <h1 className="text-xl font-semibold">{payment.paymentNumber}</h1>
            <p className="mt-1 text-sm text-zinc-600">
              {payment.status} · {payment.method} · {formatIdr(payment.amount)}
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
                      className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs text-white"
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
                      className="rounded-lg border px-3 py-1.5 text-xs"
                      title="Tolak pembayaran?"
                      description={`Pembayaran ${payment.paymentNumber} akan ditolak. Tindakan ini mengubah status pembayaran.`}
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
                    className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs text-white"
                  >
                    Cetak HTML
                  </a>
                  <PdfDownload paymentId={payment.id} />
                </>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-white p-6">
            <h2 className="font-medium">AI OCR / risk</h2>
            {!payment.aiJobs?.length ? (
              <p className="mt-2 text-sm text-zinc-500">
                Belum ada job AI. Upload bukti dengan OCR saat catat bayar.
              </p>
            ) : (
              payment.aiJobs.map((job: { id: string; status?: string; resultJson?: unknown }) => (
                <div
                  key={job.id}
                  className="mt-3 rounded-lg border border-zinc-100 bg-zinc-50 p-3 text-xs"
                >
                  <p className="font-medium">
                    {job.id} · {job.status}
                  </p>
                  <pre className="mt-2 overflow-auto whitespace-pre-wrap">
                    {JSON.stringify(job.resultJson, null, 2)}
                  </pre>
                  {job.status === 'NEEDS_REVIEW' && (
                    <form action={confirmAi} className="mt-2">
                      <input type="hidden" name="jobId" value={job.id} />
                      <input type="hidden" name="paymentId" value={payment.id} />
                      <input
                        type="hidden"
                        name="workspaceId"
                        value={workspaceId}
                      />
                      <button
                        type="submit"
                        className="rounded bg-zinc-900 px-2 py-1 text-white"
                      >
                        Confirm AI result
                      </button>
                    </form>
                  )}
                </div>
              ))
            )}
          </div>

          {payment.receipt && (
            <div className="rounded-xl border bg-white p-6">
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
