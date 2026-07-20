import Link from 'next/link';
import { requireAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import {
  resolvePortalTenantId,
  withTenant,
} from '@/lib/portal-tenant';
import { formatDateId, formatIdr } from '@/lib/format';
import { EmptyState } from '@/components/ui';
import { PortalPageHeader } from '@/components/portal/page-header';
import { StatusBadge } from '@/components/portal/status-badge';
import { PortalPayClient } from './pay-client';
import { PortalProofUpload } from './proof-upload';

type Invoice = {
  id: string;
  workspaceId: string;
  invoiceNumber: string;
  status: string;
  total: string | number;
  amountPaid: string | number;
  dueDate: string;
};

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
    <div className="space-y-4">
      <PortalPageHeader
        title="Tagihan"
        description="Bayar online atau unggah bukti transfer."
      />
      {error ? (
        <div className="tk-alert" data-variant="warning">
          {error}
        </div>
      ) : null}

      {invoices.length === 0 ? (
        <EmptyState
          title="Belum ada tagihan"
          body="Tagihan baru akan muncul di sini."
          action={
            tenantId ? (
              <Link
                href={withTenant('/portal', tenantId)}
                className="tk-btn-secondary !text-sm"
              >
                Kembali ke home
              </Link>
            ) : null
          }
        />
      ) : (
        <ul className="space-y-3">
          {invoices.map((inv) => {
            const outstanding =
              Number(inv.total) - Number(inv.amountPaid || 0);
            const payable =
              outstanding > 0 &&
              ['OPEN', 'PARTIALLY_PAID', 'OVERDUE'].includes(inv.status);
            return (
              <li key={inv.id} className="tk-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900">
                      {inv.invoiceNumber}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Total {formatIdr(Number(inv.total))}
                    </p>
                  </div>
                  <StatusBadge status={inv.status} kind="invoice" />
                </div>
                <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-xs text-zinc-500">Sisa bayar</p>
                    <p className="text-lg font-semibold tabular-nums text-zinc-900">
                      {formatIdr(Math.max(0, outstanding))}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      Jatuh tempo {formatDateId(inv.dueDate)}
                    </p>
                  </div>
                  {payable && tenantId ? (
                    <PortalPayClient
                      tenantId={tenantId}
                      invoiceId={inv.id}
                      className="tk-btn !px-3 !py-2 !text-xs"
                    />
                  ) : null}
                </div>
                {payable && tenantId && workspaceId ? (
                  <div className="mt-3 border-t border-zinc-100 pt-3">
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
          })}
        </ul>
      )}

      {tenantId ? (
        <p className="text-center text-xs">
          <Link
            href={withTenant('/portal/payments', tenantId)}
            className="font-medium text-emerald-800 underline-offset-2 hover:underline"
          >
            Riwayat pembayaran online
          </Link>
        </p>
      ) : null}
    </div>
  );
}
