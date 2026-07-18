import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import {
  createProperty,
  listProperties,
  listWorkspaces,
} from '@/lib/api';

async function createPropertyAction(formData: FormData) {
  'use server';
  await requireAuth();
  const workspaceId = String(formData.get('workspaceId') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  const city = String(formData.get('city') ?? '').trim() || undefined;
  const addressLine =
    String(formData.get('addressLine') ?? '').trim() || undefined;
  if (!workspaceId || !name) return;
  await createProperty({ workspaceId, name, city, addressLine });
  redirect(`/dashboard/properties?workspaceId=${workspaceId}`);
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ workspaceId?: string }>;
}) {
  await requireAuth();
  const { workspaceId: qWs } = await searchParams;

  let workspaces: Awaited<ReturnType<typeof listWorkspaces>> = [];
  let properties: Awaited<ReturnType<typeof listProperties>> = [];
  let error: string | null = null;
  let workspaceId = qWs ?? '';

  try {
    workspaces = await listWorkspaces();
    if (!workspaceId && workspaces[0]) {
      workspaceId = workspaces[0].id;
    }
    if (workspaceId) {
      properties = await listProperties(workspaceId);
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Gagal memuat properti';
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Properti</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Satu workspace dapat mengelola banyak kos.
          </p>
        </div>
        {workspaces.length > 0 && (
          <form className="flex items-center gap-2 text-sm">
            <label htmlFor="ws" className="text-zinc-600">
              Workspace
            </label>
            <select
              id="ws"
              name="workspaceId"
              defaultValue={workspaceId}
              className="rounded-lg border border-zinc-300 px-3 py-2"
              onChange={undefined}
            >
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name}
                </option>
              ))}
            </select>
          </form>
        )}
      </div>

      {workspaces.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/dashboard/properties?workspaceId=${ws.id}`}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                ws.id === workspaceId
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              {ws.name}
            </Link>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {error}
        </div>
      )}

      {!workspaceId ? (
        <p className="mt-6 text-sm text-zinc-600">
          Belum ada workspace.{' '}
          <Link href="/onboarding" className="underline">
            Buat dulu
          </Link>
        </p>
      ) : (
        <>
          <ul className="mt-6 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
            {properties.length === 0 ? (
              <li className="p-6 text-sm text-zinc-600">
                Belum ada properti. Tambah di form bawah.
              </li>
            ) : (
              properties.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between px-6 py-4"
                >
                  <div>
                    <p className="font-medium">
                      {p.name}{' '}
                      <span className="text-xs font-normal text-zinc-500">
                        {p.code}
                      </span>
                    </p>
                    <p className="text-xs text-zinc-500">
                      {[p.city, p.addressLine].filter(Boolean).join(' · ') ||
                        'Alamat belum diisi'}{' '}
                      · {p.status} · {p._count?.rooms ?? 0} kamar
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/rooms?workspaceId=${workspaceId}&propertyId=${p.id}`}
                    className="text-sm font-medium underline"
                  >
                    Kamar
                  </Link>
                </li>
              ))
            )}
          </ul>

          <form
            action={createPropertyAction}
            className="mt-8 rounded-xl border border-zinc-200 bg-white p-6"
          >
            <h2 className="font-medium">Tambah properti</h2>
            <input type="hidden" name="workspaceId" value={workspaceId} />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                <span className="font-medium">Nama kos</span>
                <input
                  name="name"
                  required
                  maxLength={120}
                  placeholder="Kos Melati"
                  className="rounded-lg border border-zinc-300 px-3 py-2"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Kota</span>
                <input
                  name="city"
                  maxLength={80}
                  className="rounded-lg border border-zinc-300 px-3 py-2"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium">Alamat</span>
                <input
                  name="addressLine"
                  maxLength={255}
                  className="rounded-lg border border-zinc-300 px-3 py-2"
                />
              </label>
            </div>
            <button
              type="submit"
              className="mt-4 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white"
            >
              Simpan properti
            </button>
          </form>
        </>
      )}
    </>
  );
}
