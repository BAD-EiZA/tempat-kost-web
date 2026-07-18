import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { apiFetch, listProperties, listRooms, listWorkspaces } from '@/lib/api';

async function createBooking(formData: FormData) {
  'use server';
  await requireAuth();
  const workspaceId = String(formData.get('workspaceId') ?? '');
  const propertyId = String(formData.get('propertyId') ?? '');
  if (!workspaceId || !propertyId) return;
  await apiFetch('/v1/crm/bookings', {
    method: 'POST',
    body: JSON.stringify({
      workspaceId,
      propertyId,
      roomId: String(formData.get('roomId') ?? '') || undefined,
      prospectId: String(formData.get('prospectId') ?? '') || undefined,
      feeAmount: Number(formData.get('feeAmount') ?? 0) || 0,
      holdDays: Number(formData.get('holdDays') ?? 3) || 3,
    }),
  });
  redirect(`/dashboard/crm/bookings?workspaceId=${workspaceId}`);
}

async function feeInvoice(formData: FormData) {
  'use server';
  await requireAuth();
  const id = String(formData.get('id') ?? '');
  const workspaceId = String(formData.get('workspaceId') ?? '');
  if (!id) return;
  await apiFetch(`/v1/crm/bookings/${id}/fee-invoice`, { method: 'POST' });
  redirect(`/dashboard/crm/bookings?workspaceId=${workspaceId}`);
}

async function markPaid(formData: FormData) {
  'use server';
  await requireAuth();
  const id = String(formData.get('id') ?? '');
  const workspaceId = String(formData.get('workspaceId') ?? '');
  if (!id) return;
  await apiFetch(`/v1/crm/bookings/${id}/mark-paid`, { method: 'POST' });
  redirect(`/dashboard/crm/bookings?workspaceId=${workspaceId}`);
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ workspaceId?: string }>;
}) {
  await requireAuth();
  const { workspaceId: qWs } = await searchParams;
  let workspaces: Awaited<ReturnType<typeof listWorkspaces>> = [];
  let workspaceId = qWs ?? '';
  let bookings: Array<{
    id: string;
    status: string;
    feeAmount: string | number;
    feeInvoiceId: string | null;
    holdUntil: string;
    property?: { name: string };
    prospect?: { fullName: string } | null;
  }> = [];
  let properties: Awaited<ReturnType<typeof listProperties>> = [];
  let rooms: Awaited<ReturnType<typeof listRooms>> = [];
  let prospects: Array<{ id: string; fullName: string }> = [];
  let error: string | null = null;

  try {
    workspaces = await listWorkspaces();
    if (!workspaceId && workspaces[0]) workspaceId = workspaces[0].id;
    if (workspaceId) {
      [bookings, properties, rooms, prospects] = await Promise.all([
        apiFetch<typeof bookings>(
          `/v1/crm/bookings?workspaceId=${workspaceId}`,
        ),
        listProperties(workspaceId),
        listRooms(workspaceId),
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Booking / hold</h1>
        <Link
          href={`/dashboard/crm?workspaceId=${workspaceId}`}
          className="text-sm underline"
        >
          ← Prospect
        </Link>
      </div>
      {error && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
          {error}
        </div>
      )}
      <ul className="mt-6 divide-y rounded-xl border bg-white">
        {bookings.map((b) => (
          <li
            key={b.id}
            className="flex flex-wrap items-center justify-between gap-2 px-6 py-3 text-sm"
          >
            <div>
              <p className="font-medium">
                {b.property?.name} · {b.prospect?.fullName ?? '—'}
              </p>
              <p className="text-xs text-zinc-500">
                {b.status} · fee Rp {Number(b.feeAmount).toLocaleString('id-ID')} ·
                hold until {String(b.holdUntil).slice(0, 10)}
                {b.feeInvoiceId ? ` · inv ${b.feeInvoiceId.slice(0, 8)}…` : ''}
              </p>
            </div>
            <div className="flex gap-1">
              {!b.feeInvoiceId && Number(b.feeAmount) > 0 && (
                <form action={feeInvoice}>
                  <input type="hidden" name="id" value={b.id} />
                  <input type="hidden" name="workspaceId" value={workspaceId} />
                  <button
                    type="submit"
                    className="rounded bg-zinc-900 px-2 py-1 text-xs text-white"
                  >
                    Buat invoice fee
                  </button>
                </form>
              )}
              {b.status !== 'PAID' && b.status !== 'CONVERTED' && (
                <form action={markPaid}>
                  <input type="hidden" name="id" value={b.id} />
                  <input type="hidden" name="workspaceId" value={workspaceId} />
                  <button type="submit" className="rounded border px-2 py-1 text-xs">
                    Mark paid
                  </button>
                </form>
              )}
            </div>
          </li>
        ))}
      </ul>
      {workspaceId && properties.length > 0 && (
        <form
          action={createBooking}
          className="mt-8 max-w-lg space-y-2 rounded-xl border bg-white p-6"
        >
          <h2 className="font-medium">Buat hold</h2>
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <select name="propertyId" required className="w-full rounded border px-3 py-2 text-sm">
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select name="roomId" className="w-full rounded border px-3 py-2 text-sm">
            <option value="">— Kamar —</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
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
            name="feeAmount"
            type="number"
            placeholder="Booking fee"
            className="w-full rounded border px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white">
            Simpan hold
          </button>
        </form>
      )}
    </>
  );
}
