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

type PortalHome = {
  outstanding: number;
  openInvoices: Array<{
    id: string;
    invoiceNumber: string;
    total: string | number;
    amountPaid: string | number;
    status: string;
    dueDate: string;
  }>;
  activeLease: {
    leaseNumber: string;
    room?: { name: string };
    property?: { name: string };
  } | null;
  maintenance: Array<{ id: string; title: string; status: string }>;
};

export default async function PortalHomePage({
  searchParams,
}: {
  searchParams: Promise<{ tenantId?: string }>;
}) {
  await requireAuth();
  const sp = await searchParams;
  let tenantName = '';
  let tenantId = '';
  let home: PortalHome | null = null;
  let error: string | null = null;
  let multi = false;

  try {
    const resolved = await resolvePortalTenantId(sp.tenantId);
    tenantId = resolved.tenantId;
    multi = resolved.tenants.length > 1;
    tenantName =
      resolved.tenants.find((t) => t.id === tenantId)?.fullName ?? '';
    if (tenantId) {
      home = await apiFetch<PortalHome>(
        `/v1/portal/home?tenantId=${encodeURIComponent(tenantId)}`,
      );
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Gagal memuat portal';
  }

  if (error) {
    return (
      <div className="tk-alert" data-variant="warning">
        {error}
      </div>
    );
  }

  if (!tenantId) {
    return (
      <EmptyState
        title="Profil penyewa belum terhubung"
        body="Minta pengelola mengisi email yang sama dengan akun login Anda pada data penyewa."
      />
    );
  }

  const outstanding = home?.outstanding ?? 0;
  const invoices = (home?.openInvoices ?? []).slice(0, 3);
  const maintenance = (home?.maintenance ?? []).slice(0, 3);

  return (
    <div className="space-y-6">
      <PortalPageHeader
        title={`Halo, ${tenantName}`}
        description={
          <>
            {home?.activeLease ? (
              <span>
                {home.activeLease.property?.name}
                {home.activeLease.room?.name
                  ? ` · ${home.activeLease.room.name}`
                  : ''}
                {home.activeLease.leaseNumber
                  ? ` · ${home.activeLease.leaseNumber}`
                  : ''}
              </span>
            ) : (
              <span>Portal penyewa</span>
            )}
            {multi ? (
              <span className="mt-1 block text-xs">
                Beberapa profil - ganti di pojok kanan atas.
              </span>
            ) : null}
          </>
        }
      />

      <div className="tk-card p-5">
        <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
          Tunggakan
        </p>
        <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-zinc-900">
          {formatIdr(outstanding)}
        </p>
        {outstanding > 0 ? (
          <Link
            href={withTenant('/portal/bills', tenantId)}
            className="tk-btn mt-4 w-full !py-2.5"
          >
            Bayar sekarang
          </Link>
        ) : (
          <p className="mt-3 text-sm text-emerald-800">Tidak ada tunggakan</p>
        )}
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-zinc-900">Tagihan terbuka</h2>
          <Link
            href={withTenant('/portal/bills', tenantId)}
            className="text-xs font-medium text-emerald-800"
          >
            Semua
          </Link>
        </div>
        {invoices.length === 0 ? (
          <EmptyState title="Tidak ada tagihan terbuka" className="!py-6" />
        ) : (
          <ul className="space-y-2">
            {invoices.map((inv) => {
              const sisa = Number(inv.total) - Number(inv.amountPaid);
              return (
                <li key={inv.id} className="tk-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-zinc-900">
                      {inv.invoiceNumber}
                    </p>
                    <StatusBadge status={inv.status} kind="invoice" />
                  </div>
                  <p className="mt-2 text-base font-semibold tabular-nums text-zinc-900">
                    {formatIdr(sisa)}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Jatuh tempo {formatDateId(inv.dueDate)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-zinc-900">Maintenance</h2>
          <Link
            href={withTenant('/portal/maintenance', tenantId)}
            className="text-xs font-medium text-emerald-800"
          >
            Ajukan
          </Link>
        </div>
        {maintenance.length === 0 ? (
          <EmptyState title="Tidak ada laporan aktif" className="!py-6" />
        ) : (
          <ul className="tk-list">
            {maintenance.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3 text-sm last:border-0"
              >
                <span className="min-w-0 truncate font-medium text-zinc-900">
                  {m.title}
                </span>
                <StatusBadge status={m.status} kind="maintenance" />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
