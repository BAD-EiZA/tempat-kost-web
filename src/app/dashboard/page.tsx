import Link from 'next/link';
import { requireAuth } from '@/lib/auth';
import {
  getMe,
  getWorkspaceOverview,
  listWorkspaces,
  type WorkspaceOverview,
} from '@/lib/api';
import { AceCard, CardSpotlight, GlowingEffect } from '@/components/ui';

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
    <CardSpotlight className="p-4" radius={200} color="#6366f1">
      <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
    </CardSpotlight>
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-zinc-600">
            {me?.email ?? me?.externalUserId}
            {current ? ` · ${current.name}` : ''}
          </p>
        </div>
        <Link
          href="/onboarding"
          className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-lg shadow-zinc-900/10 transition hover:bg-zinc-800"
        >
          + Workspace
        </Link>
      </div>

      {workspaces.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/dashboard?workspaceId=${ws.id}`}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                ws.id === workspaceId
                  ? 'bg-zinc-900 text-white shadow-md'
                  : 'border border-zinc-200/80 bg-white/80 text-zinc-700 hover:border-indigo-200'
              }`}
            >
              {ws.name}
            </Link>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {error}
        </div>
      )}

      {!workspaceId && !error && (
        <p className="mt-6 text-sm text-zinc-600">
          Belum ada workspace.{' '}
          <Link href="/onboarding" className="underline">
            Buat dulu
          </Link>
        </p>
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
            <GlowingEffect>
              <AceCard
                title="Modul"
                description="Akses cepat operasional"
                className="border-0 shadow-none"
              >
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
                      className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs font-medium text-zinc-800 transition hover:border-indigo-300 hover:bg-indigo-50"
                    >
                      {label} →
                    </Link>
                  ))}
                </div>
              </AceCard>
            </GlowingEffect>
            <AceCard
              title="Human-in-the-loop"
              description="AI & design system"
              className="bg-gradient-to-br from-white to-indigo-50/40"
            >
              <ul className="list-disc space-y-1.5 pl-4 text-sm text-zinc-600">
                <li>OCR / triage / draft hanya saran — approve manual.</li>
                <li>Landing pakai kit Aceternity penuh.</li>
                <li>⌘K buka command palette.</li>
              </ul>
            </AceCard>
          </div>
        </>
      )}
    </>
  );
}
