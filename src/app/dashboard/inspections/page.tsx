import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { apiFetch, listWorkspaces } from '@/lib/api';

async function createTemplate(formData: FormData) {
  'use server';
  await requireAuth();
  const workspaceId = String(formData.get('workspaceId') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  if (!workspaceId || !name) return;
  await apiFetch('/v1/ops/inspection-templates', {
    method: 'POST',
    body: JSON.stringify({
      workspaceId,
      name,
      kind: String(formData.get('kind') ?? 'routine'),
      items: [
        { label: 'Dinding', requiredPhoto: false },
        { label: 'Lantai', requiredPhoto: false },
        { label: 'Kamar mandi', requiredPhoto: true },
        { label: 'Furnitur', requiredPhoto: false },
      ],
    }),
  });
  redirect(`/dashboard/inspections?workspaceId=${workspaceId}`);
}

async function createInspection(formData: FormData) {
  'use server';
  await requireAuth();
  const workspaceId = String(formData.get('workspaceId') ?? '');
  const templateId = String(formData.get('templateId') ?? '') || undefined;
  if (!workspaceId) return;
  await apiFetch('/v1/ops/inspections', {
    method: 'POST',
    body: JSON.stringify({
      workspaceId,
      templateId,
      kind: String(formData.get('kind') ?? 'routine'),
      notes: String(formData.get('notes') ?? '') || undefined,
      complete: formData.get('complete') === 'on',
      result: { pass: true },
    }),
  });
  redirect(`/dashboard/inspections?workspaceId=${workspaceId}`);
}

export default async function InspectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ workspaceId?: string }>;
}) {
  await requireAuth();
  const { workspaceId: qWs } = await searchParams;
  let workspaces: Awaited<ReturnType<typeof listWorkspaces>> = [];
  let workspaceId = qWs ?? '';
  let templates: Array<{ id: string; name: string; kind: string }> = [];
  let inspections: Array<{
    id: string;
    kind: string;
    status: string;
    template?: { name: string } | null;
  }> = [];
  let error: string | null = null;

  try {
    workspaces = await listWorkspaces();
    if (!workspaceId && workspaces[0]) workspaceId = workspaces[0].id;
    if (workspaceId) {
      [templates, inspections] = await Promise.all([
        apiFetch<typeof templates>(
          `/v1/ops/inspection-templates?workspaceId=${workspaceId}`,
        ),
        apiFetch<typeof inspections>(
          `/v1/ops/inspections?workspaceId=${workspaceId}`,
        ),
      ]);
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Gagal';
  }

  return (
    <>
      <h1 className="text-2xl font-semibold">Inspeksi</h1>
      {workspaces.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/dashboard/inspections?workspaceId=${ws.id}`}
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
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-white p-5">
          <h2 className="font-medium">Template</h2>
          <ul className="mt-2 text-sm">
            {templates.map((t) => (
              <li key={t.id}>
                {t.name}{' '}
                <span className="text-xs text-zinc-500">{t.kind}</span>
              </li>
            ))}
          </ul>
          {workspaceId && (
            <form action={createTemplate} className="mt-3 flex gap-2">
              <input type="hidden" name="workspaceId" value={workspaceId} />
              <input
                name="name"
                required
                placeholder="Nama template"
                className="flex-1 rounded border px-2 py-1 text-sm"
              />
              <select name="kind" className="rounded border px-2 py-1 text-sm">
                <option value="pre_checkin">Pre check-in</option>
                <option value="routine">Routine</option>
                <option value="checkout">Check-out</option>
              </select>
              <button type="submit" className="rounded bg-zinc-900 px-3 py-1 text-sm text-white">
                +
              </button>
            </form>
          )}
        </section>
        <section className="rounded-xl border bg-white p-5">
          <h2 className="font-medium">Inspeksi</h2>
          <ul className="mt-2 text-sm">
            {inspections.map((i) => (
              <li key={i.id}>
                {i.template?.name ?? i.kind} · {i.status}
              </li>
            ))}
          </ul>
          {workspaceId && (
            <form action={createInspection} className="mt-3 space-y-2">
              <input type="hidden" name="workspaceId" value={workspaceId} />
              <select name="templateId" className="w-full rounded border px-2 py-1 text-sm">
                <option value="">— Tanpa template —</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <input
                name="notes"
                placeholder="Catatan"
                className="w-full rounded border px-2 py-1 text-sm"
              />
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" name="complete" /> Selesai
              </label>
              <button type="submit" className="rounded bg-zinc-900 px-3 py-1 text-sm text-white">
                Buat inspeksi
              </button>
            </form>
          )}
        </section>
      </div>
    </>
  );
}
