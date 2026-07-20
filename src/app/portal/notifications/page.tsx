import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { resolvePortalTenantId, withTenant } from '@/lib/portal-tenant';
import { formatDateId } from '@/lib/format';
import { EmptyState } from '@/components/ui';
import { PortalPageHeader } from '@/components/portal/page-header';

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
    <div className="space-y-4">
      <PortalPageHeader
        title="Notifikasi"
        description="Pesan dan pengingat untuk Anda."
      />
      {error ? (
        <div className="tk-alert" data-variant="warning">
          {error}
        </div>
      ) : null}

      {items.length === 0 ? (
        <EmptyState title="Tidak ada notifikasi" />
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const unread = item.status !== 'READ';
            return (
              <li
                key={item.id}
                className={`tk-card p-4 ${unread ? 'ring-1 ring-emerald-200' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-zinc-900">
                        {item.title}
                      </p>
                      {unread ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-900">
                          Baru
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-zinc-600">{item.body}</p>
                    <p className="mt-2 text-xs text-zinc-400">
                      {formatDateId(item.createdAt)}
                    </p>
                  </div>
                  {unread && tenantId ? (
                    <form action={markRead} className="shrink-0">
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="tenantId" value={tenantId} />
                      <button
                        className="tk-btn-secondary !px-2.5 !py-1 !text-xs"
                        type="submit"
                      >
                        Baca
                      </button>
                    </form>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
