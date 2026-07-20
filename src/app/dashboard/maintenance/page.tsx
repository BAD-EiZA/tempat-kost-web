import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { apiFetch, listProperties, listRooms, listWorkspaces } from '@/lib/api';
import {
  EmptyState,
  PageHeader,
  StatusBadge,
  WorkspaceChips,
} from '@/components/ui';

type Maint = {
  id: string;
  title: string;
  status: string;
  urgency: string;
  assignedTo: string | null;
  createdAt: string;
  estimatedCost?: string | number | null;
  estimateLow?: string | number | null;
  estimateHigh?: string | number | null;
  aiJson?: {
    triage?: { category?: string; urgency?: string; hazards?: string[] };
    estimate?: { lowAmount?: number; highAmount?: number; durationHint?: string };
    damage?: { severitySuggestion?: string; observations?: string[] };
  } | null;
  photoUrls?: string[] | null;
  property?: { name: string };
  room?: { name: string } | null;
  tenant?: { fullName: string } | null;
};

type Member = {
  id: string;
  user?: { fullName: string | null; email: string | null };
};

const STATUS_LABEL: Record<string, string> = {
  NEW: 'Baru', TRIAGED: 'Sudah ditinjau', ASSIGNED: 'Ditugaskan',
  SCHEDULED: 'Dijadwalkan', IN_PROGRESS: 'Sedang dikerjakan',
  WAITING_MATERIAL: 'Menunggu material', RESOLVED: 'Selesai diperbaiki',
  CLOSED: 'Ditutup', REJECTED: 'Ditolak',
};

const URGENCY_LABEL: Record<string, string> = {
  low: 'Rendah', medium: 'Sedang', high: 'Tinggi', critical: 'Kritis',
  LOW: 'Rendah', MEDIUM: 'Sedang', HIGH: 'Tinggi', CRITICAL: 'Kritis',
};

function slaLabel(createdAt: string, status: string) {
  if (status === 'RESOLVED' || status === 'CLOSED') return null;
  const hours = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60),
  );
  if (hours >= 72) return { text: `SLA ${hours}j`, cls: 'text-red-700' };
  if (hours >= 24) return { text: `SLA ${hours}j`, cls: 'text-amber-700' };
  return { text: `${hours}j`, cls: 'text-zinc-500' };
}

async function createAction(formData: FormData) {
  'use server';
  await requireAuth();
  const workspaceId = String(formData.get('workspaceId') ?? '');
  const propertyId = String(formData.get('propertyId') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  if (!workspaceId || !propertyId || !title || !description) return;
  await apiFetch('/v1/maintenance', {
    method: 'POST',
    body: JSON.stringify({
      workspaceId,
      propertyId,
      title,
      description,
      roomId: String(formData.get('roomId') ?? '') || undefined,
      urgency: String(formData.get('urgency') ?? 'medium') || 'medium',
      category: String(formData.get('category') ?? '') || undefined,
      photoUrls: String(formData.get('photoUrls') ?? '')
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean),
      runAi: formData.get('runAi') === 'on',
    }),
  });
  redirect(`/dashboard/maintenance?workspaceId=${workspaceId}`);
}

async function statusAction(formData: FormData) {
  'use server';
  await requireAuth();
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '');
  const workspaceId = String(formData.get('workspaceId') ?? '');
  const assignedTo = String(formData.get('assignedTo') ?? '') || undefined;
  if (!id || !status) return;
  await apiFetch(`/v1/maintenance/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, assignedTo }),
  });
  redirect(`/dashboard/maintenance?workspaceId=${workspaceId}`);
}

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ workspaceId?: string }>;
}) {
  await requireAuth();
  const { workspaceId: qWs } = await searchParams;
  let workspaces: Awaited<ReturnType<typeof listWorkspaces>> = [];
  let items: Maint[] = [];
  let properties: Awaited<ReturnType<typeof listProperties>> = [];
  let rooms: Awaited<ReturnType<typeof listRooms>> = [];
  let members: Member[] = [];
  let workspaceId = qWs ?? '';
  let error: string | null = null;

  try {
    workspaces = await listWorkspaces();
    if (!workspaceId && workspaces[0]) workspaceId = workspaces[0].id;
    if (workspaceId) {
      [items, properties, rooms, members] = await Promise.all([
        apiFetch<Maint[]>(
          `/v1/maintenance?workspaceId=${encodeURIComponent(workspaceId)}`,
        ),
        listProperties(workspaceId),
        listRooms(workspaceId),
        apiFetch<Member[]>(
          `/v1/team/members?workspaceId=${encodeURIComponent(workspaceId)}`,
        ),
      ]);
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Gagal memuat';
  }

  const open = items.filter(
    (m) => m.status !== 'CLOSED' && m.status !== 'RESOLVED',
  ).length;

  return (
    <>
      <PageHeader
        title="Pemeliharaan"
        description={`${open} tiket terbuka · SLA: 24j kuning, 72j merah`}
      />
      {workspaces.length > 0 && (
        <WorkspaceChips
          workspaces={workspaces}
          workspaceId={workspaceId}
          hrefFor={(id) => `/dashboard/maintenance?workspaceId=${id}`}
        />
      )}
      {error && (
        <div className="tk-alert mt-4" data-variant="warning">
          {error}
        </div>
      )}
      {items.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="Belum ada tiket"
          body="Buat laporan kerusakan dari form di bawah."
        />
      ) : (
      <ul aria-label="Daftar tiket pemeliharaan" className="mt-6 space-y-2">
          {items.map((m) => {
            const sla = slaLabel(m.createdAt, m.status);
            return (
              <li
                key={m.id}
                className="tk-card flex flex-col items-stretch gap-3 px-4 py-4 text-sm sm:px-5 lg:flex-row lg:items-start lg:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-zinc-900">{m.title}</p>
                    <StatusBadge status={m.status} kind="maintenance" />
                    <span className="text-xs text-zinc-500">
                      {URGENCY_LABEL[m.urgency] ?? m.urgency}
                    </span>
                    {sla && (
                      <span className={`text-xs font-medium ${sla.cls}`}>
                        {sla.text}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    {m.property?.name}
                    {m.room ? ` / ${m.room.name}` : ''}
                    {m.tenant ? ` · ${m.tenant.fullName}` : ''}
                    {m.assignedTo
                      ? ` · assign: ${
                          members.find((x) => x.id === m.assignedTo)?.user
                            ?.fullName ||
                          members.find((x) => x.id === m.assignedTo)?.user
                            ?.email ||
                          m.assignedTo.slice(0, 8)
                        }`
                      : ''}
                  </p>
                  {(m.estimateLow != null || m.estimatedCost != null) && (
                    <p className="mt-1 text-xs text-emerald-800">
                      Estimasi AI: Rp{' '}
                      {Number(m.estimateLow ?? m.estimatedCost ?? 0).toLocaleString(
                        'id-ID',
                      )}
                      {m.estimateHigh != null
                        ? ` - Rp ${Number(m.estimateHigh).toLocaleString('id-ID')}`
                        : ''}
                      {m.aiJson?.estimate?.durationHint
                        ? ` · ${m.aiJson.estimate.durationHint}`
                        : ''}
                    </p>
                  )}
                  {m.aiJson?.triage?.hazards &&
                    m.aiJson.triage.hazards.length > 0 && (
                      <p className="mt-0.5 text-[10px] text-red-700">
                         Bahaya: {m.aiJson.triage.hazards.join(', ')}
                      </p>
                    )}
                  {m.aiJson?.damage?.severitySuggestion && (
                    <p className="text-[10px] text-zinc-500">
                       Kerusakan: {m.aiJson.damage.severitySuggestion}
                      {m.aiJson.damage.observations?.[0]
                        ? ` - ${m.aiJson.damage.observations[0]}`
                        : ''}
                    </p>
                  )}
                </div>
                {m.status !== 'CLOSED' && m.status !== 'RESOLVED' && (
                  <div className="flex flex-wrap items-center gap-1">
                     <form action={statusAction} className="grid w-full gap-2 sm:grid-cols-[1fr_1fr_auto]">
                      <input type="hidden" name="id" value={m.id} />
                      <input
                        type="hidden"
                        name="workspaceId"
                        value={workspaceId}
                      />
                       <select
                         aria-label={`Petugas untuk ${m.title}`}
                        name="assignedTo"
                        defaultValue={m.assignedTo ?? ''}
                         className="tk-input !px-2 !py-2 !text-xs"
                      >
                         <option value="">Belum ditugaskan</option>
                        {members.map((mem) => (
                          <option key={mem.id} value={mem.id}>
                            {mem.user?.fullName ||
                              mem.user?.email ||
                              mem.id.slice(0, 8)}
                          </option>
                        ))}
                      </select>
                       <select
                         aria-label={`Status ${m.title}`}
                        name="status"
                        defaultValue={
                          m.status === 'NEW' ? 'ASSIGNED' : m.status
                        }
                         className="tk-input !px-2 !py-2 !text-xs"
                      >
                         {Object.entries(STATUS_LABEL).filter(([value]) => value !== 'NEW').map(([value, label]) => (
                           <option key={value} value={value}>{label}</option>
                         ))}
                      </select>
                      <button
                        type="submit"
                        className="tk-btn-sm"
                      >
                         Perbarui
                      </button>
                    </form>
                  </div>
                )}
              </li>
            );
          })}
      </ul>
      )}

      {workspaceId && properties.length > 0 && (
        <form
          action={createAction}
          className="tk-card mt-8 p-6"
        >
          <h2 className="text-base font-semibold text-zinc-900">Buat tiket</h2>
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span>Properti</span>
              <select
                name="propertyId"
                required
                className="tk-input"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span>Kamar (opsional)</span>
              <select
                name="roomId"
                className="tk-input"
              >
                <option value="">-</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.property?.name ? `${r.property.name} / ` : ''}
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
               <span>Urgensi</span>
              <select
                name="urgency"
                defaultValue="medium"
                className="tk-input"
              >
                 <option value="low">Rendah</option>
                 <option value="medium">Sedang</option>
                 <option value="high">Tinggi</option>
                 <option value="critical">Kritis</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span>Kategori</span>
              <input
                name="category"
                placeholder="listrik / air / AC"
                className="tk-input"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span>Judul</span>
              <input
                name="title"
                required
                className="tk-input"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span>Deskripsi</span>
              <textarea
                name="description"
                required
                rows={3}
                className="tk-input"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span>Foto URL (koma/baris) - upload Cloudinary di Files dulu</span>
              <textarea
                name="photoUrls"
                rows={2}
                placeholder="https://…/foto.jpg"
                className="tk-input"
              />
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" name="runAi" defaultChecked /> AI triage +
              damage + estimasi biaya
            </label>
          </div>
          <button
            type="submit"
            className="tk-btn mt-4"
          >
            Simpan
          </button>
        </form>
      )}
    </>
  );
}
