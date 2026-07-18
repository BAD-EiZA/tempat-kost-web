import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import {
  apiFetch,
  bulkCreateRooms,
  createRoom,
  listProperties,
  listRooms,
  listWorkspaces,
  updateRoom,
} from '@/lib/api';

function formatIdr(n: string | number) {
  const v = typeof n === 'string' ? Number(n) : n;
  if (Number.isNaN(v)) return String(n);
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(v);
}

async function createRoomAction(formData: FormData) {
  'use server';
  await requireAuth();
  const workspaceId = String(formData.get('workspaceId') ?? '');
  const propertyId = String(formData.get('propertyId') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  const rentAmount = Number(formData.get('rentAmount') ?? 0);
  if (!workspaceId || !propertyId || !name) return;
  await createRoom({
    workspaceId,
    propertyId,
    name,
    rentAmount: Number.isFinite(rentAmount) ? rentAmount : 0,
    buildingId: String(formData.get('buildingId') ?? '') || undefined,
    floorId: String(formData.get('floorId') ?? '') || undefined,
    roomTypeId: String(formData.get('roomTypeId') ?? '') || undefined,
  });
  redirect(
    `/dashboard/rooms?workspaceId=${workspaceId}&propertyId=${propertyId}`,
  );
}

async function assignRoomAction(formData: FormData) {
  'use server';
  await requireAuth();
  const id = String(formData.get('id') ?? '');
  const workspaceId = String(formData.get('workspaceId') ?? '');
  const propertyId = String(formData.get('propertyId') ?? '');
  if (!id) return;
  await updateRoom(id, {
    buildingId: String(formData.get('buildingId') ?? '') || null,
    floorId: String(formData.get('floorId') ?? '') || null,
    roomTypeId: String(formData.get('roomTypeId') ?? '') || null,
  });
  redirect(
    `/dashboard/rooms?workspaceId=${workspaceId}&propertyId=${propertyId}`,
  );
}

async function bulkRoomAction(formData: FormData) {
  'use server';
  await requireAuth();
  const workspaceId = String(formData.get('workspaceId') ?? '');
  const propertyId = String(formData.get('propertyId') ?? '');
  const prefix = String(formData.get('prefix') ?? 'A').trim() || 'A';
  const startNumber = Number(formData.get('startNumber') ?? 1);
  const count = Number(formData.get('count') ?? 5);
  const rentAmount = Number(formData.get('rentAmount') ?? 0);
  if (!workspaceId || !propertyId) return;
  await bulkCreateRooms({
    workspaceId,
    propertyId,
    prefix,
    startNumber: Number.isFinite(startNumber) ? startNumber : 1,
    count: Math.min(Math.max(count || 1, 1), 100),
    rentAmount: Number.isFinite(rentAmount) ? rentAmount : 0,
  });
  redirect(
    `/dashboard/rooms?workspaceId=${workspaceId}&propertyId=${propertyId}`,
  );
}

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: Promise<{ workspaceId?: string; propertyId?: string }>;
}) {
  await requireAuth();
  const sp = await searchParams;

  let workspaces: Awaited<ReturnType<typeof listWorkspaces>> = [];
  let properties: Awaited<ReturnType<typeof listProperties>> = [];
  let rooms: Awaited<ReturnType<typeof listRooms>> = [];
  let buildings: Array<{
    id: string;
    name: string;
    floors: Array<{ id: string; name: string; level: number }>;
  }> = [];
  let roomTypes: Array<{ id: string; name: string }> = [];
  let error: string | null = null;
  let workspaceId = sp.workspaceId ?? '';
  let propertyId = sp.propertyId ?? '';

  try {
    workspaces = await listWorkspaces();
    if (!workspaceId && workspaces[0]) workspaceId = workspaces[0].id;
    if (workspaceId) {
      properties = await listProperties(workspaceId);
      if (!propertyId && properties[0]) propertyId = properties[0].id;
      rooms = await listRooms(workspaceId, propertyId || undefined);
      roomTypes = await apiFetch<typeof roomTypes>(
        `/v1/structure/room-types?workspaceId=${workspaceId}`,
      );
      if (propertyId) {
        buildings = await apiFetch<typeof buildings>(
          `/v1/structure/buildings?propertyId=${propertyId}`,
        );
      }
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Gagal memuat kamar';
  }

  const floors = buildings.flatMap((b) =>
    b.floors.map((f) => ({ ...f, buildingId: b.id, buildingName: b.name })),
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Kamar</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Status, harga, dan bulk create berurutan.
          </p>
        </div>
        <Link
          href={`/dashboard/properties?workspaceId=${workspaceId}`}
          className="text-sm underline"
        >
          ← Properti
        </Link>
      </div>

      {workspaces.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/dashboard/rooms?workspaceId=${ws.id}`}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                ws.id === workspaceId
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-700'
              }`}
            >
              {ws.name}
            </Link>
          ))}
        </div>
      )}

      {properties.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={`/dashboard/rooms?workspaceId=${workspaceId}`}
            className={`rounded-full px-3 py-1 text-xs ${
              !propertyId ? 'bg-zinc-800 text-white' : 'bg-zinc-50 text-zinc-600'
            }`}
          >
            Semua
          </Link>
          {properties.map((p) => (
            <Link
              key={p.id}
              href={`/dashboard/rooms?workspaceId=${workspaceId}&propertyId=${p.id}`}
              className={`rounded-full px-3 py-1 text-xs ${
                p.id === propertyId
                  ? 'bg-zinc-800 text-white'
                  : 'bg-zinc-50 text-zinc-600'
              }`}
            >
              {p.name}
            </Link>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {error}
        </div>
      )}

      <ul className="mt-6 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
        {rooms.length === 0 ? (
          <li className="p-6 text-sm text-zinc-600">Belum ada kamar.</li>
        ) : (
          rooms.map((r) => (
            <li key={r.id} className="px-6 py-3 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <span className="font-medium">{r.name}</span>
                  <span className="ml-2 text-xs text-zinc-500">{r.code}</span>
                  {r.property && (
                    <span className="ml-2 text-xs text-zinc-400">
                      · {r.property.name}
                    </span>
                  )}
                  <p className="text-[10px] text-zinc-400">
                    {r.building?.name ?? '—'} / {r.floor?.name ?? '—'} ·{' '}
                    {r.roomType?.name ?? 'tipe?'}
                  </p>
                </div>
                <div className="text-right text-xs text-zinc-600">
                  <div>{r.status}</div>
                  <div>{formatIdr(r.rentAmount)}</div>
                </div>
              </div>
              {propertyId && (
                <form
                  action={assignRoomAction}
                  className="mt-2 flex flex-wrap gap-1 border-t border-zinc-50 pt-2"
                >
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="workspaceId" value={workspaceId} />
                  <input type="hidden" name="propertyId" value={propertyId} />
                  <select
                    name="buildingId"
                    defaultValue={r.buildingId ?? ''}
                    className="rounded border px-1 py-0.5 text-[10px]"
                  >
                    <option value="">Gedung</option>
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <select
                    name="floorId"
                    defaultValue={r.floorId ?? ''}
                    className="rounded border px-1 py-0.5 text-[10px]"
                  >
                    <option value="">Lantai</option>
                    {floors.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.buildingName} / {f.name}
                      </option>
                    ))}
                  </select>
                  <select
                    name="roomTypeId"
                    defaultValue={r.roomType?.id ?? ''}
                    className="rounded border px-1 py-0.5 text-[10px]"
                  >
                    <option value="">Tipe</option>
                    {roomTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded bg-zinc-900 px-2 py-0.5 text-[10px] text-white"
                  >
                    Assign
                  </button>
                </form>
              )}
            </li>
          ))
        )}
      </ul>

      {workspaceId && propertyId && (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <form
            action={createRoomAction}
            className="rounded-xl border border-zinc-200 bg-white p-6"
          >
            <h2 className="font-medium">Tambah 1 kamar</h2>
            <input type="hidden" name="workspaceId" value={workspaceId} />
            <input type="hidden" name="propertyId" value={propertyId} />
            <label className="mt-4 flex flex-col gap-1 text-sm">
              <span>Nama/nomor</span>
              <input
                name="name"
                required
                placeholder="A01"
                className="rounded-lg border border-zinc-300 px-3 py-2"
              />
            </label>
            <label className="mt-3 flex flex-col gap-1 text-sm">
              <span>Harga sewa (IDR)</span>
              <input
                name="rentAmount"
                type="number"
                min={0}
                step={1000}
                defaultValue={0}
                className="rounded-lg border border-zinc-300 px-3 py-2"
              />
            </label>
            <label className="mt-3 flex flex-col gap-1 text-sm">
              <span>Gedung</span>
              <select name="buildingId" className="rounded-lg border px-3 py-2">
                <option value="">—</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 flex flex-col gap-1 text-sm">
              <span>Lantai</span>
              <select name="floorId" className="rounded-lg border px-3 py-2">
                <option value="">—</option>
                {floors.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.buildingName} / {f.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 flex flex-col gap-1 text-sm">
              <span>Tipe kamar</span>
              <select name="roomTypeId" className="rounded-lg border px-3 py-2">
                <option value="">—</option>
                {roomTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
            >
              Simpan
            </button>
          </form>

          <form
            action={bulkRoomAction}
            className="rounded-xl border border-zinc-200 bg-white p-6"
          >
            <h2 className="font-medium">Bulk berurutan</h2>
            <input type="hidden" name="workspaceId" value={workspaceId} />
            <input type="hidden" name="propertyId" value={propertyId} />
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <label className="flex flex-col gap-1">
                <span>Prefix</span>
                <input
                  name="prefix"
                  defaultValue="A"
                  className="rounded-lg border border-zinc-300 px-3 py-2"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span>Mulai</span>
                <input
                  name="startNumber"
                  type="number"
                  defaultValue={1}
                  min={1}
                  className="rounded-lg border border-zinc-300 px-3 py-2"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span>Jumlah</span>
                <input
                  name="count"
                  type="number"
                  defaultValue={5}
                  min={1}
                  max={100}
                  className="rounded-lg border border-zinc-300 px-3 py-2"
                />
              </label>
            </div>
            <label className="mt-3 flex flex-col gap-1 text-sm">
              <span>Harga sewa (IDR)</span>
              <input
                name="rentAmount"
                type="number"
                min={0}
                step={1000}
                defaultValue={0}
                className="rounded-lg border border-zinc-300 px-3 py-2"
              />
            </label>
            <button
              type="submit"
              className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
            >
              Buat bulk
            </button>
          </form>
        </div>
      )}

      {workspaceId && !propertyId && properties.length === 0 && (
        <p className="mt-6 text-sm text-zinc-600">
          Buat properti dulu di{' '}
          <Link
            href={`/dashboard/properties?workspaceId=${workspaceId}`}
            className="underline"
          >
            halaman properti
          </Link>
          .
        </p>
      )}
    </>
  );
}
