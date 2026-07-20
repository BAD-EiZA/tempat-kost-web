import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { apiFetch, listWorkspaces } from '@/lib/api';
import {
  EmptyState,
  PageHeader,
  StatusBadge,
  WorkspaceChips,
} from '@/components/ui';

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
      <PageHeader
        title="Approval"
        description="Permintaan persetujuan yang menunggu keputusan."
      />
      {workspaces.length > 0 && (
        <WorkspaceChips
          workspaces={workspaces}
          workspaceId={workspaceId}
          hrefFor={(id) => `/dashboard/approvals?workspaceId=${id}`}
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
          title="Tidak ada permintaan"
          body="Permintaan approval akan muncul di sini."
        />
      ) : (
      <ul className="mt-6 space-y-2">
          {items.map((a) => (
            <li
              key={a.id}
              className="tk-card flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm"
            >
              <div>
                <p className="font-semibold text-zinc-900">
                  {a.kind} · {a.entityType}
                </p>
                <p className="mt-0.5 font-mono text-xs text-zinc-400">
                  {a.entityId}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <StatusBadge status={a.status} kind="payment" />
                  {a.note ? (
                    <span className="text-xs text-zinc-500">{a.note}</span>
                  ) : null}
                </div>
              </div>
              {a.status === 'pending' && (
                <div className="flex gap-1">
                  <form action={decide}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="workspaceId" value={workspaceId} />
                    <input type="hidden" name="status" value="approved" />
                    <button type="submit" className="tk-btn-sm">
                      Approve
                    </button>
                  </form>
                  <form action={decide}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="workspaceId" value={workspaceId} />
                    <input type="hidden" name="status" value="rejected" />
                    <button
                      type="submit"
                      className="tk-btn-secondary !px-2 !py-1 !text-xs"
                    >
                      Reject
                    </button>
                  </form>
                </div>
              )}
            </li>
          ))}
      </ul>
      )}
      {workspaceId && (
        <form
          action={requestApproval}
          className="tk-card mt-8 max-w-md space-y-2 p-6"
        >
          <h2 className="text-base font-semibold text-zinc-900">
            Ajukan approval
          </h2>
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <select name="kind" className="w-full tk-input text-sm">
            <option value="expense">Expense</option>
            <option value="refund">Refund</option>
            <option value="bank_change">Bank change</option>
          </select>
          <input
            name="entityId"
            required
            placeholder="Entity ID"
            className="w-full tk-input text-sm"
          />
          <input
            name="note"
            placeholder="Catatan"
            className="w-full tk-input text-sm"
          />
          <button
            type="submit"
            className="tk-btn"
          >
            Submit
          </button>
        </form>
      )}
    </>
  );
}
