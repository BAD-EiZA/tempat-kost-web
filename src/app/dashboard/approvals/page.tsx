import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { apiFetch, listWorkspaces } from '@/lib/api';

async function decide(formData: FormData) {
  'use server';
  await requireAuth();
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '') as
    | 'approved'
    | 'rejected';
  const workspaceId = String(formData.get('workspaceId') ?? '');
  if (!id || !status) return;
  await apiFetch(`/v1/ops/approvals/${id}/decide`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  });
  redirect(`/dashboard/approvals?workspaceId=${workspaceId}`);
}

async function requestApproval(formData: FormData) {
  'use server';
  await requireAuth();
  const workspaceId = String(formData.get('workspaceId') ?? '');
  const kind = String(formData.get('kind') ?? 'generic');
  const entityId = String(formData.get('entityId') ?? '').trim();
  if (!workspaceId || !entityId) return;
  await apiFetch('/v1/ops/approvals', {
    method: 'POST',
    body: JSON.stringify({
      workspaceId,
      kind,
      entityType: String(formData.get('entityType') ?? 'expense'),
      entityId,
      note: String(formData.get('note') ?? '') || undefined,
    }),
  });
  redirect(`/dashboard/approvals?workspaceId=${workspaceId}`);
}

export default async function ApprovalsPage({
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
    kind: string;
    entityType: string;
    entityId: string;
    status: string;
    note: string | null;
  }> = [];
  let error: string | null = null;

  try {
    workspaces = await listWorkspaces();
    if (!workspaceId && workspaces[0]) workspaceId = workspaces[0].id;
    if (workspaceId) {
      items = await apiFetch<typeof items>(
        `/v1/ops/approvals?workspaceId=${workspaceId}`,
      );
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Gagal';
  }

  return (
    <>
      <h1 className="text-2xl font-semibold">Approval</h1>
      {workspaces.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/dashboard/approvals?workspaceId=${ws.id}`}
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
          <li className="p-6 text-sm text-zinc-500">Tidak ada permintaan.</li>
        ) : (
          items.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-2 px-6 py-3 text-sm"
            >
              <div>
                <p className="font-medium">
                  {a.kind} · {a.entityType}/{a.entityId}
                </p>
                <p className="text-xs text-zinc-500">
                  {a.status} {a.note ? `· ${a.note}` : ''}
                </p>
              </div>
              {a.status === 'pending' && (
                <div className="flex gap-1">
                  <form action={decide}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="workspaceId" value={workspaceId} />
                    <input type="hidden" name="status" value="approved" />
                    <button
                      type="submit"
                      className="rounded bg-emerald-700 px-2 py-1 text-xs text-white"
                    >
                      Approve
                    </button>
                  </form>
                  <form action={decide}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="workspaceId" value={workspaceId} />
                    <input type="hidden" name="status" value="rejected" />
                    <button
                      type="submit"
                      className="rounded border px-2 py-1 text-xs"
                    >
                      Reject
                    </button>
                  </form>
                </div>
              )}
            </li>
          ))
        )}
      </ul>
      {workspaceId && (
        <form
          action={requestApproval}
          className="mt-8 max-w-md space-y-2 rounded-xl border bg-white p-6"
        >
          <h2 className="font-medium">Ajukan approval</h2>
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <select name="kind" className="w-full rounded border px-3 py-2 text-sm">
            <option value="expense">Expense</option>
            <option value="refund">Refund</option>
            <option value="bank_change">Bank change</option>
          </select>
          <input
            name="entityId"
            required
            placeholder="Entity ID"
            className="w-full rounded border px-3 py-2 text-sm"
          />
          <input
            name="note"
            placeholder="Catatan"
            className="w-full rounded border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white"
          >
            Submit
          </button>
        </form>
      )}
    </>
  );
}
