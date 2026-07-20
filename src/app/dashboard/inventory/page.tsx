import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { apiFetch, listProperties, listRooms, listWorkspaces } from '@/lib/api';
import {
  EmptyState,
  PageHeader,
  WorkspaceChips,
} from '@/components/ui';

async function createAction(formData: FormData) {
  'use server';
  await requireAuth();
  const workspaceId = String(formData.get('workspaceId') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  if (!workspaceId || !name) return;
  await apiFetch('/v1/inventory', {
    method: 'POST',
    body: JSON.stringify({
      workspaceId,
      name,
      propertyId: String(formData.get('propertyId') ?? '') || undefined,
      roomId: String(formData.get('roomId') ?? '') || undefined,
      category: String(formData.get('category') ?? '') || undefined,
      condition: String(formData.get('condition') ?? 'good') || 'good',
      code: String(formData.get('code') ?? '') || undefined,
    }),
  });
  redirect(`/dashboard/inventory?workspaceId=${workspaceId}`);
}

async function updateAction(formData: FormData) {
  'use server';
  await requireAuth();
  const id = String(formData.get('id') ?? '');
  const workspaceId = String(formData.get('workspaceId') ?? '');
  if (!id) return;
  await apiFetch(`/v1/inventory/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      condition: String(formData.get('condition') ?? '') || undefined,
      roomId: String(formData.get('roomId') ?? '') || null,
      status: String(formData.get('status') ?? '') || undefined,
    }),
  });
  redirect(`/dashboard/inventory?workspaceId=${workspaceId}`);
}

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ workspaceId?: string }>;
}) {
  await requireAuth();
  const { workspaceId: qWs } = await searchParams;
  let workspaces: Awaited<ReturnType<typeof listWorkspaces>> = [];
  let properties: Awaited<ReturnType<typeof listProperties>> = [];
  let rooms: Awaited<ReturnType<typeof listRooms>> = [];
  let items: Array<{
    id: string;
    name: string;
    code: string | null;
    category: string | null;
    condition: string;
    property?: { name: string } | null;
    room?: { name: string } | null;
  }> = [];
  let workspaceId = qWs ?? '';
  let error: string | null = null;

  try {
    workspaces = await listWorkspaces();
    if (!workspaceId && workspaces[0]) workspaceId = workspaces[0].id;
    if (workspaceId) {
      [items, properties, rooms] = await Promise.all([
        apiFetch<typeof items>(`/v1/inventory?workspaceId=${workspaceId}`),
        listProperties(workspaceId),
        listRooms(workspaceId),
      ]);
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Gagal';
  }

  return (
    <>
      <PageHeader
        title="Inventaris"
        description="Aset kamar dan properti, kondisi, penempatan."
      />
      {workspaces.length > 0 && (
        <WorkspaceChips
          workspaces={workspaces}
          workspaceId={workspaceId}
          hrefFor={(id) => `/dashboard/inventory?workspaceId=${id}`}
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
          title="Belum ada item"
          body="Tambah inventaris dari form di bawah."
        />
      ) : (
      <ul className="mt-6 space-y-2">
          {items.map((i) => (
            <li
              key={i.id}
              className="tk-card flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm"
            >
              <div>
                <span className="font-semibold text-zinc-900">{i.name}</span>
                {i.code ? (
                  <span className="ml-1 font-mono text-xs text-zinc-400">
                    {i.code}
                  </span>
                ) : null}
                <span className="text-xs text-zinc-500">
                  {' '}
                  · {i.category ?? 'Umum'} · {i.condition} ·{' '}
                  {i.property?.name ?? 'umum'}
                  {i.room ? ` / ${i.room.name}` : ''}
                </span>
              </div>
              <form action={updateAction} className="flex gap-1">
                <input type="hidden" name="id" value={i.id} />
                <input type="hidden" name="workspaceId" value={workspaceId} />
                <select
                  name="condition"
                  defaultValue={i.condition}
                  className="tk-input !px-1 !py-0.5 !text-[10px]"
                >
                  <option value="good">Baik</option>
                  <option value="fair">Cukup</option>
                  <option value="poor">Rusak</option>
                </select>
                <select
                  name="roomId"
                  className="tk-input max-w-[8rem] !px-1 !py-0.5 !text-[10px]"
                >
                  <option value="">Tanpa kamar</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="tk-btn-secondary !px-1.5 !py-0.5 !text-[10px]"
                >
                  Update
                </button>
              </form>
            </li>
          ))}
      </ul>
      )}
      {workspaceId && (
        <form action={createAction} className="tk-card mt-8 p-6">
          <h2 className="font-medium">Tambah item</h2>
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              name="name"
              required
              placeholder="Nama aset"
              className="tk-input"
            />
            <input
              name="code"
              placeholder="Kode (opsional)"
              className="tk-input"
            />
            <input
              name="category"
              placeholder="Kategori"
              className="tk-input"
            />
            <select name="condition" className="tk-input">
              <option value="good">Baik</option>
              <option value="fair">Cukup</option>
              <option value="poor">Rusak</option>
            </select>
            <select name="propertyId" className="tk-input">
              <option value="">Umum</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select name="roomId" className="tk-input">
              <option value="">Tanpa kamar</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.property?.name ? `${r.property.name} / ` : ''}
                  {r.name}
                </option>
              ))}
            </select>
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
