import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { createTenant, listTenants, listWorkspaces } from '@/lib/api';
import {
  EmptyState,
  PageHeader,
  StatusBadge,
  WorkspaceChips,
} from '@/components/ui';

async function createTenantAction(formData: FormData) {
  'use server';
  await requireAuth();
  const workspaceId = String(formData.get('workspaceId') ?? '');
  const fullName = String(formData.get('fullName') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim() || undefined;
  const email = String(formData.get('email') ?? '').trim() || undefined;
  if (!workspaceId || !fullName) return;
  await createTenant({ workspaceId, fullName, phone, email });
  redirect(`/dashboard/tenants?workspaceId=${workspaceId}`);
}

export default async function TenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ workspaceId?: string }>;
}) {
  await requireAuth();
  const { workspaceId: qWs } = await searchParams;

  let workspaces: Awaited<ReturnType<typeof listWorkspaces>> = [];
  let tenants: Awaited<ReturnType<typeof listTenants>> = [];
  let error: string | null = null;
  let workspaceId = qWs ?? '';

  try {
    workspaces = await listWorkspaces();
    if (!workspaceId && workspaces[0]) workspaceId = workspaces[0].id;
    if (workspaceId) tenants = await listTenants(workspaceId);
  } catch (e) {
    error = e instanceof Error ? e.message : 'Gagal memuat penyewa';
  }

  return (
    <>
      <PageHeader
        title="Penyewa"
        description="Profil tenant per workspace."
        actions={
          workspaceId ? (
            <Link
              href={`/dashboard/leases?workspaceId=${workspaceId}`}
              className="text-sm font-medium text-emerald-800 underline-offset-2 hover:underline"
            >
              Ke kontrak
            </Link>
          ) : null
        }
      />

      {workspaces.length > 0 && (
        <WorkspaceChips
          workspaces={workspaces}
          workspaceId={workspaceId}
          hrefFor={(id) => `/dashboard/tenants?workspaceId=${id}`}
        />
      )}

      {error && (
        <div className="tk-alert mt-4" data-variant="warning">
          {error}
        </div>
      )}

      {tenants.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="Belum ada penyewa"
          body="Tambah profil penyewa sebelum membuat kontrak."
        />
      ) : (
        <ul className="mt-6 space-y-2">
          {tenants.map((t) => (
            <li
              key={t.id}
              className="tk-card flex flex-wrap items-center justify-between gap-3 px-5 py-4"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-zinc-900">{t.fullName}</p>
                  <StatusBadge status={t.status} kind="tenant" />
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {[t.phone, t.email].filter(Boolean).join(' · ') ||
                    'Kontak belum diisi'}
                  {' · '}
                  {t._count?.leases ?? 0} kontrak
                </p>
              </div>
              <Link
                href={`/dashboard/tenants/${t.id}?workspaceId=${workspaceId}`}
                className="tk-btn-secondary !px-3 !py-1.5 !text-xs"
              >
                Detail
              </Link>
            </li>
          ))}
        </ul>
      )}

      {workspaceId && (
        <form action={createTenantAction} className="tk-card mt-8 p-6">
          <h2 className="text-base font-semibold text-zinc-900">
            Tambah penyewa
          </h2>
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="tk-field sm:col-span-2">
              <span className="tk-label">Nama lengkap</span>
              <input name="fullName" required className="tk-input" />
            </label>
            <label className="tk-field">
              <span className="tk-label">WhatsApp / telepon</span>
              <input name="phone" type="tel" className="tk-input" />
            </label>
            <label className="tk-field">
              <span className="tk-label">Email</span>
              <input name="email" type="email" className="tk-input" />
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
