import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { apiFetch, listProperties, listWorkspaces } from '@/lib/api';

async function createMeter(formData: FormData) {
  'use server';
  await requireAuth();
  const workspaceId = String(formData.get('workspaceId') ?? '');
  const propertyId = String(formData.get('propertyId') ?? '');
  const label = String(formData.get('label') ?? '').trim();
  if (!workspaceId || !propertyId || !label) return;
  await apiFetch('/v1/meters', {
    method: 'POST',
    body: JSON.stringify({
      workspaceId,
      propertyId,
      label,
      meterNumber: String(formData.get('meterNumber') ?? '') || undefined,
    }),
  });
  redirect(`/dashboard/meters?workspaceId=${workspaceId}`);
}

async function recordReading(formData: FormData) {
  'use server';
  await requireAuth();
  const workspaceId = String(formData.get('workspaceId') ?? '');
  const meterId = String(formData.get('meterId') ?? '');
  const periodLabel = String(formData.get('periodLabel') ?? '');
  const previousReading = Number(formData.get('previousReading') ?? 0);
  const currentReading = Number(formData.get('currentReading') ?? 0);
  if (!meterId || !periodLabel) return;
  await apiFetch('/v1/meter-readings', {
    method: 'POST',
    body: JSON.stringify({
      meterId,
      periodLabel,
      previousReading,
      currentReading,
    }),
  });
  redirect(`/dashboard/meters?workspaceId=${workspaceId}`);
}

async function verifyAndBill(formData: FormData) {
  'use server';
  await requireAuth();
  const workspaceId = String(formData.get('workspaceId') ?? '');
  const readingId = String(formData.get('readingId') ?? '');
  if (!readingId) return;
  await apiFetch(`/v1/meter-readings/${readingId}/verify`, { method: 'POST' });
  await apiFetch('/v1/utilities/bills/from-reading', {
    method: 'POST',
    body: JSON.stringify({ readingId }),
  });
  redirect(`/dashboard/meters?workspaceId=${workspaceId}`);
}

export default async function MetersPage({
  searchParams,
}: {
  searchParams: Promise<{ workspaceId?: string }>;
}) {
  await requireAuth();
  const { workspaceId: qWs } = await searchParams;
  let workspaces: Awaited<ReturnType<typeof listWorkspaces>> = [];
  let properties: Awaited<ReturnType<typeof listProperties>> = [];
  let meters: Array<{
    id: string;
    label: string;
    meterNumber: string | null;
    property?: { name: string };
    readings?: Array<{
      id: string;
      periodLabel: string;
      consumption: string | number;
      status: string;
    }>;
  }> = [];
  let workspaceId = qWs ?? '';
  let error: string | null = null;

  try {
    workspaces = await listWorkspaces();
    if (!workspaceId && workspaces[0]) workspaceId = workspaces[0].id;
    if (workspaceId) {
      [meters, properties] = await Promise.all([
        apiFetch<typeof meters>(`/v1/meters?workspaceId=${workspaceId}`),
        listProperties(workspaceId),
      ]);
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Gagal memuat meter';
  }

  const period = new Date().toISOString().slice(0, 7);

  return (
    <>
      <h1 className="text-2xl font-semibold">Meter listrik</h1>
      {workspaces.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/dashboard/meters?workspaceId=${ws.id}`}
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

      <ul className="mt-6 space-y-4">
        {meters.map((m) => (
          <li key={m.id} className="rounded-xl border bg-white p-5 text-sm">
            <p className="font-medium">
              {m.label}{' '}
              <span className="text-xs text-zinc-500">
                {m.property?.name} · {m.meterNumber ?? '—'}
              </span>
            </p>
            {m.readings?.[0] && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-600">
                <span>
                  Last: {m.readings[0].periodLabel} · {m.readings[0].consumption}{' '}
                  · {m.readings[0].status}
                </span>
                {m.readings[0].status !== 'BILLED' && (
                  <form action={verifyAndBill}>
                    <input type="hidden" name="workspaceId" value={workspaceId} />
                    <input
                      type="hidden"
                      name="readingId"
                      value={m.readings[0].id}
                    />
                    <button
                      type="submit"
                      className="rounded bg-emerald-700 px-2 py-1 text-white"
                    >
                      Verify + buat tagihan
                    </button>
                  </form>
                )}
              </div>
            )}
            <form action={recordReading} className="mt-3 grid gap-2 sm:grid-cols-4">
              <input type="hidden" name="workspaceId" value={workspaceId} />
              <input type="hidden" name="meterId" value={m.id} />
              <input
                name="periodLabel"
                defaultValue={period}
                className="rounded border px-2 py-1 text-xs"
              />
              <input
                name="previousReading"
                type="number"
                step="0.01"
                placeholder="Prev"
                className="rounded border px-2 py-1 text-xs"
              />
              <input
                name="currentReading"
                type="number"
                step="0.01"
                placeholder="Current"
                className="rounded border px-2 py-1 text-xs"
              />
              <button
                type="submit"
                className="rounded bg-zinc-900 px-2 py-1 text-xs text-white"
              >
                Catat
              </button>
            </form>
          </li>
        ))}
      </ul>

      {workspaceId && properties.length > 0 && (
        <form action={createMeter} className="mt-8 rounded-xl border bg-white p-6">
          <h2 className="font-medium">Tambah meter</h2>
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <select name="propertyId" required className="rounded-lg border px-3 py-2 text-sm">
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <input
              name="label"
              required
              placeholder="Label meter"
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <input
              name="meterNumber"
              placeholder="No. meter"
              className="rounded-lg border px-3 py-2 text-sm sm:col-span-2"
            />
          </div>
          <button
            type="submit"
            className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white"
          >
            Simpan
          </button>
        </form>
      )}
    </>
  );
}
