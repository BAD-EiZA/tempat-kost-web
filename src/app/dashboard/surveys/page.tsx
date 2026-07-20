import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { apiFetch, listProperties, listWorkspaces } from '@/lib/api';
import {
  EmptyState,
  PageHeader,
  StatusBadge,
  WorkspaceChips,
} from '@/components/ui';
import { formatDateId } from '@/lib/format';

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
      <PageHeader
        title="Survey calon penyewa"
        description="Jadwalkan kunjungan survey ke properti."
      />
      {workspaces.length > 0 && (
        <WorkspaceChips
          workspaces={workspaces}
          workspaceId={workspaceId}
          hrefFor={(id) => `/dashboard/surveys?workspaceId=${id}`}
        />
      )}
      {error && (
        <div className="tk-alert mt-4" data-variant="warning">
          {error}
        </div>
      )}

      {surveys.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="Belum ada jadwal survey"
          body="Buat jadwal dari form di bawah."
        />
      ) : (
        <ul className="mt-6 space-y-2">
          {surveys.map((s) => (
            <li
              key={s.id}
              className="tk-card flex flex-wrap items-center justify-between gap-2 px-5 py-4 text-sm"
            >
              <div>
                <p className="font-semibold text-zinc-900">
                  {formatDateId(s.scheduledAt)}
                  <span className="ml-2 text-xs font-normal text-zinc-500">
                    {String(s.scheduledAt).slice(11, 16)}
                  </span>
                </p>
                {s.staffNote ? (
                  <p className="mt-1 text-xs text-zinc-500">{s.staffNote}</p>
                ) : null}
              </div>
              <StatusBadge status={s.status} kind="survey" />
            </li>
          ))}
        </ul>
      )}

      {workspaceId && (
        <form
          action={createSurvey}
          className="tk-card mt-8 max-w-lg space-y-3 p-6"
        >
          <h2 className="text-base font-semibold text-zinc-900">
            Jadwalkan survey
          </h2>
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <label className="tk-field">
            <span className="tk-label">Waktu</span>
            <input
              name="scheduledAt"
              type="datetime-local"
              required
              className="tk-input"
            />
          </label>
          <label className="tk-field">
            <span className="tk-label">Properti</span>
            <select name="propertyId" className="tk-select">
              <option value="">Tanpa properti</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="tk-field">
            <span className="tk-label">Prospect</span>
            <select name="prospectId" className="tk-select">
              <option value="">Tanpa prospect</option>
              {prospects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName}
                </option>
              ))}
            </select>
          </label>
          <label className="tk-field">
            <span className="tk-label">Catatan</span>
            <input name="staffNote" className="tk-input" />
          </label>
          <button type="submit" className="tk-btn">
            Simpan
          </button>
        </form>
      )}
    </>
  );
}
