import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { apiFetch, listWorkspaces } from '@/lib/api';

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
      <h1 className="text-2xl font-semibold">Feature flags</h1>
      {workspaces.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/dashboard/flags?workspaceId=${ws.id}`}
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
        {DEFAULT_FLAGS.map((key) => {
          const enabled = map.get(key) ?? true;
          return (
            <li
              key={key}
              className="flex items-center justify-between px-6 py-3 text-sm"
            >
              <span className="font-mono text-xs">{key}</span>
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
                  className={`rounded px-3 py-1 text-xs ${
                    enabled
                      ? 'bg-emerald-700 text-white'
                      : 'border border-zinc-300 text-zinc-600'
                  }`}
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
