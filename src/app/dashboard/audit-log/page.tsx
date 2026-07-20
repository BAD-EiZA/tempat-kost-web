import Link from 'next/link';
import { requireAuth } from '@/lib/auth';
import { listAuditLogs, listWorkspaces } from '@/lib/api';
import { PageHeader, WorkspaceChips } from '@/components/ui';

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
      <PageHeader
        title="Audit log"
        description="Riwayat aktivitas dan perubahan workspace."
      />

      {workspaces.length > 0 && (
        <WorkspaceChips
          workspaces={workspaces}
          workspaceId={workspaceId}
          hrefFor={(id) => href({ workspaceId: id }, 1)}
          className="mt-4"
        />
      )}

      <form className="tk-card mt-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <input type="hidden" name="workspaceId" value={workspaceId} />
        <label className="text-xs text-zinc-600">
          Action
          <input name="action" defaultValue={params.action} placeholder="invoice.issued" className="tk-input mt-1 w-full" />
        </label>
        <label className="text-xs text-zinc-600">
          Entity
          <input name="entityType" defaultValue={params.entityType} placeholder="invoice" className="tk-input mt-1 w-full" />
        </label>
        <label className="text-xs text-zinc-600">
          Dari
          <input type="date" name="from" defaultValue={params.from} className="tk-input mt-1 w-full" />
        </label>
        <label className="text-xs text-zinc-600">
          Sampai
          <input type="date" name="to" defaultValue={params.to} className="tk-input mt-1 w-full" />
        </label>
        <button type="submit" className="self-end tk-btn">
          Filter
        </button>
      </form>

      {error && <div className="tk-alert mt-4" data-variant="warning">{error}</div>}

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
