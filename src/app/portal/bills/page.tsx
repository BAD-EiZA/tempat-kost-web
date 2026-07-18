import { requireAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import {
  resolvePortalTenantId,
  withTenant,
} from '@/lib/portal-tenant';
import { PortalPayClient } from './pay-client';
import { PortalProofUpload } from './proof-upload';
import Link from 'next/link';

type Invoice = {
  id: string;
  workspaceId: string;
  invoiceNumber: string;
  status: string;
  total: string | number;
  amountPaid: string | number;
  dueDate: string;
};

function formatIdr(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);
}

export default async function PortalBillsPage({
  searchParams,
}: {
  searchParams: Promise<{ tenantId?: string }>;
}) {
  await requireAuth();
  const sp = await searchParams;
  let invoices: Invoice[] = [];
  let tenantId = '';
  let workspaceId = '';
  let error: string | null = null;

  try {
    const resolved = await resolvePortalTenantId(sp.tenantId);
    tenantId = resolved.tenantId;
    workspaceId =
      resolved.tenants.find((t) => t.id === tenantId)?.workspaceId ?? '';
    if (tenantId) {
      invoices = await apiFetch<Invoice[]>(
        `/v1/portal/invoices?tenantId=${encodeURIComponent(tenantId)}`,
      );
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Gagal memuat';
  }

  return (
    <>
      <h1 className="text-xl font-semibold">Tagihan</h1>
      <p className="mt-1 text-xs text-zinc-500">
        Bayar online (Snap) atau unggah bukti transfer.
      </p>
      {error && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
          {error}
        </div>
      )}
      <ul className="mt-4 divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
        {invoices.length === 0 ? (
          <li className="p-4 text-sm text-zinc-500">Belum ada tagihan.</li>
        ) : (
          invoices.map((inv) => {
            const outstanding =
              Number(inv.total) - Number(inv.amountPaid || 0);
            const payable =
              outstanding > 0 &&
              ['OPEN', 'PARTIALLY_PAID', 'OVERDUE'].includes(inv.status);
            return (
              <li key={inv.id} className="px-4 py-3 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{inv.invoiceNumber}</p>
                    <p className="text-xs text-zinc-500">
                      {inv.status} · {formatIdr(Number(inv.total))}
                      {outstanding > 0
                        ? ` · sisa ${formatIdr(outstanding)}`
                        : ''}{' '}
                      · due {String(inv.dueDate).slice(0, 10)}
                    </p>
                  </div>
                  {payable && tenantId ? (
                    <PortalPayClient tenantId={tenantId} invoiceId={inv.id} />
                  ) : null}
                </div>
                {payable && tenantId && workspaceId ? (
                  <div className="mt-2 border-t border-zinc-50 pt-2">
                    <PortalProofUpload
                      tenantId={tenantId}
                      workspaceId={workspaceId}
                      invoiceId={inv.id}
                      amount={outstanding}
                    />
                  </div>
                ) : null}
              </li>
            );
          })
        )}
      </ul>
      <p className="mt-4 text-xs">
        <Link
          href={withTenant('/portal/payments', tenantId)}
          className="underline"
        >
          Lihat status pembayaran →
        </Link>
      </p>
    </>
  );
}
