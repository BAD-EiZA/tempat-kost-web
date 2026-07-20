import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { apiFetch, listWorkspaces } from '@/lib/api';
import {
  PageHeader,
  StatusBadge,
  WorkspaceChips,
} from '@/components/ui';

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
      <PageHeader
        title="Inspeksi"
        description="Template checklist dan catatan inspeksi kamar."
      />
      {workspaces.length > 0 && (
        <WorkspaceChips
          workspaces={workspaces}
          workspaceId={workspaceId}
          hrefFor={(id) => `/dashboard/inspections?workspaceId=${id}`}
        />
      )}
      {error && (
        <div className="tk-alert mt-4" data-variant="warning">
          {error}
        </div>
      )}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="tk-card p-5">
          <h2 className="text-base font-semibold text-zinc-900">Template</h2>
          {templates.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">Belum ada template.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {templates.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-2 border-b border-zinc-100 py-2 last:border-0"
                >
                  <span className="font-medium text-zinc-900">{t.name}</span>
                  <span className="text-xs text-zinc-500">{t.kind}</span>
                </li>
              ))}
            </ul>
          )}
          {workspaceId && (
            <form action={createTemplate} className="mt-3 flex gap-2">
              <input type="hidden" name="workspaceId" value={workspaceId} />
              <input
                name="name"
                required
                placeholder="Nama template"
                className="tk-input flex-1 !px-2 !py-1 !text-sm"
              />
              <select name="kind" className="tk-input !px-2 !py-1 !text-sm">
                <option value="pre_checkin">Pre check-in</option>
                <option value="routine">Routine</option>
                <option value="checkout">Check-out</option>
              </select>
              <button type="submit" className="tk-btn-sm">
                +
              </button>
            </form>
          )}
        </section>
        <section className="tk-card p-5">
          <h2 className="text-base font-semibold text-zinc-900">Inspeksi</h2>
          {inspections.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500">Belum ada inspeksi.</p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm">
              {inspections.map((i) => (
                <li
                  key={i.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 py-2 last:border-0"
                >
                  <span className="font-medium text-zinc-900">
                    {i.template?.name ?? i.kind}
                  </span>
                  <StatusBadge status={i.status} kind="survey" />
                </li>
              ))}
            </ul>
          )}
          {workspaceId && (
            <form action={createInspection} className="mt-3 space-y-2">
              <input type="hidden" name="workspaceId" value={workspaceId} />
              <select name="templateId" className="tk-select w-full">
                <option value="">Tanpa template</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <input
                name="notes"
                placeholder="Catatan"
                className="tk-input w-full"
              />
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" name="complete" /> Selesai
              </label>
              <button type="submit" className="tk-btn-sm">
                Buat inspeksi
              </button>
            </form>
          )}
        </section>
      </div>
    </>
  );
}
