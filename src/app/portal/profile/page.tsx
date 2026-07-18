import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { resolvePortalTenantId } from '@/lib/portal-tenant';

type Profile = {
  id: string;
  fullName: string;
  preferredName: string | null;
  phone: string | null;
  email: string | null;
  emergencyName: string | null;
  emergencyPhone: string | null;
};

async function saveAction(formData: FormData) {
  'use server';
  await requireAuth();
  const tenantId = String(formData.get('tenantId') ?? '');
  if (!tenantId) return;
  await apiFetch('/v1/portal/profile', {
    method: 'PATCH',
    body: JSON.stringify({
      tenantId,
      preferredName: String(formData.get('preferredName') ?? '') || undefined,
      phone: String(formData.get('phone') ?? '') || undefined,
      email: String(formData.get('email') ?? '') || undefined,
      emergencyName: String(formData.get('emergencyName') ?? '') || undefined,
      emergencyPhone: String(formData.get('emergencyPhone') ?? '') || undefined,
    }),
  });
  redirect(`/portal/profile?tenantId=${tenantId}&saved=1`);
}

export default async function PortalProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; tenantId?: string }>;
}) {
  await requireAuth();
  const sp = await searchParams;
  let profile: Profile | null = null;
  let error: string | null = null;

  try {
    const { tenantId } = await resolvePortalTenantId(sp.tenantId);
    if (tenantId) {
      profile = await apiFetch<Profile>(
        `/v1/portal/profile?tenantId=${encodeURIComponent(tenantId)}`,
      );
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Gagal';
  }

  return (
    <>
      <h1 className="text-xl font-semibold">Profil</h1>
      {sp.saved && (
        <p className="mt-2 text-sm text-emerald-700">Profil disimpan.</p>
      )}
      {error && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
          {error}
        </div>
      )}
      {!profile ? (
        <p className="mt-4 text-sm text-zinc-500">
          Profil penyewa belum terhubung.
        </p>
      ) : (
        <form action={saveAction} className="mt-6 space-y-3 rounded-xl border bg-white p-5">
          <input type="hidden" name="tenantId" value={profile.id} />
          <p className="text-sm font-medium">{profile.fullName}</p>
          <label className="block text-sm">
            Nama panggilan
            <input
              name="preferredName"
              defaultValue={profile.preferredName ?? ''}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Telepon / WA
            <input
              name="phone"
              defaultValue={profile.phone ?? ''}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Email
            <input
              name="email"
              type="email"
              defaultValue={profile.email ?? ''}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Kontak darurat
            <input
              name="emergencyName"
              defaultValue={profile.emergencyName ?? ''}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Telepon darurat
            <input
              name="emergencyPhone"
              defaultValue={profile.emergencyPhone ?? ''}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm text-white"
          >
            Simpan
          </button>
        </form>
      )}
    </>
  );
}
