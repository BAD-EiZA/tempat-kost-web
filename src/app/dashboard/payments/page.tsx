import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import {
  confirmPayment,
  listPayments,
  listWorkspaces,
  rejectPayment,
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Pembayaran</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Konfirmasi / tolak pembayaran manual. AI OCR belakangan (Phase 2).
          </p>
        </div>
        <Link
          href={`/dashboard/billing?workspaceId=${workspaceId}`}
          className="text-sm underline"
        >
          ← Tagihan
        </Link>
      </div>

      {workspaces.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/dashboard/payments?workspaceId=${ws.id}`}
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
        {payments.length === 0 ? (
          <li className="p-6 text-sm text-zinc-600">Belum ada pembayaran.</li>
        ) : (
          payments.map((p) => (
            <li key={p.id} className="px-6 py-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {p.paymentNumber}{' '}
                    <span className="text-xs font-normal text-zinc-500">
                      {p.status} · {p.method}
                    </span>
                  </p>
                  <p className="text-xs text-zinc-500">
                    {p.tenant?.fullName ?? '—'} · {formatIdr(p.amount)}
                    {p.manualReference ? ` · ref ${p.manualReference}` : ''}
                  </p>
                  {p.allocations?.map(
                    (a: {
                      id: string;
                      invoice?: { invoiceNumber: string; status?: string };
                    }) => (
                    <p key={a.id} className="text-xs text-zinc-400">
                      → {a.invoice?.invoiceNumber} ({a.invoice?.status})
                    </p>
                  ))}
                  <Link
                    href={`/dashboard/payments/${p.id}?workspaceId=${workspaceId}`}
                    className="mt-1 inline-block text-xs underline"
                  >
                    Detail / OCR / kuitansi
                  </Link>
                </div>
                {p.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <form action={confirmAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <input
                        type="hidden"
                        name="workspaceId"
                        value={workspaceId}
                      />
                      <button
                        type="submit"
                        className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white"
                      >
                        Konfirmasi
                      </button>
                    </form>
                    <form action={rejectAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <input
                        type="hidden"
                        name="workspaceId"
                        value={workspaceId}
                      />
                      <button
                        type="submit"
                        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs"
                      >
                        Tolak
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </li>
          ))
        )}
      </ul>
    </>
  );
}
