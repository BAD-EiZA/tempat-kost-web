import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { apiFetch, listProperties, listWorkspaces } from '@/lib/api';
import { WorkspaceChips, PageHeader } from '@/components/ui';

async function createBuilding(formData: FormData) {
  'use server';
  await requireAuth();
  const workspaceId = String(formData.get('workspaceId') ?? '');
  const propertyId = String(formData.get('propertyId') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  if (!propertyId || !name) return;
  await apiFetch('/v1/structure/buildings', {
    method: 'POST',
    body: JSON.stringify({ propertyId, name, code: String(formData.get('code') ?? '') || undefined }),
  });
  redirect(`/dashboard/structure?workspaceId=${workspaceId}&propertyId=${propertyId}`);
}

async function createFloor(formData: FormData) {
  'use server';
  await requireAuth();
  const workspaceId = String(formData.get('workspaceId') ?? '');
  const propertyId = String(formData.get('propertyId') ?? '');
  const buildingId = String(formData.get('buildingId') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  if (!buildingId || !name) return;
  await apiFetch('/v1/structure/floors', {
    method: 'POST',
    body: JSON.stringify({
      buildingId,
      name,
      level: Number(formData.get('level') ?? 1) || 1,
    }),
  });
  redirect(`/dashboard/structure?workspaceId=${workspaceId}&propertyId=${propertyId}`);
}

async function createRoomType(formData: FormData) {
  'use server';
  await requireAuth();
  const workspaceId = String(formData.get('workspaceId') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  if (!workspaceId || !name) return;
  await apiFetch('/v1/structure/room-types', {
    method: 'POST',
    body: JSON.stringify({
      workspaceId,
      propertyId: String(formData.get('propertyId') ?? '') || undefined,
      name,
      baseRent: Number(formData.get('baseRent') ?? 0) || 0,
      defaultDeposit: Number(formData.get('defaultDeposit') ?? 0) || 0,
      capacity: Number(formData.get('capacity') ?? 1) || 1,
    }),
  });
  redirect(`/dashboard/structure?workspaceId=${workspaceId}`);
}

export default async function StructurePage({
  searchParams,
}: {
  searchParams: Promise<{ workspaceId?: string; propertyId?: string }>;
}) {
  await requireAuth();
  const sp = await searchParams;
  let workspaces: Awaited<ReturnType<typeof listWorkspaces>> = [];
  let properties: Awaited<ReturnType<typeof listProperties>> = [];
  let workspaceId = sp.workspaceId ?? '';
  let propertyId = sp.propertyId ?? '';
  let buildings: Array<{
    id: string;
    name: string;
    floors: Array<{ id: string; name: string; level: number }>;
  }> = [];
  let roomTypes: Array<{
    id: string;
    name: string;
    baseRent: string | number;
    capacity: number;
  }> = [];
  let error: string | null = null;

  try {
    workspaces = await listWorkspaces();
    if (!workspaceId && workspaces[0]) workspaceId = workspaces[0].id;
    if (workspaceId) {
      properties = await listProperties(workspaceId);
      if (!propertyId && properties[0]) propertyId = properties[0].id;
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
    error = e instanceof Error ? e.message : 'Gagal';
  }

  return (
    <>
      <PageHeader
        title="Struktur & tipe kamar"
        description="Gedung, lantai, dan tipe kamar per properti."
      />
      {workspaces.length > 0 && (
        <WorkspaceChips
          workspaces={workspaces}
          workspaceId={workspaceId}
          hrefFor={(id) => `/dashboard/structure?workspaceId=${id}`}
        />
      )}
      {properties.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {properties.map((p) => (
            <Link
              key={p.id}
              href={`/dashboard/structure?workspaceId=${workspaceId}&propertyId=${p.id}`}
              className={
                p.id === propertyId ? 'tk-chip tk-chip-active' : 'tk-chip'
              }
            >
              {p.name}
            </Link>
          ))}
        </div>
      )}
      {error && (
        <div className="tk-alert mt-4" data-variant="warning">
          {error}
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="tk-card p-5">
          <h2 className="font-medium">Gedung / lantai</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {buildings.map((b) => (
              <li key={b.id} className="rounded-xl border border-zinc-100 p-2">
                <p className="font-medium">{b.name}</p>
                <p className="text-xs text-zinc-500">
                  Lantai: {b.floors.map((f) => f.name).join(', ') || '-'}
                </p>
                {workspaceId && propertyId && (
                  <form action={createFloor} className="mt-2 flex gap-1">
                    <input type="hidden" name="workspaceId" value={workspaceId} />
                    <input type="hidden" name="propertyId" value={propertyId} />
                    <input type="hidden" name="buildingId" value={b.id} />
                    <input
                      name="name"
                      required
                      placeholder="Lantai 1"
                      className="tk-input flex-1 !px-2 !py-1 !text-xs"
                    />
                    <input
                      name="level"
                      type="number"
                      defaultValue={b.floors.length + 1}
                      className="tk-input w-14 !px-1 !text-xs"
                    />
                    <button type="submit" className="tk-btn-sm">
                      +
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
          {workspaceId && propertyId && (
            <form action={createBuilding} className="mt-3 flex gap-2">
              <input type="hidden" name="workspaceId" value={workspaceId} />
              <input type="hidden" name="propertyId" value={propertyId} />
              <input
                name="name"
                required
                placeholder="Nama gedung/blok"
                className="tk-input flex-1 !px-2 !py-1 !text-sm"
              />
              <button type="submit" className="tk-btn-sm">
                + Gedung
              </button>
            </form>
          )}
        </section>

        <section className="tk-card p-5">
          <h2 className="font-medium">Tipe kamar</h2>
          <ul className="mt-2 divide-y text-sm">
            {roomTypes.map((rt) => (
              <li key={rt.id} className="py-2">
                {rt.name} · cap {rt.capacity} · Rp{' '}
                {Number(rt.baseRent).toLocaleString('id-ID')}
              </li>
            ))}
          </ul>
          {workspaceId && (
            <form action={createRoomType} className="mt-3 grid gap-2">
              <input type="hidden" name="workspaceId" value={workspaceId} />
              <input type="hidden" name="propertyId" value={propertyId} />
              <input
                name="name"
                required
                placeholder="Standard / Deluxe"
                className="tk-input !px-2 !py-1 !text-sm"
              />
              <div className="flex gap-2">
                <input
                  name="baseRent"
                  type="number"
                  placeholder="Sewa"
                  className="tk-input flex-1 !px-2 !py-1 !text-sm"
                />
                <input
                  name="defaultDeposit"
                  type="number"
                  placeholder="Deposit"
                  className="tk-input flex-1 !px-2 !py-1 !text-sm"
                />
                <input
                  name="capacity"
                  type="number"
                  defaultValue={1}
                  className="tk-input w-16 !px-2 !py-1 !text-sm"
                />
              </div>
              <button type="submit" className="tk-btn-sm">
                + Tipe kamar
              </button>
            </form>
          )}
        </section>
      </div>
    </>
  );
}
