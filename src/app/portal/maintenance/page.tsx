import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { resolvePortalTenantId, withTenant } from '@/lib/portal-tenant';

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
  redirect(withTenant('/portal', tenantId));
}

export default async function PortalMaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ tenantId?: string }>;
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
      <p className="text-sm text-zinc-600">Profil penyewa belum terhubung.</p>
    );
  }

  return (
    <>
      <h1 className="text-xl font-semibold">Lapor kerusakan</h1>
      <form action={submitAction} className="mt-4 space-y-3">
        <input type="hidden" name="tenantId" value={tenantId} />
        <label className="flex flex-col gap-1 text-sm">
          <span>Judul</span>
          <input
            name="title"
            required
            className="rounded-lg border border-zinc-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Urgensi</span>
          <select name="urgency" className="rounded-lg border px-3 py-2">
            <option value="low">Rendah</option>
            <option value="medium">Sedang</option>
            <option value="high">Tinggi</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Deskripsi</span>
          <textarea
            name="description"
            required
            rows={4}
            className="rounded-lg border border-zinc-300 px-3 py-2"
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white"
        >
          Kirim
        </button>
      </form>
    </>
  );
}
