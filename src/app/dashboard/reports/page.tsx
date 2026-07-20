import Link from 'next/link';
import { requireAuth } from '@/lib/auth';
import { apiFetch, listWorkspaces } from '@/lib/api';
import {
  EmptyState,
  PageHeader,
  WorkspaceChips,
} from '@/components/ui';
import { formatIdr } from '@/lib/format';

type Overview = {
  properties: number;
  rooms: number;
  occupiedRooms: number;
  availableRooms: number;
  occupancyRate: number;
  activeTenants: number;
  activeLeases: number;
  openInvoiceCount: number;
  outstanding: number;
  overdueInvoices: number;
  pendingPayments: number;
  expensesPaid: number;
};

type Aging = {
  buckets: Record<string, { count: number; amount: number }>;
  rows: Array<{
    id: string;
    invoiceNumber: string;
    tenant: string;
    status: string;
    dueDate: string;
    daysPastDue: number;
    outstanding: number;
    bucket: string;
  }>;
};

const BUCKET_LABEL: Record<string, string> = {
  current: 'Belum jatuh tempo',
  d1_30: '1-30 hari',
  d31_60: '31-60 hari',
  d61_90: '61-90 hari',
  d90_plus: '>90 hari',
};

const EXPORT_LABEL = {
  invoices: 'Tagihan',
  payments: 'Pembayaran',
  tenants: 'Penghuni',
  expenses: 'Pengeluaran',
} as const;

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ workspaceId?: string; kind?: string }>;
}) {
  await requireAuth();
  const sp = await searchParams;
  let workspaces: Awaited<ReturnType<typeof listWorkspaces>> = [];
  let workspaceId = sp.workspaceId ?? '';
  let overview: Overview | null = null;
  let aging: Aging | null = null;
  let pnl: {
    income: number;
    expense: number;
    net: number;
    from: string;
    to: string;
  } | null = null;
  let occupancy: {
    occupancyRate: number;
    total: number;
    occupied: number;
  } | null = null;
  let error: string | null = null;

  try {
    workspaces = await listWorkspaces();
    if (!workspaceId && workspaces[0]) workspaceId = workspaces[0].id;
    if (workspaceId) {
      const [ov, ag, p, o] = await Promise.all([
        apiFetch<Overview>(
          `/v1/reports/overview?workspaceId=${encodeURIComponent(workspaceId)}`,
        ),
        apiFetch<Aging>(
          `/v1/reports/aging?workspaceId=${encodeURIComponent(workspaceId)}`,
        ),
        apiFetch<{
          income: number;
          expense: number;
          net: number;
          from: string;
          to: string;
        }>(`/v1/reports/pnl?workspaceId=${encodeURIComponent(workspaceId)}`),
        apiFetch<{ occupancyRate: number; total: number; occupied: number }>(
          `/v1/reports/occupancy?workspaceId=${encodeURIComponent(workspaceId)}`,
        ),
      ]);
      overview = ov;
      aging = ag;
      pnl = p;
      occupancy = o;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Gagal memuat laporan';
  }

  return (
    <>
      <PageHeader
        title="Laporan"
        description="Ringkasan keuangan, aging, okupansi, dan ekspor data."
      />
      {workspaces.length > 0 && (
        <WorkspaceChips
          workspaces={workspaces}
          workspaceId={workspaceId}
          hrefFor={(id) => `/dashboard/reports?workspaceId=${id}`}
        />
      )}
      {error && (
        <div className="tk-alert mt-4" data-variant="warning">
          {error}
        </div>
      )}

      {!workspaceId && !error ? (
        <EmptyState
          className="mt-6"
          title="Pilih workspace"
          body="Pilih workspace di atas untuk memuat laporan."
        />
      ) : null}

      {(pnl || occupancy) && (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {pnl && (
            <>
              <div className="tk-card p-4">
                <p className="text-xs text-zinc-500">Pendapatan</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">
                  {formatIdr(pnl.income)}
                </p>
                <p className="text-[11px] text-zinc-400">
                  Periode {pnl.from} sampai {pnl.to}
                </p>
              </div>
              <div className="tk-card p-4">
                <p className="text-xs text-zinc-500">Pengeluaran</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">
                  {formatIdr(pnl.expense)}
                </p>
                <p className="text-[11px] text-zinc-400">
                  Laba bersih {formatIdr(pnl.net)}
                </p>
              </div>
            </>
          )}
          {occupancy && (
            <div className="tk-card p-4">
              <p className="text-xs text-zinc-500">Okupansi saat ini</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {occupancy.occupancyRate}%
              </p>
              <p className="text-[11px] text-zinc-400">
                {occupancy.occupied}/{occupancy.total} kamar
              </p>
            </div>
          )}
        </div>
      )}

      {overview && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: 'Okupansi',
              value: `${overview.occupancyRate}%`,
              sub: `${overview.occupiedRooms}/${overview.rooms} kamar`,
            },
            {
               label: 'Belum dibayar',
              value: formatIdr(overview.outstanding),
              sub: `${overview.openInvoiceCount} tagihan terbuka`,
            },
            {
               label: 'Lewat jatuh tempo',
              value: String(overview.overdueInvoices),
               sub: `${overview.pendingPayments} pembayaran menunggu`,
            },
            {
               label: 'Pengeluaran dibayar',
              value: formatIdr(overview.expensesPaid),
               sub: `${overview.activeTenants} penghuni · ${overview.activeLeases} kontrak`,
            },
          ].map((c) => (
            <div
              key={c.label}
              className="rounded-xl border border-zinc-200 bg-white p-4"
            >
              <p className="text-xs text-zinc-500">{c.label}</p>
              <p className="mt-1 text-lg font-semibold">{c.value}</p>
              <p className="mt-0.5 text-[11px] text-zinc-400">{c.sub}</p>
            </div>
          ))}
        </div>
      )}

      {aging && (
        <div className="mt-8">
          <h2 className="font-medium">Aging piutang</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-5">
            {Object.entries(aging.buckets).map(([key, b]) => (
              <div
                key={key}
                className="rounded-lg border bg-white px-3 py-2 text-xs"
              >
                <p className="text-zinc-500">{BUCKET_LABEL[key] ?? key}</p>
                <p className="mt-1 font-semibold">{formatIdr(b.amount)}</p>
                 <p className="text-zinc-400">{b.count} tagihan</p>
              </div>
            ))}
          </div>
          {aging.rows.length > 0 && (
            <div className="mt-4 overflow-auto rounded-xl border bg-white">
               <table className="min-w-full text-xs">
                 <caption className="sr-only">Rincian umur piutang</caption>
                <thead className="bg-zinc-50 text-left">
                  <tr>
                     <th scope="col" className="px-3 py-2">Tagihan</th>
                     <th scope="col" className="px-3 py-2">Penghuni</th>
                     <th scope="col" className="px-3 py-2">Jatuh tempo</th>
                     <th scope="col" className="px-3 py-2">Terlambat</th>
                     <th scope="col" className="px-3 py-2">Belum dibayar</th>
                  </tr>
                </thead>
                <tbody>
                  {aging.rows.slice(0, 40).map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="px-3 py-2 font-mono">{r.invoiceNumber}</td>
                      <td className="px-3 py-2">{r.tenant}</td>
                      <td className="px-3 py-2">{r.dueDate}</td>
                      <td
                        className={`px-3 py-2 ${
                          r.daysPastDue > 30
                            ? 'text-red-700'
                            : r.daysPastDue > 0
                              ? 'text-amber-700'
                              : ''
                        }`}
                      >
                         {r.daysPastDue > 0 ? `${r.daysPastDue} hari` : 'Belum jatuh tempo'}
                      </td>
                      <td className="px-3 py-2">{formatIdr(r.outstanding)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {workspaceId && (
        <div className="mt-8">
          <h2 className="font-medium">Export CSV</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {(['invoices', 'payments', 'tenants', 'expenses'] as const).map(
              (k) => (
                <Link
                  key={k}
                  href={`/api/reports/export?workspaceId=${encodeURIComponent(workspaceId)}&kind=${k}`}
                  className="rounded-lg border bg-white px-3 py-2 text-sm capitalize hover:border-zinc-400"
                >
                   Unduh {EXPORT_LABEL[k]} CSV
                </Link>
              ),
            )}
          </div>
        </div>
      )}
    </>
  );
}
