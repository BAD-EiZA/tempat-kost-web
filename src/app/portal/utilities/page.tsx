import { requireAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { resolvePortalTenantId } from '@/lib/portal-tenant';

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

function formatIdr(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);
}

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
    <>
      <h1 className="text-xl font-semibold">Utilitas / listrik</h1>
      {error && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
          {error}
        </div>
      )}
      {!data?.lease ? (
        <p className="mt-4 text-sm text-zinc-500">Tidak ada sewa aktif.</p>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="rounded-xl border bg-white p-4 text-sm">
            <p className="font-medium">
              {data.lease.property} / {data.lease.room}
            </p>
            {data.policies.map((p, i) => (
              <p key={i} className="mt-1 text-xs text-zinc-500">
                {p.payerType} · {p.billingMethod}
                {p.fixedMonthlyFee != null
                  ? ` · fixed ${formatIdr(Number(p.fixedMonthlyFee))}`
                  : ''}
                {p.ratePerUnit != null ? ` · Rp${p.ratePerUnit}/kWh` : ''}
              </p>
            ))}
          </div>
          <section>
            <h2 className="text-sm font-medium">Tagihan utilitas</h2>
            <ul className="mt-2 divide-y rounded-xl border bg-white">
              {data.invoices.length === 0 ? (
                <li className="p-3 text-xs text-zinc-500">Belum ada.</li>
              ) : (
                data.invoices.map((inv) => (
                  <li key={inv.id} className="px-3 py-2 text-xs">
                    {inv.invoiceNumber} · {inv.status} ·{' '}
                    {formatIdr(Number(inv.total))} · due{' '}
                    {String(inv.dueDate).slice(0, 10)}
                  </li>
                ))
              )}
            </ul>
          </section>
          <section>
            <h2 className="text-sm font-medium">Pembacaan meter</h2>
            <ul className="mt-2 space-y-2">
              {data.meters.map((m) => (
                <li key={m.id} className="rounded-xl border bg-white p-3 text-xs">
                  <p className="font-medium">{m.label}</p>
                  {m.readings.map((r, i) => (
                    <p key={i} className="text-zinc-500">
                      {r.periodLabel}: {r.consumption} · {r.status}
                    </p>
                  ))}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </>
  );
}
