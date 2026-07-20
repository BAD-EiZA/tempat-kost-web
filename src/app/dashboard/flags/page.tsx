import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { apiFetch, listWorkspaces } from '@/lib/api';
import { PageHeader, WorkspaceChips } from '@/components/ui';

const DEFAULT_FLAGS = [
  'ai_ocr',
  'ai_smart_search',
  'midtrans',
  'public_page',
  'whatsapp_cta',
  'custom_roles',
];

async function toggleFlag(formData: FormData) {
  'use server';
  await requireAuth();
  const workspaceId = String(formData.get('workspaceId') ?? '');
  const key = String(formData.get('key') ?? '');
  const enabled = formData.get('enabled') === 'true';
  if (!workspaceId || !key) return;
  await apiFetch('/v1/ops/feature-flags', {
    method: 'POST',
    body: JSON.stringify({ workspaceId, key, enabled }),
  });
  redirect(`/dashboard/flags?workspaceId=${workspaceId}`);
}

export default async function FlagsPage({
  searchParams,
}: {
  searchParams: Promise<{ workspaceId?: string }>;
}) {
  await requireAuth();
  const { workspaceId: qWs } = await searchParams;
  let workspaces: Awaited<ReturnType<typeof listWorkspaces>> = [];
  let workspaceId = qWs ?? '';
  let flags: Array<{ key: string; enabled: boolean }> = [];
  let error: string | null = null;

  try {
    workspaces = await listWorkspaces();
    if (!workspaceId && workspaces[0]) workspaceId = workspaces[0].id;
    if (workspaceId) {
      flags = await apiFetch<typeof flags>(
        `/v1/ops/feature-flags?workspaceId=${workspaceId}`,
      );
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Gagal';
  }

  const map = new Map(flags.map((f) => [f.key, f.enabled]));

  return (
    <>
      <PageHeader
        title="Feature flags"
        description="Aktifkan atau nonaktifkan modul per workspace."
      />
      {workspaces.length > 0 && (
        <WorkspaceChips
          workspaces={workspaces}
          workspaceId={workspaceId}
          hrefFor={(id) => `/dashboard/flags?workspaceId=${id}`}
        />
      )}
      {error && (
        <div className="tk-alert mt-4" data-variant="warning">
          {error}
        </div>
      )}
      <ul className="mt-6 space-y-2">
        {DEFAULT_FLAGS.map((key) => {
          const enabled = map.get(key) ?? true;
          return (
            <li
              key={key}
              className="tk-card flex items-center justify-between px-5 py-3 text-sm"
            >
              <span className="font-mono text-xs text-zinc-700">{key}</span>
              <form action={toggleFlag}>
                <input type="hidden" name="workspaceId" value={workspaceId} />
                <input type="hidden" name="key" value={key} />
                <input
                  type="hidden"
                  name="enabled"
                  value={enabled ? 'false' : 'true'}
                />
                <button
                  type="submit"
                  className={
                    enabled
                      ? 'tk-btn-sm'
                      : 'tk-btn-secondary !px-3 !py-1 !text-xs'
                  }
                >
                  {enabled ? 'ON' : 'OFF'}
                </button>
              </form>
            </li>
          );
        })}
      </ul>
    </>
  );
}
