import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { apiFetch, listWorkspaces } from '@/lib/api';

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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Notifikasi</h1>
        {workspaceId && (
          <form action={markAll}>
            <input type="hidden" name="workspaceId" value={workspaceId} />
            <button
              type="submit"
              className="rounded border px-3 py-1 text-xs"
            >
              Tandai semua dibaca
            </button>
          </form>
        )}
      </div>
      <p className="mt-1 text-xs text-zinc-500">
        In-app · push subscription API ready (VAPID optional)
      </p>
      {workspaces.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/dashboard/notifications?workspaceId=${ws.id}`}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                ws.id === workspaceId ? 'bg-zinc-900 text-white' : 'bg-zinc-100'
              }`}
            >
              {ws.name}
            </Link>
          ))}
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
          {error}
        </div>
      )}
      <ul className="mt-6 divide-y rounded-xl border bg-white">
        {items.length === 0 ? (
          <li className="p-6 text-sm text-zinc-500">Tidak ada notifikasi.</li>
        ) : (
          items.map((n) => (
            <li
              key={n.id}
              className="flex flex-wrap items-start justify-between gap-2 px-6 py-3 text-sm"
            >
              <div>
                <p className="font-medium">{n.title}</p>
                <p className="text-xs text-zinc-600">{n.body}</p>
                <p className="text-[10px] text-zinc-400">
                  {String(n.createdAt).slice(0, 19).replace('T', ' ')} · {n.status}
                </p>
              </div>
              {n.status !== 'READ' && (
                <form action={markRead}>
                  <input type="hidden" name="id" value={n.id} />
                  <input type="hidden" name="workspaceId" value={workspaceId} />
                  <button
                    type="submit"
                    className="rounded border px-2 py-1 text-xs"
                  >
                    Tandai dibaca
                  </button>
                </form>
              )}
            </li>
          ))
        )}
      </ul>
    </>
  );
}
