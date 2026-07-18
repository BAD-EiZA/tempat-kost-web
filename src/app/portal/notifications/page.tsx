import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { resolvePortalTenantId, withTenant } from '@/lib/portal-tenant';

async function markRead(formData: FormData) {
  'use server';
  await requireAuth();
  const id = String(formData.get('id') ?? '');
  const tenantId = String(formData.get('tenantId') ?? '');
  if (!id || !tenantId) return;
  await apiFetch(
    `/v1/portal/notifications/${encodeURIComponent(id)}/read?tenantId=${encodeURIComponent(tenantId)}`,
    { method: 'POST' },
  );
  redirect(withTenant('/portal/notifications', tenantId));
}

export default async function PortalNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ tenantId?: string }>;
}) {
  await requireAuth();
  const { tenantId: requestedTenantId } = await searchParams;
  const { tenantId } = await resolvePortalTenantId(requestedTenantId);
  let items: Array<{
    id: string;
    title: string;
    body: string;
    status: string;
    createdAt: string;
  }> = [];
  let error: string | null = null;

  if (tenantId) {
    try {
      items = await apiFetch(
        `/v1/portal/notifications?tenantId=${encodeURIComponent(tenantId)}`,
      );
    } catch (cause) {
      error = cause instanceof Error ? cause.message : 'Gagal memuat notifikasi';
    }
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold">Notifikasi</h1>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      <ul className="mt-5 divide-y rounded-xl border bg-white">
        {items.length === 0 ? (
          <li className="p-5 text-sm text-zinc-500">Tidak ada notifikasi.</li>
        ) : (
          items.map((item) => (
            <li key={item.id} className="p-4 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-zinc-600">{item.body}</p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {new Date(item.createdAt).toLocaleDateString('id-ID')}
                  </p>
                </div>
                {item.status !== 'READ' && (
                  <form action={markRead}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="tenantId" value={tenantId} />
                    <button className="rounded border px-2 py-1 text-xs" type="submit">
                      Baca
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
