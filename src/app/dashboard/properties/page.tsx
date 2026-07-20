import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import {
  createProperty,
  listProperties,
  listWorkspaces,
} from '@/lib/api';
import {
  EmptyState,
  PageHeader,
  StatusBadge,
  WorkspaceChips,
} from '@/components/ui';

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
      <PageHeader
        title="Properti"
        description="Satu workspace dapat mengelola banyak kos."
      />

      {workspaces.length > 0 && (
        <WorkspaceChips
          workspaces={workspaces}
          workspaceId={workspaceId}
          hrefFor={(id) => `/dashboard/properties?workspaceId=${id}`}
        />
      )}

      {error && (
        <div className="tk-alert mt-4" data-variant="warning">
          {error}
        </div>
      )}

      {!workspaceId ? (
        <EmptyState
          className="mt-6"
          title="Belum ada workspace"
          body="Buat workspace dulu sebelum menambah properti."
          action={
            <Link href="/onboarding" className="tk-btn !text-sm">
              Buat workspace
            </Link>
          }
        />
      ) : (
        <>
          {properties.length === 0 ? (
            <EmptyState
              className="mt-6"
              title="Belum ada properti"
              body="Tambah kos pertama lewat form di bawah."
            />
          ) : (
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {properties.map((p) => (
                <li key={p.id} className="tk-card flex flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-zinc-900">
                        {p.name}
                      </p>
                      {p.code ? (
                        <p className="text-xs text-zinc-500">{p.code}</p>
                      ) : null}
                    </div>
                    <StatusBadge status={p.status} kind="property" />
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                    {[p.city, p.addressLine].filter(Boolean).join(' · ') ||
                      'Alamat belum diisi'}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {p._count?.rooms ?? 0} kamar
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/dashboard/rooms?workspaceId=${workspaceId}&propertyId=${p.id}`}
                      className="tk-btn-sm"
                    >
                      Kamar
                    </Link>
                    <Link
                      href={`/dashboard/leases?workspaceId=${workspaceId}`}
                      className="tk-btn-secondary !px-2.5 !py-1 !text-xs"
                    >
                      Kontrak
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <form action={createPropertyAction} className="tk-card mt-8 p-6">
            <h2 className="text-base font-semibold text-zinc-900">
              Tambah properti
            </h2>
            <input type="hidden" name="workspaceId" value={workspaceId} />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="tk-field sm:col-span-2">
                <span className="tk-label">Nama kos</span>
                <input
                  name="name"
                  required
                  maxLength={120}
                  placeholder="Kos Melati"
                  className="tk-input"
                />
              </label>
              <label className="tk-field">
                <span className="tk-label">Kota</span>
                <input name="city" maxLength={80} className="tk-input" />
              </label>
              <label className="tk-field">
                <span className="tk-label">Alamat</span>
                <input
                  name="addressLine"
                  maxLength={255}
                  className="tk-input"
                />
              </label>
            </div>
            <button type="submit" className="tk-btn mt-4">
              Simpan properti
            </button>
          </form>
        </>
      )}
    </>
  );
}
