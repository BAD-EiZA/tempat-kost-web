import { requireAuth } from '@/lib/auth';
import { resolvePortalTenantId } from '@/lib/portal-tenant';
import { apiFetch } from '@/lib/api';
import { formatDateId, formatIdr } from '@/lib/format';
import { EmptyState } from '@/components/ui';
import { PortalPageHeader } from '@/components/portal/page-header';
import { StatusBadge } from '@/components/portal/status-badge';
import { ContractPdfButton } from './pdf-button';

type Lease = {
  id: string;
  leaseNumber: string;
  status: string;
  startDate: string;
  endDate: string | null;
  rentAmount: string | number;
  depositAmount: string | number;
  room?: { name: string };
  property?: { name: string; addressLine: string | null };
  checkinRecord?: { completedAt: string } | null;
  checkoutRecord?: { completedAt: string } | null;
  contracts?: Array<{
    id: string;
    version: number;
    status: string;
    signToken: string | null;
    signedAt: string | null;
  }>;
};

export default async function PortalContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ tenantId?: string }>;
}) {
  await requireAuth();
  const sp = await searchParams;
  let leases: Lease[] = [];
  let tenantId = '';
  let error: string | null = null;

  try {
    const resolved = await resolvePortalTenantId(sp.tenantId);
    tenantId = resolved.tenantId;
    if (tenantId) {
      leases = await apiFetch<Lease[]>(
        `/v1/portal/contracts?tenantId=${encodeURIComponent(tenantId)}`,
      );
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Gagal memuat kontrak';
  }

  return (
    <div className="space-y-4">
      <PortalPageHeader
        title="Kontrak"
        description="Sewa aktif dan dokumen perjanjian."
      />
      {error ? (
        <div className="tk-alert" data-variant="warning">
          {error}
        </div>
      ) : null}

      {leases.length === 0 ? (
        <EmptyState title="Belum ada kontrak" body="Kontrak sewa akan tampil di sini." />
      ) : (
        <ul className="space-y-3">
          {leases.map((l) => (
            <li key={l.id} className="tk-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">
                    {l.leaseNumber}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {l.property?.name}
                    {l.room?.name ? ` / ${l.room.name}` : ''}
                  </p>
                </div>
                <StatusBadge status={l.status} kind="lease" />
              </div>
              <p className="mt-3 text-base font-semibold tabular-nums text-zinc-900">
                {formatIdr(Number(l.rentAmount))}
                <span className="text-xs font-normal text-zinc-500"> /bulan</span>
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {formatDateId(l.startDate)}
                {l.endDate ? ` - ${formatDateId(l.endDate)}` : ''}
              </p>

              {l.contracts && l.contracts.length > 0 ? (
                <ul className="mt-3 space-y-2 border-t border-zinc-100 pt-3">
                  {l.contracts.map((c) => (
                    <li
                      key={c.id}
                      className="flex flex-wrap items-center gap-2 text-xs"
                    >
                      <span className="text-zinc-600">
                        Dokumen v{c.version}
                        {c.signedAt ? ` · ${formatDateId(c.signedAt)}` : ''}
                      </span>
                      <StatusBadge status={c.status} kind="contract" />
                      {c.status !== 'signed' && c.signToken ? (
                        <a
                          href={`/sign/${c.signToken}`}
                          className="tk-btn-sm"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Tanda tangani
                        </a>
                      ) : null}
                      {tenantId ? (
                        <ContractPdfButton
                          contractId={c.id}
                          tenantId={tenantId}
                        />
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
