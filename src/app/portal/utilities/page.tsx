import { requireAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { resolvePortalTenantId } from '@/lib/portal-tenant';
import { formatDateId, formatIdr } from '@/lib/format';
import { EmptyState } from '@/components/ui';
import { PortalPageHeader } from '@/components/portal/page-header';
import { StatusBadge } from '@/components/portal/status-badge';

type UtilitiesData = {
  lease: { room: string; property: string } | null;
  policies: Array<{
    payerType: string;
    billingMethod: string;
    fixedMonthlyFee: string | number | null;
    ratePerUnit: string | number | null;
  }>;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    total: string | number;
    status: string;
    dueDate: string;
  }>;
  meters: Array<{
    id: string;
    label: string;
    readings: Array<{
      periodLabel: string;
      consumption: string | number;
      status: string;
    }>;
  }>;
};

export default async function PortalUtilitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ tenantId?: string }>;
}) {
  await requireAuth();
  const sp = await searchParams;
  let data: UtilitiesData | null = null;
  let error: string | null = null;

  try {
    const { tenantId } = await resolvePortalTenantId(sp.tenantId);
    if (tenantId) {
      data = await apiFetch<UtilitiesData>(
        `/v1/portal/utilities?tenantId=${encodeURIComponent(tenantId)}`,
      );
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Gagal';
  }

  return (
    <div className="space-y-4">
      <PortalPageHeader
        title="Listrik & utilitas"
        description="Kebijakan, tagihan utilitas, dan bacaan meter."
      />
      {error ? (
        <div className="tk-alert" data-variant="warning">
          {error}
        </div>
      ) : null}

      {!data?.lease ? (
        <EmptyState
          title="Tidak ada sewa aktif"
          body="Data utilitas tersedia setelah kontrak aktif."
        />
      ) : (
        <div className="space-y-4">
          <div className="tk-card p-4">
            <p className="text-sm font-semibold text-zinc-900">
              {data.lease.property} / {data.lease.room}
            </p>
            {data.policies.length === 0 ? (
              <p className="mt-1 text-xs text-zinc-500">
                Belum ada kebijakan utilitas.
              </p>
            ) : (
              data.policies.map((p, i) => (
                <p key={i} className="mt-1 text-xs text-zinc-500">
                  {p.payerType} · {p.billingMethod}
                  {p.fixedMonthlyFee != null
                    ? ` · fixed ${formatIdr(Number(p.fixedMonthlyFee))}`
                    : ''}
                  {p.ratePerUnit != null
                    ? ` · ${formatIdr(Number(p.ratePerUnit))}/kWh`
                    : ''}
                </p>
              ))
            )}
          </div>

          <section>
            <h2 className="mb-2 text-sm font-semibold text-zinc-900">
              Tagihan utilitas
            </h2>
            {data.invoices.length === 0 ? (
              <EmptyState title="Belum ada tagihan utilitas" className="!py-6" />
            ) : (
              <ul className="space-y-2">
                {data.invoices.map((inv) => (
                  <li key={inv.id} className="tk-card p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-zinc-900">
                        {inv.invoiceNumber}
                      </p>
                      <StatusBadge status={inv.status} kind="invoice" />
                    </div>
                    <p className="mt-1 text-sm font-semibold tabular-nums">
                      {formatIdr(Number(inv.total))}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Jatuh tempo {formatDateId(inv.dueDate)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold text-zinc-900">
              Pembacaan meter
            </h2>
            {data.meters.length === 0 ? (
              <EmptyState title="Belum ada data meter" className="!py-6" />
            ) : (
              <ul className="space-y-2">
                {data.meters.map((m) => (
                  <li key={m.id} className="tk-card p-3">
                    <p className="text-sm font-medium text-zinc-900">
                      {m.label}
                    </p>
                    {m.readings.length === 0 ? (
                      <p className="mt-1 text-xs text-zinc-500">
                        Belum ada bacaan.
                      </p>
                    ) : (
                      <ul className="mt-2 space-y-1">
                        {m.readings.map((r, i) => (
                          <li
                            key={i}
                            className="flex justify-between gap-2 text-xs text-zinc-600"
                          >
                            <span>{r.periodLabel}</span>
                            <span className="tabular-nums">
                              {r.consumption} · {r.status}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
