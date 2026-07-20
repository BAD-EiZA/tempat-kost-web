import { requireAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { resolvePortalTenantId } from '@/lib/portal-tenant';
import { formatDateId } from '@/lib/format';
import { EmptyState } from '@/components/ui';
import { PortalPageHeader } from '@/components/portal/page-header';

export default async function PortalAnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ tenantId?: string }>;
}) {
  await requireAuth();
  const sp = await searchParams;
  let items: Array<{
    id: string;
    title: string;
    body: string;
    publishedAt: string | null;
  }> = [];
  let error: string | null = null;

  try {
    const { tenantId } = await resolvePortalTenantId(sp.tenantId);
    if (tenantId) {
      items = await apiFetch(
        `/v1/portal/announcements?tenantId=${encodeURIComponent(tenantId)}`,
      );
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Gagal';
  }

  return (
    <div className="space-y-4">
      <PortalPageHeader
        title="Pengumuman"
        description="Info dari pengelola kos."
      />
      {error ? (
        <div className="tk-alert" data-variant="warning">
          {error}
        </div>
      ) : null}

      {items.length === 0 ? (
        <EmptyState title="Tidak ada pengumuman" />
      ) : (
        <ul className="space-y-3">
          {items.map((a) => (
            <li key={a.id} className="tk-card p-4">
              <p className="text-sm font-semibold text-zinc-900">{a.title}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600">
                {a.body}
              </p>
              {a.publishedAt ? (
                <p className="mt-3 text-xs text-zinc-400">
                  {formatDateId(a.publishedAt)}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
