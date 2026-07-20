import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { resolvePortalTenantId, withTenant } from '@/lib/portal-tenant';
import { EmptyState } from '@/components/ui';
import { PortalPageHeader } from '@/components/portal/page-header';

async function submitAction(formData: FormData) {
  'use server';
  await requireAuth();
  const tenantId = String(formData.get('tenantId') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const urgency = String(formData.get('urgency') ?? 'medium');
  if (!tenantId || !title || !description) return;
  await apiFetch('/v1/portal/maintenance', {
    method: 'POST',
    body: JSON.stringify({ tenantId, title, description, urgency }),
  });
  redirect(withTenant('/portal/maintenance?sent=1', tenantId));
}

export default async function PortalMaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ tenantId?: string; sent?: string }>;
}) {
  await requireAuth();
  const sp = await searchParams;
  let tenantId = '';
  try {
    const resolved = await resolvePortalTenantId(sp.tenantId);
    tenantId = resolved.tenantId;
  } catch {
    /* empty */
  }

  if (!tenantId) {
    return (
      <EmptyState
        title="Profil penyewa belum terhubung"
        body="Hubungi pengelola kos untuk menghubungkan akun Anda."
      />
    );
  }

  return (
    <div className="space-y-4">
      <PortalPageHeader
        title="Lapor kerusakan"
        description="Laporkan masalah di kamar atau area bersama. Tim akan menindaklanjuti."
      />
      {sp.sent ? (
        <div className="tk-alert" data-variant="success">
          Laporan terkirim. Anda bisa mengirim laporan lain di bawah.
        </div>
      ) : null}

      <form action={submitAction} className="tk-card space-y-3 p-5">
        <input type="hidden" name="tenantId" value={tenantId} />
        <label className="tk-field">
          <span className="tk-label">Judul</span>
          <input
            name="title"
            required
            maxLength={120}
            placeholder="Contoh: AC tidak dingin"
            className="tk-input"
          />
        </label>
        <label className="tk-field">
          <span className="tk-label">Urgensi</span>
          <select name="urgency" className="tk-select" defaultValue="medium">
            <option value="low">Rendah</option>
            <option value="medium">Sedang</option>
            <option value="high">Tinggi</option>
          </select>
        </label>
        <label className="tk-field">
          <span className="tk-label">Deskripsi</span>
          <textarea
            name="description"
            required
            rows={4}
            placeholder="Jelaskan kerusakan dan lokasi"
            className="tk-input resize-y"
          />
        </label>
        <button type="submit" className="tk-btn w-full !py-2.5">
          Kirim laporan
        </button>
      </form>
    </div>
  );
}
