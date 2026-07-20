import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { resolvePortalTenantId } from '@/lib/portal-tenant';
import { EmptyState } from '@/components/ui';
import { PortalPageHeader } from '@/components/portal/page-header';

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
    <div className="space-y-4">
      <PortalPageHeader
        title="Profil"
        description="Data kontak dan darurat."
      />
      {sp.saved ? (
        <div className="tk-alert" data-variant="success">
          Profil disimpan.
        </div>
      ) : null}
      {error ? (
        <div className="tk-alert" data-variant="warning">
          {error}
        </div>
      ) : null}

      {!profile ? (
        <EmptyState
          title="Profil penyewa belum terhubung"
          body="Hubungi pengelola untuk menghubungkan akun Anda."
        />
      ) : (
        <form action={saveAction} className="tk-card space-y-3 p-5">
          <input type="hidden" name="tenantId" value={profile.id} />
          <p className="text-sm font-semibold text-zinc-900">
            {profile.fullName}
          </p>
          <label className="tk-field">
            <span className="tk-label">Nama panggilan</span>
            <input
              name="preferredName"
              defaultValue={profile.preferredName ?? ''}
              className="tk-input"
            />
          </label>
          <label className="tk-field">
            <span className="tk-label">Telepon / WA</span>
            <input
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              defaultValue={profile.phone ?? ''}
              className="tk-input"
            />
          </label>
          <label className="tk-field">
            <span className="tk-label">Email</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={profile.email ?? ''}
              className="tk-input"
            />
          </label>
          <label className="tk-field">
            <span className="tk-label">Kontak darurat</span>
            <input
              name="emergencyName"
              defaultValue={profile.emergencyName ?? ''}
              className="tk-input"
            />
          </label>
          <label className="tk-field">
            <span className="tk-label">Telepon darurat</span>
            <input
              name="emergencyPhone"
              type="tel"
              inputMode="tel"
              defaultValue={profile.emergencyPhone ?? ''}
              className="tk-input"
            />
          </label>
          <button type="submit" className="tk-btn w-full !py-2.5">
            Simpan
          </button>
        </form>
      )}
    </div>
  );
}
