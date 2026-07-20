import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { apiFetch, listProperties, listRooms, listWorkspaces } from '@/lib/api';
import {
  EmptyState,
  PageHeader,
  StatusBadge,
  WorkspaceChips,
} from '@/components/ui';
import { formatDateId, formatIdr } from '@/lib/format';

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
      <PageHeader
        title="Booking / hold"
        description="Tahan kamar untuk prospect dengan fee opsional."
        actions={
          <Link
            href={`/dashboard/crm?workspaceId=${workspaceId}`}
            className="text-sm font-medium text-emerald-800 underline-offset-2 hover:underline"
          >
            Prospect CRM
          </Link>
        }
      />
      {workspaces.length > 0 && (
        <WorkspaceChips
          workspaces={workspaces}
          workspaceId={workspaceId}
          hrefFor={(id) => `/dashboard/crm/bookings?workspaceId=${id}`}
        />
      )}
      {error && (
        <div className="tk-alert mt-4" data-variant="warning">
          {error}
        </div>
      )}

      {bookings.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="Belum ada hold"
          body="Buat hold dari form di bawah setelah ada properti dan prospect."
        />
      ) : (
        <ul className="mt-6 space-y-2">
          {bookings.map((b) => (
            <li
              key={b.id}
              className="tk-card flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-zinc-900">
                    {b.property?.name ?? 'Properti'}
                  </p>
                  <StatusBadge status={b.status} kind="booking" />
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {b.prospect?.fullName ?? 'Tanpa prospect'} · fee{' '}
                  {formatIdr(Number(b.feeAmount))} · hold sampai{' '}
                  {formatDateId(b.holdUntil)}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                {!b.feeInvoiceId && Number(b.feeAmount) > 0 && (
                  <form action={feeInvoice}>
                    <input type="hidden" name="id" value={b.id} />
                    <input type="hidden" name="workspaceId" value={workspaceId} />
                    <button type="submit" className="tk-btn-sm">
                      Buat invoice fee
                    </button>
                  </form>
                )}
                {b.status !== 'PAID' && b.status !== 'CONVERTED' && (
                  <form action={markPaid}>
                    <input type="hidden" name="id" value={b.id} />
                    <input type="hidden" name="workspaceId" value={workspaceId} />
                    <button
                      type="submit"
                      className="tk-btn-secondary !px-2.5 !py-1 !text-xs"
                    >
                      Mark paid
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {workspaceId && properties.length > 0 && (
        <form
          action={createBooking}
          className="tk-card mt-8 max-w-lg space-y-3 p-6"
        >
          <h2 className="text-base font-semibold text-zinc-900">Buat hold</h2>
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <label className="tk-field">
            <span className="tk-label">Properti</span>
            <select name="propertyId" required className="tk-select">
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="tk-field">
            <span className="tk-label">Kamar (opsional)</span>
            <select name="roomId" className="tk-select">
              <option value="">Tanpa kamar</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <label className="tk-field">
            <span className="tk-label">Prospect (opsional)</span>
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
            <span className="tk-label">Booking fee (Rp)</span>
            <input
              name="feeAmount"
              type="number"
              min={0}
              className="tk-input"
            />
          </label>
          <button type="submit" className="tk-btn">
            Simpan hold
          </button>
        </form>
      )}
    </>
  );
}
