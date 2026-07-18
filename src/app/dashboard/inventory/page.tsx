import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { apiFetch, listProperties, listRooms, listWorkspaces } from '@/lib/api';

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
      <h1 className="text-2xl font-semibold">Inventaris</h1>
      {workspaces.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/dashboard/inventory?workspaceId=${ws.id}`}
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
      <ul className="mt-6 divide-y rounded-xl border bg-white">
        {items.length === 0 ? (
          <li className="p-6 text-sm text-zinc-500">Belum ada item.</li>
        ) : (
          items.map((i) => (
            <li
              key={i.id}
              className="flex flex-wrap items-center justify-between gap-2 px-6 py-3 text-sm"
            >
              <div>
                <span className="font-medium">{i.name}</span>
                {i.code ? (
                  <span className="ml-1 font-mono text-xs text-zinc-400">
                    {i.code}
                  </span>
                ) : null}
                <span className="text-xs text-zinc-500">
                  {' '}
                  · {i.category ?? '—'} · {i.condition} ·{' '}
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
                  className="rounded border px-1 py-0.5 text-[10px]"
                >
                  <option value="good">Baik</option>
                  <option value="fair">Cukup</option>
                  <option value="poor">Rusak</option>
                </select>
                <select
                  name="roomId"
                  className="max-w-[8rem] rounded border px-1 py-0.5 text-[10px]"
                >
                  <option value="">— kamar —</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="rounded border px-1.5 py-0.5 text-[10px]"
                >
                  Update
                </button>
              </form>
            </li>
          ))
        )}
      </ul>
      {workspaceId && (
        <form action={createAction} className="mt-8 rounded-xl border bg-white p-6">
          <h2 className="font-medium">Tambah item</h2>
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              name="name"
              required
              placeholder="Nama aset"
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <input
              name="code"
              placeholder="Kode (opsional)"
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <input
              name="category"
              placeholder="Kategori"
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <select name="condition" className="rounded-lg border px-3 py-2 text-sm">
              <option value="good">Baik</option>
              <option value="fair">Cukup</option>
              <option value="poor">Rusak</option>
            </select>
            <select name="propertyId" className="rounded-lg border px-3 py-2 text-sm">
              <option value="">— Umum —</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select name="roomId" className="rounded-lg border px-3 py-2 text-sm">
              <option value="">— Tanpa kamar —</option>
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
            className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white"
          >
            Simpan
          </button>
        </form>
      )}
    </>
  );
}
