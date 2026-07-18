import { requireAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { resolvePortalTenantId } from '@/lib/portal-tenant';

type Attempt = {
  id: string;
  orderId: string;
  status: string;
  amount: string | number;
  createdAt: string;
  invoiceId: string | null;
};

function formatIdr(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);
}

export default async function PortalPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tenantId?: string }>;
}) {
  await requireAuth();
  const sp = await searchParams;
  let attempts: Attempt[] = [];
  let error: string | null = null;

  try {
    const { tenantId } = await resolvePortalTenantId(sp.tenantId);
    if (tenantId) {
      attempts = await apiFetch<Attempt[]>(
        `/v1/portal/payment-attempts?tenantId=${encodeURIComponent(tenantId)}`,
      );
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Gagal';
  }

  return (
    <>
      <h1 className="text-xl font-semibold">Status pembayaran online</h1>
      <p className="mt-1 text-xs text-zinc-500">Midtrans payment attempts</p>
      {error && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
          {error}
        </div>
      )}
      <ul className="mt-4 divide-y rounded-xl border bg-white">
        {attempts.length === 0 ? (
          <li className="p-4 text-sm text-zinc-500">Belum ada attempt.</li>
        ) : (
          attempts.map((a) => (
            <li key={a.id} className="px-4 py-3 text-sm">
              <p className="font-medium">
                {a.orderId}{' '}
                <span className="text-xs font-normal text-zinc-500">
                  {a.status}
                </span>
              </p>
              <p className="text-xs text-zinc-500">
                {formatIdr(Number(a.amount))} ·{' '}
                {String(a.createdAt).slice(0, 19).replace('T', ' ')}
              </p>
            </li>
          ))
        )}
      </ul>
    </>
  );
}
