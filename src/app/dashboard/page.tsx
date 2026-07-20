import Link from 'next/link';
import { requireAuth } from '@/lib/auth';
import {
  getMe,
  getWorkspaceOverview,
  listWorkspaces,
  type WorkspaceOverview,
} from '@/lib/api';
import { EmptyState, PageHeader, WorkspaceChips } from '@/components/ui';

function formatIdr(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="tk-card p-4">
      <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-zinc-900">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ workspaceId?: string }>;
}) {
  await requireAuth();
  const { workspaceId: qWs } = await searchParams;

  let me: Awaited<ReturnType<typeof getMe>> | null = null;
  let workspaces: Awaited<ReturnType<typeof listWorkspaces>> = [];
  let overview: WorkspaceOverview | null = null;
  let error: string | null = null;
  let workspaceId = qWs ?? '';

  try {
    me = await getMe();
    workspaces = await listWorkspaces();
    if (!workspaceId && workspaces[0]) workspaceId = workspaces[0].id;
    if (workspaceId) overview = await getWorkspaceOverview(workspaceId);
  } catch (e) {
    error =
      e instanceof Error
        ? e.message
        : 'Gagal menghubungi API. Pastikan server API jalan.';
  }

  const current = workspaces.find((w) => w.id === workspaceId);

  return (
    <>
      <PageHeader
        title="Overview"
        description={
          <>
            {me?.email ?? me?.externalUserId}
            {current ? ` · ${current.name}` : ''}
          </>
        }
        actions={
          <Link href="/onboarding" className="tk-btn">
            + Workspace
          </Link>
        }
      />

      {workspaces.length > 0 && (
        <WorkspaceChips
          workspaces={workspaces}
          workspaceId={workspaceId}
          hrefFor={(id) => `/dashboard?workspaceId=${id}`}
          className="mt-4"
        />
      )}

      {error && (
        <div className="tk-alert mt-4" data-variant="warning">
          {error}
        </div>
      )}

      {!workspaceId && !error && (
        <EmptyState
          className="mt-6"
          title="Belum ada workspace"
          body="Buat workspace untuk mulai mengelola kos."
          action={
            <Link href="/onboarding" className="tk-btn !text-sm">
              Buat workspace
            </Link>
          }
        />
      )}

      {overview && (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Properti" value={overview.properties} />
            <Stat
              label="Kamar"
              value={overview.rooms}
              hint={`${overview.occupiedRooms} terisi · ${overview.availableRooms} kosong`}
            />
            <Stat label="Okupansi" value={`${overview.occupancyRate}%`} />
            <Stat label="Kontrak aktif" value={overview.activeLeases} />
            <Stat
              label="Tunggakan"
              value={formatIdr(overview.outstanding)}
              hint={`${overview.openInvoiceCount} invoice terbuka`}
            />
            <Stat label="Overdue" value={overview.overdueInvoices} />
            <Stat label="Bayar pending" value={overview.pendingPayments} />
            <Stat
              label="Biaya terbayar"
              value={formatIdr(overview.expensesPaid)}
            />
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="tk-card p-5">
              <h2 className="text-base font-semibold text-zinc-900">Modul</h2>
              <p className="mt-1 text-sm text-zinc-500">Akses cepat operasional</p>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {[
                  ['Properti', '/dashboard/properties'],
                  ['Kamar', '/dashboard/rooms'],
                  ['Penyewa', '/dashboard/tenants'],
                  ['Kontrak', '/dashboard/leases'],
                  ['Tagihan', '/dashboard/billing'],
                  ['Pembayaran', '/dashboard/payments'],
                  ['Pengeluaran', '/dashboard/expenses'],
                  ['Listrik', '/dashboard/utilities'],
                  ['Deposit', '/dashboard/deposits'],
                  ['AI', '/dashboard/ai'],
                  ['Insights', '/dashboard/insights'],
                  ['Import', '/dashboard/import'],
                ].map(([label, href]) => (
                  <Link
                    key={href}
                    href={`${href}?workspaceId=${workspaceId}`}
                    className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-medium text-zinc-800 transition hover:border-emerald-300 hover:bg-emerald-50"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="tk-card p-5">
              <h2 className="text-base font-semibold text-zinc-900">
                Human-in-the-loop
              </h2>
              <p className="mt-1 text-sm text-zinc-500">AI & kontrol manual</p>
              <ul className="mt-4 list-disc space-y-1.5 pl-4 text-sm text-zinc-600">
                <li>OCR / triage / draft hanya saran. Approve manual.</li>
                <li>Pembayaran dan deposit tidak auto-approve.</li>
                <li>⌘K buka command palette.</li>
              </ul>
            </div>
          </div>
        </>
      )}
    </>
  );
}
