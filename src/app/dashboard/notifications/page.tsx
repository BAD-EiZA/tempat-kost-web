import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { apiFetch, listWorkspaces } from '@/lib/api';
import {
  EmptyState,
  PageHeader,
  WorkspaceChips,
} from '@/components/ui';
import { formatDateId } from '@/lib/format';

async function markRead(formData: FormData) {
  'use server';
  await requireAuth();
  const id = String(formData.get('id') ?? '');
  const workspaceId = String(formData.get('workspaceId') ?? '');
  if (!id) return;
  await apiFetch(`/v1/notifications/${id}/read`, { method: 'POST' });
  redirect(`/dashboard/notifications?workspaceId=${workspaceId}`);
}

async function markAll(formData: FormData) {
  'use server';
  await requireAuth();
  const workspaceId = String(formData.get('workspaceId') ?? '');
  await apiFetch('/v1/notifications/read-all', {
    method: 'POST',
    body: JSON.stringify({ workspaceId: workspaceId || undefined }),
  });
  redirect(`/dashboard/notifications?workspaceId=${workspaceId}`);
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ workspaceId?: string }>;
}) {
  await requireAuth();
  const { workspaceId: qWs } = await searchParams;
  let workspaces: Awaited<ReturnType<typeof listWorkspaces>> = [];
  let workspaceId = qWs ?? '';
  let items: Array<{
    id: string;
    title: string;
    body: string;
    status: string;
    createdAt: string;
  }> = [];
  let error: string | null = null;

  try {
    workspaces = await listWorkspaces();
    if (!workspaceId && workspaces[0]) workspaceId = workspaces[0].id;
    const q = workspaceId
      ? `?workspaceId=${encodeURIComponent(workspaceId)}`
      : '';
    items = await apiFetch<typeof items>(`/v1/notifications${q}`);
  } catch (e) {
    error = e instanceof Error ? e.message : 'Gagal';
  }

  return (
    <>
      <PageHeader
        title="Notifikasi"
        description="Pesan in-app untuk workspace Anda."
        actions={
          workspaceId ? (
            <form action={markAll}>
              <input type="hidden" name="workspaceId" value={workspaceId} />
              <button type="submit" className="tk-btn-secondary !text-xs">
                Tandai semua dibaca
              </button>
            </form>
          ) : null
        }
      />
      {workspaces.length > 0 && (
        <WorkspaceChips
          workspaces={workspaces}
          workspaceId={workspaceId}
          hrefFor={(id) => `/dashboard/notifications?workspaceId=${id}`}
        />
      )}
      {error && (
        <div className="tk-alert mt-4" data-variant="warning">
          {error}
        </div>
      )}
      {items.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="Tidak ada notifikasi"
          body="Notifikasi baru akan muncul di sini."
        />
      ) : (
      <ul className="mt-6 space-y-2">
          {items.map((n) => (
            <li
              key={n.id}
              className={`tk-card flex flex-wrap items-start justify-between gap-2 px-5 py-3 text-sm ${
                n.status !== 'READ' ? 'ring-1 ring-emerald-200' : ''
              }`}
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-zinc-900">{n.title}</p>
                  {n.status !== 'READ' ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-900">
                      Baru
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-zinc-600">{n.body}</p>
                <p className="mt-1 text-[10px] text-zinc-400">
                  {formatDateId(n.createdAt)}
                </p>
              </div>
              {n.status !== 'READ' && (
                <form action={markRead}>
                  <input type="hidden" name="id" value={n.id} />
                  <input type="hidden" name="workspaceId" value={workspaceId} />
                  <button type="submit" className="tk-btn-secondary !px-2 !py-1 !text-xs">
                    Tandai dibaca
                  </button>
                </form>
              )}
            </li>
          ))}
      </ul>
      )}
    </>
  );
}
