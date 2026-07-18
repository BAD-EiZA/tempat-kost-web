import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { apiFetch, listProperties, listWorkspaces } from '@/lib/api';

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
      <div className="rounded-lg border bg-white p-3 text-sm shadow-sm">
        <p className="font-medium">{p.fullName}</p>
        <p className="text-[11px] text-zinc-500">
          {p.phone ?? '—'} · {p.property?.name ?? '—'}
          {p.phone ? (
            <>
              {' '}
              ·{' '}
              <a
                href={`https://wa.me/${p.phone.replace(/\D/g, '').replace(/^0/, '62')}`}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-700 underline"
              >
                WA
              </a>
            </>
          ) : null}
          {p.lostReason ? ` · lost: ${p.lostReason}` : ''}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          <form action={statusAction} className="flex flex-wrap gap-1">
            <input type="hidden" name="id" value={p.id} />
            <input type="hidden" name="workspaceId" value={workspaceId} />
            <select
              name="status"
              defaultValue={p.status}
              className="rounded border px-1 py-0.5 text-[10px]"
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABEL[s] ?? s}
                </option>
              ))}
            </select>
            <input
              name="lostReason"
              placeholder="Lost reason"
              className="w-24 rounded border px-1 py-0.5 text-[10px]"
            />
            <button
              type="submit"
              className="rounded border px-1.5 py-0.5 text-[10px]"
            >
              Set
            </button>
          </form>
          {p.status !== 'CONVERTED' && p.status !== 'LOST' && (
            <form action={convertAction}>
              <input type="hidden" name="id" value={p.id} />
              <input type="hidden" name="workspaceId" value={workspaceId} />
              <button
                type="submit"
                className="rounded bg-emerald-700 px-1.5 py-0.5 text-[10px] text-white"
              >
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Prospect CRM</h1>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link
            href={`/dashboard/crm?workspaceId=${workspaceId}&view=kanban`}
            className={view === 'kanban' ? 'font-medium underline' : 'underline'}
          >
            Kanban
          </Link>
          <Link
            href={`/dashboard/crm?workspaceId=${workspaceId}&view=list`}
            className={view === 'list' ? 'font-medium underline' : 'underline'}
          >
            List
          </Link>
          <Link
            href={`/dashboard/surveys?workspaceId=${workspaceId}`}
            className="underline"
          >
            Survey
          </Link>
          <Link
            href={`/dashboard/crm/bookings?workspaceId=${workspaceId}`}
            className="underline"
          >
            Booking
          </Link>
        </div>
      </div>
      {workspaces.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/dashboard/crm?workspaceId=${ws.id}&view=${view}`}
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
      {funnel && (
        <div className="mt-4 rounded-xl border bg-white p-3 text-xs">
          <p className="font-medium">Funnel · {funnel.total ?? 0} total</p>
          <p className="mt-1 text-zinc-600">
            {Object.entries(funnel.byStatus ?? {})
              .map(([k, v]) => `${STAGE_LABEL[k] ?? k}: ${v}`)
              .join(' · ')}
          </p>
          {(funnel.lostReasons?.length ?? 0) > 0 && (
            <p className="mt-1 text-zinc-500">
              Lost:{' '}
              {funnel.lostReasons!
                .map((r) => `${r.reason}(${r.count})`)
                .join(', ')}
            </p>
          )}
        </div>
      )}

      {view === 'kanban' ? (
        <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
          {STAGES.filter((s) => s !== 'CONVERTED' && s !== 'LOST').map(
            (stage) => (
              <div
                key={stage}
                className="w-56 shrink-0 rounded-xl border border-zinc-200 bg-zinc-50 p-2"
              >
                <p className="mb-2 px-1 text-xs font-semibold text-zinc-600">
                  {STAGE_LABEL[stage]}{' '}
                  <span className="font-normal text-zinc-400">
                    ({byStatus[stage]?.length ?? 0})
                  </span>
                </p>
                <div className="space-y-2">
                  {(byStatus[stage] ?? []).map((p) => (
                    <ProspectCard key={p.id} p={p} />
                  ))}
                </div>
              </div>
            ),
          )}
          {(['CONVERTED', 'LOST'] as const).map((stage) =>
            (byStatus[stage]?.length ?? 0) > 0 ? (
              <div
                key={stage}
                className="w-56 shrink-0 rounded-xl border border-zinc-200 bg-zinc-50 p-2"
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
      ) : (
        <ul className="mt-6 divide-y rounded-xl border bg-white">
          {prospects.length === 0 ? (
            <li className="p-6 text-sm text-zinc-500">Belum ada prospect.</li>
          ) : (
            prospects.map((p) => (
              <li key={p.id} className="px-4 py-3">
                <ProspectCard p={p} />
              </li>
            ))
          )}
        </ul>
      )}

      {workspaceId && (
        <form action={createProspect} className="mt-8 rounded-xl border bg-white p-6">
          <h2 className="font-medium">Tambah prospect</h2>
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              name="fullName"
              required
              placeholder="Nama"
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <input
              name="phone"
              placeholder="WhatsApp"
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <select
              name="propertyId"
              className="rounded-lg border px-3 py-2 text-sm sm:col-span-2"
            >
              <option value="">— Properti —</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white"
          >
            Simpan
          </button>
        </form>
      )}
    </>
  );
}
