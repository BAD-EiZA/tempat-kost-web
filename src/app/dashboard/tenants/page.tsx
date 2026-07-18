import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { createTenant, listTenants, listWorkspaces } from '@/lib/api';

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
      <h1 className="text-2xl font-semibold">Penyewa</h1>
      <p className="mt-1 text-sm text-zinc-600">Profil tenant per workspace.</p>

      {workspaces.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/dashboard/tenants?workspaceId=${ws.id}`}
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

      {error && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
          {error}
        </div>
      )}

      <ul className="mt-6 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
        {tenants.length === 0 ? (
          <li className="p-6 text-sm text-zinc-600">Belum ada penyewa.</li>
        ) : (
          tenants.map((t) => (
            <li key={t.id} className="flex justify-between px-6 py-4 text-sm">
              <div>
                <p className="font-medium">{t.fullName}</p>
                <p className="text-xs text-zinc-500">
                  {[t.phone, t.email].filter(Boolean).join(' · ') || '—'} ·{' '}
                  {t.status} · {t._count?.leases ?? 0} kontrak
                </p>
              </div>
              <Link
                href={`/dashboard/tenants/${t.id}?workspaceId=${workspaceId}`}
                className="text-xs underline"
              >
                Dokumen
              </Link>
            </li>
          ))
        )}
      </ul>

      {workspaceId && (
        <form
          action={createTenantAction}
          className="mt-8 rounded-xl border border-zinc-200 bg-white p-6"
        >
          <h2 className="font-medium">Tambah penyewa</h2>
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span>Nama lengkap</span>
              <input
                name="fullName"
                required
                className="rounded-lg border border-zinc-300 px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span>WhatsApp / telepon</span>
              <input
                name="phone"
                className="rounded-lg border border-zinc-300 px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span>Email</span>
              <input
                name="email"
                type="email"
                className="rounded-lg border border-zinc-300 px-3 py-2"
              />
            </label>
          </div>
          <button
            type="submit"
            className="mt-4 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white"
          >
            Simpan
          </button>
        </form>
      )}
    </>
  );
}
