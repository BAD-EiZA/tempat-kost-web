import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { apiFetch, listProperties, listWorkspaces } from '@/lib/api';
import {
  EmptyState,
  PageHeader,
  StatusBadge,
  WorkspaceChips,
} from '@/components/ui';

const STAGES = [
  'NEW',
  'CONTACTED',
  'SURVEY_SCHEDULED',
  'SURVEY_COMPLETED',
  'NEGOTIATION',
  'RESERVED',
  'CONVERTED',
  'LOST',
] as const;

const STAGE_LABEL: Record<string, string> = {
  NEW: 'Baru',
  CONTACTED: 'Dihubungi',
  SURVEY_SCHEDULED: 'Survey dijadwalkan',
  SURVEY_COMPLETED: 'Survey selesai',
  NEGOTIATION: 'Negosiasi',
  RESERVED: 'Reserved',
  CONVERTED: 'Converted',
  LOST: 'Lost',
};

type Prospect = {
  id: string;
  fullName: string;
  phone: string | null;
  status: string;
  lostReason?: string | null;
  property?: { name: string } | null;
};

async function createProspect(formData: FormData) {
  'use server';
  await requireAuth();
  const workspaceId = String(formData.get('workspaceId') ?? '');
  const fullName = String(formData.get('fullName') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim() || undefined;
  const propertyId = String(formData.get('propertyId') ?? '') || undefined;
  if (!workspaceId || !fullName) return;
  await apiFetch('/v1/crm/prospects', {
    method: 'POST',
    body: JSON.stringify({ workspaceId, fullName, phone, propertyId }),
  });
  redirect(`/dashboard/crm?workspaceId=${workspaceId}`);
}

async function statusAction(formData: FormData) {
  'use server';
  await requireAuth();
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '');
  const workspaceId = String(formData.get('workspaceId') ?? '');
  const lostReason = String(formData.get('lostReason') ?? '') || undefined;
  if (!id || !status) return;
  await apiFetch(`/v1/crm/prospects/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, lostReason }),
  });
  redirect(`/dashboard/crm?workspaceId=${workspaceId}`);
}

async function convertAction(formData: FormData) {
  'use server';
  await requireAuth();
  const id = String(formData.get('id') ?? '');
  const workspaceId = String(formData.get('workspaceId') ?? '');
  if (!id) return;
  await apiFetch(`/v1/crm/prospects/${id}/convert`, { method: 'POST' });
  redirect(`/dashboard/crm?workspaceId=${workspaceId}`);
}

export default async function CrmPage({
  searchParams,
}: {
  searchParams: Promise<{ workspaceId?: string; view?: string }>;
}) {
  await requireAuth();
  const sp = await searchParams;
  let workspaces: Awaited<ReturnType<typeof listWorkspaces>> = [];
  let prospects: Prospect[] = [];
  let properties: Awaited<ReturnType<typeof listProperties>> = [];
  let workspaceId = sp.workspaceId ?? '';
  let error: string | null = null;
  let funnel: {
    byStatus?: Record<string, number>;
    lostReasons?: Array<{ reason: string; count: number }>;
    total?: number;
  } | null = null;
  const view = sp.view === 'list' ? 'list' : 'kanban';

  try {
    workspaces = await listWorkspaces();
    if (!workspaceId && workspaces[0]) workspaceId = workspaces[0].id;
    if (workspaceId) {
      [prospects, properties, funnel] = await Promise.all([
        apiFetch<Prospect[]>(
          `/v1/crm/prospects?workspaceId=${workspaceId}`,
        ),
        listProperties(workspaceId),
        apiFetch<{
          byStatus?: Record<string, number>;
          lostReasons?: Array<{ reason: string; count: number }>;
          total?: number;
        }>(`/v1/crm/funnel?workspaceId=${workspaceId}`),
      ]);
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Gagal memuat CRM';
  }

  const byStatus = Object.fromEntries(
    STAGES.map((s) => [s, prospects.filter((p) => p.status === s)]),
  ) as Record<string, Prospect[]>;

  function ProspectCard({ p }: { p: Prospect }) {
    return (
      <div className="tk-card p-3 text-sm shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-zinc-900">{p.fullName}</p>
          <StatusBadge status={p.status} kind="prospect" />
        </div>
        <p className="mt-1 text-[11px] text-zinc-500">
          {p.phone ?? 'Tanpa telepon'}
          {p.property?.name ? ` · ${p.property.name}` : ''}
        </p>
        {p.phone ? (
          <a
            href={`https://wa.me/${p.phone.replace(/\D/g, '').replace(/^0/, '62')}`}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-block text-[11px] font-medium text-emerald-800 underline-offset-2 hover:underline"
          >
            Chat WhatsApp
          </a>
        ) : null}
        {p.lostReason ? (
          <p className="mt-1 text-[11px] text-zinc-400">Lost: {p.lostReason}</p>
        ) : null}
        <div className="mt-2 flex flex-wrap gap-1 border-t border-zinc-100 pt-2">
          <form action={statusAction} className="flex flex-wrap gap-1">
            <input type="hidden" name="id" value={p.id} />
            <input type="hidden" name="workspaceId" value={workspaceId} />
            <select
              name="status"
              defaultValue={p.status}
              className="tk-input !px-1.5 !py-0.5 !text-[10px]"
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABEL[s] ?? s}
                </option>
              ))}
            </select>
            <input
              name="lostReason"
              placeholder="Alasan lost"
              className="tk-input w-24 !px-1.5 !py-0.5 !text-[10px]"
            />
            <button type="submit" className="tk-btn-secondary !px-1.5 !py-0.5 !text-[10px]">
              Set
            </button>
          </form>
          {p.status !== 'CONVERTED' && p.status !== 'LOST' && (
            <form action={convertAction}>
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="workspaceId" value={workspaceId} />
              <button type="submit" className="tk-btn-sm !text-[10px]">
                Convert
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Prospect CRM"
        description="Pipeline calon penyewa dari lead sampai convert."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/dashboard/crm?workspaceId=${workspaceId}&view=kanban`}
              className={view === 'kanban' ? 'tk-chip tk-chip-active' : 'tk-chip'}
            >
              Kanban
            </Link>
            <Link
              href={`/dashboard/crm?workspaceId=${workspaceId}&view=list`}
              className={view === 'list' ? 'tk-chip tk-chip-active' : 'tk-chip'}
            >
              List
            </Link>
            <Link
              href={`/dashboard/surveys?workspaceId=${workspaceId}`}
              className="text-sm font-medium text-emerald-800 underline-offset-2 hover:underline"
            >
              Survey
            </Link>
            <Link
              href={`/dashboard/crm/bookings?workspaceId=${workspaceId}`}
              className="text-sm font-medium text-emerald-800 underline-offset-2 hover:underline"
            >
              Booking
            </Link>
          </div>
        }
      />
      {workspaces.length > 0 && (
        <WorkspaceChips
          workspaces={workspaces}
          workspaceId={workspaceId}
          hrefFor={(id) => `/dashboard/crm?workspaceId=${id}&view=${view}`}
        />
      )}
      {error && (
        <div className="tk-alert mt-4" data-variant="warning">
          {error}
        </div>
      )}
      {funnel && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="tk-card p-3">
            <p className="text-xs text-zinc-500">Total prospect</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {funnel.total ?? prospects.length}
            </p>
          </div>
          {Object.entries(funnel.byStatus ?? {})
            .slice(0, 3)
            .map(([k, v]) => (
              <div key={k} className="tk-card p-3">
                <p className="text-xs text-zinc-500">{STAGE_LABEL[k] ?? k}</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">{v}</p>
              </div>
            ))}
        </div>
      )}

      {view === 'kanban' ? (
        prospects.length === 0 ? (
          <EmptyState
            className="mt-6"
            title="Belum ada prospect"
            body="Tambah lead di form bawah untuk mengisi pipeline."
          />
        ) : (
          <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
            {STAGES.filter((s) => s !== 'CONVERTED' && s !== 'LOST').map(
              (stage) => (
                <div
                  key={stage}
                  className="w-60 shrink-0 rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm"
                >
                  <p className="mb-2 px-1 text-xs font-semibold text-zinc-700">
                    {STAGE_LABEL[stage]}{' '}
                    <span className="font-normal text-zinc-400">
                      ({byStatus[stage]?.length ?? 0})
                    </span>
                  </p>
                  <div className="space-y-2">
                    {(byStatus[stage] ?? []).length === 0 ? (
                      <p className="px-1 py-4 text-center text-[11px] text-zinc-400">
                        Kosong
                      </p>
                    ) : (
                      (byStatus[stage] ?? []).map((p) => (
                        <ProspectCard key={p.id} p={p} />
                      ))
                    )}
                  </div>
                </div>
              ),
            )}
            {(['CONVERTED', 'LOST'] as const).map((stage) =>
              (byStatus[stage]?.length ?? 0) > 0 ? (
                <div
                  key={stage}
                  className="w-60 shrink-0 rounded-2xl border border-zinc-200 bg-zinc-50 p-2"
                >
                  <p className="mb-2 px-1 text-xs font-semibold text-zinc-600">
                    {STAGE_LABEL[stage]} ({byStatus[stage].length})
                  </p>
                  <div className="space-y-2">
                    {byStatus[stage].map((p) => (
                      <ProspectCard key={p.id} p={p} />
                    ))}
                  </div>
                </div>
              ) : null,
            )}
          </div>
        )
      ) : prospects.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="Belum ada prospect"
          body="Tambah lead di form bawah."
        />
      ) : (
        <ul className="mt-6 space-y-2">
          {prospects.map((p) => (
            <li key={p.id}>
              <ProspectCard p={p} />
            </li>
          ))}
        </ul>
      )}

      {workspaceId && (
        <form action={createProspect} className="tk-card mt-8 p-6">
          <h2 className="text-base font-semibold text-zinc-900">
            Tambah prospect
          </h2>
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="tk-field">
              <span className="tk-label">Nama</span>
              <input name="fullName" required className="tk-input" />
            </label>
            <label className="tk-field">
              <span className="tk-label">WhatsApp</span>
              <input name="phone" type="tel" className="tk-input" />
            </label>
            <label className="tk-field sm:col-span-2">
              <span className="tk-label">Properti (opsional)</span>
              <select name="propertyId" className="tk-select">
                <option value="">Tanpa properti</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button type="submit" className="tk-btn mt-4">
            Simpan
          </button>
        </form>
      )}
    </>
  );
}
