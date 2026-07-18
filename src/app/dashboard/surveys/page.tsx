import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { apiFetch, listProperties, listWorkspaces } from '@/lib/api';

async function createSurvey(formData: FormData) {
  'use server';
  await requireAuth();
  const workspaceId = String(formData.get('workspaceId') ?? '');
  const scheduledAt = String(formData.get('scheduledAt') ?? '');
  if (!workspaceId || !scheduledAt) return;
  await apiFetch('/v1/ops/surveys', {
    method: 'POST',
    body: JSON.stringify({
      workspaceId,
      scheduledAt: new Date(scheduledAt).toISOString(),
      propertyId: String(formData.get('propertyId') ?? '') || undefined,
      prospectId: String(formData.get('prospectId') ?? '') || undefined,
      staffNote: String(formData.get('staffNote') ?? '') || undefined,
    }),
  });
  redirect(`/dashboard/surveys?workspaceId=${workspaceId}`);
}

export default async function SurveysPage({
  searchParams,
}: {
  searchParams: Promise<{ workspaceId?: string }>;
}) {
  await requireAuth();
  const { workspaceId: qWs } = await searchParams;
  let workspaces: Awaited<ReturnType<typeof listWorkspaces>> = [];
  let properties: Awaited<ReturnType<typeof listProperties>> = [];
  let surveys: Array<{
    id: string;
    scheduledAt: string;
    status: string;
    staffNote: string | null;
  }> = [];
  let prospects: Array<{ id: string; fullName: string }> = [];
  let workspaceId = qWs ?? '';
  let error: string | null = null;

  try {
    workspaces = await listWorkspaces();
    if (!workspaceId && workspaces[0]) workspaceId = workspaces[0].id;
    if (workspaceId) {
      [surveys, properties, prospects] = await Promise.all([
        apiFetch<typeof surveys>(
          `/v1/ops/surveys?workspaceId=${workspaceId}`,
        ),
        listProperties(workspaceId),
        apiFetch<typeof prospects>(
          `/v1/crm/prospects?workspaceId=${workspaceId}`,
        ),
      ]);
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Gagal';
  }

  return (
    <>
      <h1 className="text-2xl font-semibold">Survey calon penyewa</h1>
      {workspaces.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/dashboard/surveys?workspaceId=${ws.id}`}
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
        {surveys.length === 0 ? (
          <li className="p-6 text-sm text-zinc-500">Belum ada jadwal survey.</li>
        ) : (
          surveys.map((s) => (
            <li key={s.id} className="px-6 py-3 text-sm">
              {String(s.scheduledAt).slice(0, 16).replace('T', ' ')} · {s.status}
              {s.staffNote ? ` · ${s.staffNote}` : ''}
            </li>
          ))
        )}
      </ul>
      {workspaceId && (
        <form action={createSurvey} className="mt-8 max-w-lg space-y-3 rounded-xl border bg-white p-6">
          <h2 className="font-medium">Jadwalkan survey</h2>
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <input
            name="scheduledAt"
            type="datetime-local"
            required
            className="w-full rounded border px-3 py-2 text-sm"
          />
          <select name="propertyId" className="w-full rounded border px-3 py-2 text-sm">
            <option value="">— Properti —</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select name="prospectId" className="w-full rounded border px-3 py-2 text-sm">
            <option value="">— Prospect —</option>
            {prospects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName}
              </option>
            ))}
          </select>
          <input
            name="staffNote"
            placeholder="Catatan"
            className="w-full rounded border px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white">
            Simpan
          </button>
        </form>
      )}
    </>
  );
}
