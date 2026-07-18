import Link from 'next/link';
import { requireAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import {
  resolvePortalTenantId,
  withTenant,
} from '@/lib/portal-tenant';

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

function formatIdr(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);
}

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
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
        {error}
      </div>
    );
  }

  if (!tenantId) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
        Akun belum terhubung ke profil penyewa. Minta pengelola mengisi email
        yang sama dengan akun login Anda pada data penyewa.
      </div>
    );
  }

  return (
    <>
      <h1 className="text-xl font-semibold">Halo, {tenantName}</h1>
      {multi && (
        <p className="mt-1 text-xs text-zinc-500">
          Beberapa profil — ganti di pojok kanan atas.
        </p>
      )}
      {home?.activeLease && (
        <p className="mt-1 text-sm text-zinc-600">
          {home.activeLease.property?.name} · {home.activeLease.room?.name} ·{' '}
          {home.activeLease.leaseNumber}
        </p>
      )}

      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-5">
        <p className="text-xs uppercase text-zinc-500">Tunggakan</p>
        <p className="mt-1 text-2xl font-semibold">
          {formatIdr(home?.outstanding ?? 0)}
        </p>
        <Link
          href={withTenant('/portal/bills', tenantId)}
          className="mt-2 inline-block text-xs underline"
        >
          Lihat tagihan / bayar
        </Link>
      </div>

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Tagihan terbuka</h2>
          <Link
            href={withTenant('/portal/bills', tenantId)}
            className="text-xs underline"
          >
            Semua
          </Link>
        </div>
        <ul className="mt-2 divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
          {(home?.openInvoices ?? []).length === 0 ? (
            <li className="p-4 text-sm text-zinc-500">Tidak ada tagihan.</li>
          ) : (
            home!.openInvoices.map((inv) => (
              <li key={inv.id} className="px-4 py-3 text-sm">
                <p className="font-medium">{inv.invoiceNumber}</p>
                <p className="text-xs text-zinc-500">
                  {inv.status} · due {String(inv.dueDate).slice(0, 10)} ·{' '}
                  {formatIdr(Number(inv.total) - Number(inv.amountPaid))}
                </p>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="mt-6">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Maintenance aktif</h2>
          <Link
            href={withTenant('/portal/maintenance', tenantId)}
            className="text-xs underline"
          >
            Ajukan
          </Link>
        </div>
        <ul className="mt-2 divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
          {(home?.maintenance ?? []).length === 0 ? (
            <li className="p-4 text-sm text-zinc-500">Tidak ada laporan.</li>
          ) : (
            home!.maintenance.map((m) => (
              <li key={m.id} className="px-4 py-3 text-sm">
                {m.title}{' '}
                <span className="text-xs text-zinc-500">{m.status}</span>
              </li>
            ))
          )}
        </ul>
      </section>
    </>
  );
}
