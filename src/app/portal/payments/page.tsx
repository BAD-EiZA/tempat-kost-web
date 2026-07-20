import Link from 'next/link';
import { requireAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { resolvePortalTenantId, withTenant } from '@/lib/portal-tenant';
import { formatDateId, formatIdr } from '@/lib/format';
import { EmptyState } from '@/components/ui';
import { PortalPageHeader } from '@/components/portal/page-header';
import { StatusBadge } from '@/components/portal/status-badge';

type Attempt = {
  id: string;
  orderId: string;
  status: string;
  amount: string | number;
  createdAt: string;
  invoiceId: string | null;
};

export default async function PortalPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tenantId?: string }>;
}) {
  await requireAuth();
  const sp = await searchParams;
  let attempts: Attempt[] = [];
  let tenantId = '';
  let error: string | null = null;

  try {
    const resolved = await resolvePortalTenantId(sp.tenantId);
    tenantId = resolved.tenantId;
    if (tenantId) {
      attempts = await apiFetch<Attempt[]>(
        `/v1/portal/payment-attempts?tenantId=${encodeURIComponent(tenantId)}`,
      );
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Gagal';
  }

  return (
    <div className="space-y-4">
      <PortalPageHeader
        title="Riwayat pembayaran"
        description="Transaksi online (Snap)."
      />
      {error ? (
        <div className="tk-alert" data-variant="warning">
          {error}
        </div>
      ) : null}

      {attempts.length === 0 ? (
        <EmptyState
          title="Belum ada transaksi"
          body="Pembayaran online yang Anda mulai akan tercatat di sini."
          action={
            tenantId ? (
              <Link
                href={withTenant('/portal/bills', tenantId)}
                className="tk-btn !text-sm"
              >
                Lihat tagihan
              </Link>
            ) : null
          }
        />
      ) : (
        <ul className="space-y-2">
          {attempts.map((a) => (
            <li key={a.id} className="tk-card p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-base font-semibold tabular-nums text-zinc-900">
                  {formatIdr(Number(a.amount))}
                </p>
                <StatusBadge status={a.status} kind="payment" />
              </div>
              <p className="mt-1 truncate text-xs text-zinc-500">{a.orderId}</p>
              <p className="mt-0.5 text-xs text-zinc-400">
                {formatDateId(a.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
