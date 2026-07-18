import Link from 'next/link';
import { requireAuth } from '@/lib/auth';
import { apiFetch, listWorkspaces } from '@/lib/api';

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

function formatIdr(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);
}

const BUCKET_LABEL: Record<string, string> = {
  current: 'Belum jatuh tempo',
  d1_30: '1–30 hari',
  d31_60: '31–60 hari',
  d61_90: '61–90 hari',
  d90_plus: '>90 hari',
};

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
  let exportData: { csv?: string; rowCount?: number; kind?: string } | null =
    null;
  let error: string | null = null;
  const kind = (sp.kind as 'invoices' | 'payments' | 'tenants' | 'expenses') ||
    'invoices';

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
      if (sp.kind) {
        exportData = await apiFetch<{
          csv?: string;
          rowCount?: number;
          kind?: string;
        }>(
          `/v1/reports/export?workspaceId=${encodeURIComponent(workspaceId)}&kind=${kind}`,
        );
      }
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Gagal memuat laporan';
  }

  return (
    <>
      <h1 className="text-2xl font-semibold">Laporan</h1>
      {workspaces.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/dashboard/reports?workspaceId=${ws.id}`}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                ws.id === workspaceId ? 'bg-zinc-900 text-white' : 'bg-zinc-100'
              }`}
            >
              {ws.name}
            </Link>
          ))}
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
          {error}
        </div>
      )}

      {(pnl || occupancy) && (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {pnl && (
            <>
              <div className="rounded-xl border bg-white p-4">
                <p className="text-xs text-zinc-500">P&L income</p>
                <p className="mt-1 text-lg font-semibold">
                  {formatIdr(pnl.income)}
                </p>
                <p className="text-[11px] text-zinc-400">
                  {pnl.from} → {pnl.to}
                </p>
              </div>
              <div className="rounded-xl border bg-white p-4">
                <p className="text-xs text-zinc-500">P&L expense / net</p>
                <p className="mt-1 text-lg font-semibold">
                  {formatIdr(pnl.expense)}
                </p>
                <p className="text-[11px] text-zinc-400">
                  Net {formatIdr(pnl.net)}
                </p>
              </div>
            </>
          )}
          {occupancy && (
            <div className="rounded-xl border bg-white p-4">
              <p className="text-xs text-zinc-500">Occupancy snapshot</p>
              <p className="mt-1 text-lg font-semibold">
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
              label: 'Outstanding',
              value: formatIdr(overview.outstanding),
              sub: `${overview.openInvoiceCount} tagihan terbuka`,
            },
            {
              label: 'Overdue',
              value: String(overview.overdueInvoices),
              sub: `${overview.pendingPayments} payment pending`,
            },
            {
              label: 'Expense paid',
              value: formatIdr(overview.expensesPaid),
              sub: `${overview.activeTenants} tenant · ${overview.activeLeases} lease`,
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
                <p className="text-zinc-400">{b.count} invoice</p>
              </div>
            ))}
          </div>
          {aging.rows.length > 0 && (
            <div className="mt-4 overflow-auto rounded-xl border bg-white">
              <table className="min-w-full text-xs">
                <thead className="bg-zinc-50 text-left">
                  <tr>
                    <th className="px-3 py-2">Invoice</th>
                    <th className="px-3 py-2">Tenant</th>
                    <th className="px-3 py-2">Due</th>
                    <th className="px-3 py-2">Hari</th>
                    <th className="px-3 py-2">Outstanding</th>
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
                        {r.daysPastDue}
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
                  href={`/dashboard/reports?workspaceId=${workspaceId}&kind=${k}`}
                  className="rounded-lg border bg-white px-3 py-2 text-sm capitalize hover:border-zinc-400"
                >
                  Export {k}
                </Link>
              ),
            )}
          </div>
        </div>
      )}
      {exportData?.csv && (
        <div className="mt-6 rounded-xl border bg-white p-4">
          <p className="text-sm font-medium">
            {exportData.kind} · {exportData.rowCount} baris
          </p>
          <textarea
            readOnly
            className="mt-2 h-64 w-full rounded border bg-zinc-50 p-2 font-mono text-xs"
            value={exportData.csv}
          />
          <p className="mt-2 text-xs text-zinc-500">
            Salin isi di atas atau simpan sebagai .csv
          </p>
        </div>
      )}
    </>
  );
}
