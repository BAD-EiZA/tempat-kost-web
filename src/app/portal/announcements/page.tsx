import { requireAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { resolvePortalTenantId } from '@/lib/portal-tenant';

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
    <>
      <h1 className="text-xl font-semibold">Pengumuman</h1>
      {error && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
          {error}
        </div>
      )}
      <ul className="mt-4 space-y-3">
        {items.length === 0 ? (
          <li className="rounded-xl border bg-white p-4 text-sm text-zinc-500">
            Tidak ada pengumuman.
          </li>
        ) : (
          items.map((a) => (
            <li key={a.id} className="rounded-xl border bg-white p-4 text-sm">
              <p className="font-medium">{a.title}</p>
              <p className="mt-1 whitespace-pre-wrap text-zinc-600">{a.body}</p>
              <p className="mt-2 text-[10px] text-zinc-400">
                {a.publishedAt
                  ? String(a.publishedAt).slice(0, 16).replace('T', ' ')
                  : ''}
              </p>
            </li>
          ))
        )}
      </ul>
    </>
  );
}
