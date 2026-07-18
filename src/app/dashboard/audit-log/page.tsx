import Link from 'next/link';
import { requireAuth } from '@/lib/auth';
import { listAuditLogs, listWorkspaces } from '@/lib/api';

type SearchParams = {
  workspaceId?: string;
  action?: string;
  entityType?: string;
  from?: string;
  to?: string;
  page?: string;
};

function href(params: SearchParams, page: number) {
  const query = new URLSearchParams();
  Object.entries({ ...params, page: String(page) }).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  return `/dashboard/audit-log?${query}`;
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAuth();
  const params = await searchParams;
  let workspaces: Awaited<ReturnType<typeof listWorkspaces>> = [];
  let result: Awaited<ReturnType<typeof listAuditLogs>> | null = null;
  let workspaceId = params.workspaceId ?? '';
  let error: string | null = null;
  const page = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1);

  try {
    workspaces = await listWorkspaces();
    if (!workspaceId && workspaces[0]) workspaceId = workspaces[0].id;
    if (workspaceId) {
      result = await listAuditLogs({
        workspaceId,
        action: params.action,
        entityType: params.entityType,
        from: params.from ? `${params.from}T00:00:00.000Z` : undefined,
        to: params.to ? `${params.to}T23:59:59.999Z` : undefined,
        page,
      });
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Gagal memuat audit log';
  }

  const currentParams = { ...params, workspaceId };
  return (
    <>
      <h1 className="text-2xl font-semibold">Audit log</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Riwayat aktivitas dan perubahan workspace.
      </p>

      {workspaces.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {workspaces.map((workspace) => (
            <Link
              key={workspace.id}
              href={href({ workspaceId: workspace.id }, 1)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                workspace.id === workspaceId
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-700'
              }`}
            >
              {workspace.name}
            </Link>
          ))}
        </div>
      )}

      <form className="mt-6 grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
        <input type="hidden" name="workspaceId" value={workspaceId} />
        <label className="text-xs text-zinc-600">
          Action
          <input name="action" defaultValue={params.action} placeholder="invoice.issued" className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-xs text-zinc-600">
          Entity
          <input name="entityType" defaultValue={params.entityType} placeholder="invoice" className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-xs text-zinc-600">
          Dari
          <input type="date" name="from" defaultValue={params.from} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-xs text-zinc-600">
          Sampai
          <input type="date" name="to" defaultValue={params.to} className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
        </label>
        <button type="submit" className="self-end rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
          Filter
        </button>
      </form>

      {error && <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">{error}</div>}

      <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <caption className="sr-only">Riwayat aktivitas workspace</caption>
          <thead className="bg-zinc-50 text-xs text-zinc-500">
            <tr>
              <th scope="col" className="px-4 py-3">Waktu</th>
              <th scope="col" className="px-4 py-3">Pelaku</th>
              <th scope="col" className="px-4 py-3">Action</th>
              <th scope="col" className="px-4 py-3">Entity</th>
              <th scope="col" className="px-4 py-3">Detail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {!result?.items.length ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-500">Belum ada aktivitas.</td></tr>
            ) : result.items.map((log) => (
              <tr key={log.id} className="align-top">
                <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-500">{new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(new Date(log.createdAt))}</td>
                <td className="px-4 py-3">{log.actor?.fullName ?? log.actor?.email ?? 'Sistem'}</td>
                <td className="px-4 py-3 font-mono text-xs">{log.action}</td>
                <td className="px-4 py-3"><span className="font-medium">{log.entityType}</span>{log.entityId && <span className="block max-w-40 truncate font-mono text-xs text-zinc-500" title={log.entityId}>{log.entityId}</span>}</td>
                <td className="max-w-80 px-4 py-3"><code className="block whitespace-pre-wrap break-all text-xs text-zinc-600">{log.metadata == null ? '-' : JSON.stringify(log.metadata)}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {result && result.pagination.totalPages > 1 && (
        <nav aria-label="Pagination audit log" className="mt-4 flex items-center justify-between text-sm">
          <span className="text-zinc-500">{result.pagination.total} aktivitas</span>
          <div className="flex gap-2">
            {page > 1 && <Link href={href(currentParams, page - 1)} className="rounded-lg border bg-white px-3 py-2">Sebelumnya</Link>}
            {page < result.pagination.totalPages && <Link href={href(currentParams, page + 1)} className="rounded-lg border bg-white px-3 py-2">Berikutnya</Link>}
          </div>
        </nav>
      )}
    </>
  );
}
