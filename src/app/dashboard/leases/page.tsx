import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import {
  apiFetch,
  createLease,
  listLeases,
  listProperties,
  listRooms,
  listTenants,
  listWorkspaces,
} from '@/lib/api';
import { CreateLeaseForm } from './create-lease-form';

function formatIdr(n: string | number) {
  const v = typeof n === 'string' ? Number(n) : n;
  if (Number.isNaN(v)) return String(n);
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(v);
}

async function createLeaseAction(formData: FormData) {
  'use server';
  await requireAuth();
  const workspaceId = String(formData.get('workspaceId') ?? '');
  const propertyId = String(formData.get('propertyId') ?? '');
  const roomId = String(formData.get('roomId') ?? '');
  const tenantId = String(formData.get('tenantId') ?? '');
  const startDate = String(formData.get('startDate') ?? '');
  const endDate = String(formData.get('endDate') ?? '').trim() || undefined;
  const rentAmount = Number(formData.get('rentAmount') ?? 0);
  const depositAmount = Number(formData.get('depositAmount') ?? 0);
  if (!workspaceId || !propertyId || !roomId || !tenantId || !startDate) return;
  await createLease({
    workspaceId,
    propertyId,
    roomId,
    tenantId,
    startDate,
    endDate,
    rentAmount: Number.isFinite(rentAmount) ? rentAmount : 0,
    depositAmount: Number.isFinite(depositAmount) ? depositAmount : 0,
  });
  redirect(`/dashboard/leases?workspaceId=${workspaceId}`);
}

async function activateAction(formData: FormData) {
  'use server';
  await requireAuth();
  const id = String(formData.get('id') ?? '');
  const workspaceId = String(formData.get('workspaceId') ?? '');
  if (!id) return;
  await apiFetch(`/v1/leases/${id}/activate`, {
    method: 'POST',
    body: JSON.stringify({
      identityVerified: formData.get('identityVerified') === 'on',
      contractSigned: formData.get('contractSigned') === 'on',
      depositRecorded: formData.get('depositRecorded') === 'on',
      keysHanded: formData.get('keysHanded') === 'on',
      rulesAccepted: formData.get('rulesAccepted') === 'on',
      roomConditionNotes:
        String(formData.get('roomConditionNotes') ?? '') || undefined,
      meterInitial: Number(formData.get('meterInitial') ?? 0) || undefined,
    }),
  });
  redirect(`/dashboard/leases?workspaceId=${workspaceId}`);
}

async function endAction(formData: FormData) {
  'use server';
  await requireAuth();
  const id = String(formData.get('id') ?? '');
  const workspaceId = String(formData.get('workspaceId') ?? '');
  if (!id) return;
  await apiFetch(`/v1/leases/${id}/end`, {
    method: 'POST',
    body: JSON.stringify({
      keysReturned: formData.get('keysReturned') === 'on',
      inspectionNotes:
        String(formData.get('inspectionNotes') ?? '') || undefined,
      meterFinal: Number(formData.get('meterFinal') ?? 0) || undefined,
      damageCost: Number(formData.get('damageCost') ?? 0) || 0,
      depositSettlement:
        String(formData.get('depositSettlement') ?? '') || undefined,
    }),
  });
  redirect(`/dashboard/leases?workspaceId=${workspaceId}`);
}

async function generateContractAction(formData: FormData) {
  'use server';
  await requireAuth();
  const leaseId = String(formData.get('leaseId') ?? '');
  const workspaceId = String(formData.get('workspaceId') ?? '');
  if (!leaseId) return;
  const doc = await apiFetch<{ id: string; signToken: string | null }>(
    '/v1/contracts/generate',
    {
      method: 'POST',
      body: JSON.stringify({ leaseId }),
    },
  );
  redirect(
    `/dashboard/leases?workspaceId=${workspaceId}&signToken=${doc.signToken ?? ''}&contractId=${doc.id}`,
  );
}

export default async function LeasesPage({
  searchParams,
}: {
  searchParams: Promise<{
    workspaceId?: string;
    signToken?: string;
    contractId?: string;
  }>;
}) {
  await requireAuth();
  const { workspaceId: qWs, signToken, contractId } = await searchParams;

  let workspaces: Awaited<ReturnType<typeof listWorkspaces>> = [];
  let leases: Awaited<ReturnType<typeof listLeases>> = [];
  let properties: Awaited<ReturnType<typeof listProperties>> = [];
  let rooms: Awaited<ReturnType<typeof listRooms>> = [];
  let tenants: Awaited<ReturnType<typeof listTenants>> = [];
  let error: string | null = null;
  let workspaceId = qWs ?? '';

  try {
    workspaces = await listWorkspaces();
    if (!workspaceId && workspaces[0]) workspaceId = workspaces[0].id;
    if (workspaceId) {
      [leases, properties, rooms, tenants] = await Promise.all([
        listLeases(workspaceId),
        listProperties(workspaceId),
        listRooms(workspaceId),
        listTenants(workspaceId),
      ]);
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Gagal memuat kontrak';
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <h1 className="text-2xl font-semibold">Kontrak</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Draft → generate e-sign → aktifkan → akhiri.
      </p>
      {signToken && (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
          Kontrak dibuat{contractId ? ` (${contractId.slice(0, 8)}…)` : ''}.{' '}
          Link e-sign:{' '}
          <a
            href={`/sign/${signToken}`}
            className="font-medium underline"
            target="_blank"
            rel="noreferrer"
          >
            /sign/{signToken.slice(0, 12)}…
          </a>
        </div>
      )}

      {workspaces.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/dashboard/leases?workspaceId=${ws.id}`}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                ws.id === workspaceId
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-700'
              }`}
            >
              {ws.name}
            </Link>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
          {error}
        </div>
      )}

      <ul className="mt-6 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
        {leases.length === 0 ? (
          <li className="p-6 text-sm text-zinc-600">Belum ada kontrak.</li>
        ) : (
          leases.map((l) => (
            <li key={l.id} className="px-6 py-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {l.leaseNumber}{' '}
                    <span className="text-xs font-normal text-zinc-500">
                      {l.status}
                    </span>
                  </p>
                  <p className="text-xs text-zinc-500">
                    {l.tenant?.fullName} · {l.property?.name} / {l.room?.name} ·{' '}
                    {formatIdr(l.rentAmount)}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {String(l.startDate).slice(0, 10)}
                    {l.endDate ? ` → ${String(l.endDate).slice(0, 10)}` : ''}
                  </p>
                  <form action={generateContractAction} className="mt-1">
                    <input type="hidden" name="leaseId" value={l.id} />
                    <input type="hidden" name="workspaceId" value={workspaceId} />
                    <button
                      type="submit"
                      className="text-[10px] font-medium underline"
                    >
                      Generate kontrak + e-sign link
                    </button>
                  </form>
                </div>
                <div className="flex gap-2">
                  {l.status === 'DRAFT' ||
                  l.status === 'UPCOMING' ||
                  l.status === 'PENDING_SIGNATURE' ? (
                    <form
                      action={activateAction}
                      className="flex max-w-xs flex-col gap-1 text-[10px] text-zinc-600"
                    >
                      <input type="hidden" name="id" value={l.id} />
                      <input
                        type="hidden"
                        name="workspaceId"
                        value={workspaceId}
                      />
                      <label className="flex items-center gap-1">
                        <input type="checkbox" name="identityVerified" defaultChecked /> ID
                      </label>
                      <label className="flex items-center gap-1">
                        <input type="checkbox" name="contractSigned" defaultChecked /> Kontrak
                      </label>
                      <label className="flex items-center gap-1">
                        <input type="checkbox" name="depositRecorded" defaultChecked /> Deposit
                      </label>
                      <label className="flex items-center gap-1">
                        <input type="checkbox" name="keysHanded" defaultChecked /> Kunci
                      </label>
                      <label className="flex items-center gap-1">
                        <input type="checkbox" name="rulesAccepted" defaultChecked /> Peraturan
                      </label>
                      <input
                        name="meterInitial"
                        type="number"
                        step="0.01"
                        placeholder="Meter awal"
                        className="rounded border px-1 py-0.5"
                      />
                      <button
                        type="submit"
                        className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white"
                      >
                        Check-in / Aktifkan
                      </button>
                    </form>
                  ) : null}
                  {(l.status === 'ACTIVE' || l.status === 'ENDING_SOON') && (
                    <form
                      action={endAction}
                      className="flex max-w-xs flex-col gap-1 text-[10px] text-zinc-600"
                    >
                      <input type="hidden" name="id" value={l.id} />
                      <input
                        type="hidden"
                        name="workspaceId"
                        value={workspaceId}
                      />
                      <label className="flex items-center gap-1">
                        <input type="checkbox" name="keysReturned" defaultChecked /> Kunci kembali
                      </label>
                      <input
                        name="meterFinal"
                        type="number"
                        step="0.01"
                        placeholder="Meter akhir"
                        className="rounded border px-1 py-0.5"
                      />
                      <input
                        name="damageCost"
                        type="number"
                        placeholder="Biaya rusak"
                        className="rounded border px-1 py-0.5"
                      />
                      <input
                        name="depositSettlement"
                        placeholder="Catatan deposit"
                        className="rounded border px-1 py-0.5"
                      />
                      <button
                        type="submit"
                        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium"
                      >
                        Akhiri
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </li>
          ))
        )}
      </ul>

      {workspaceId &&
        properties.length > 0 &&
        tenants.length > 0 &&
        rooms.length > 0 && (
          <CreateLeaseForm
            workspaceId={workspaceId}
            properties={properties}
            rooms={rooms}
            tenants={tenants}
            today={today}
            action={createLeaseAction}
          />
        )}

      {workspaceId && (properties.length === 0 || tenants.length === 0 || rooms.length === 0) && (
        <p className="mt-6 text-sm text-zinc-600">
          Butuh minimal 1 properti, 1 kamar, dan 1 penyewa sebelum buat kontrak.
        </p>
      )}
    </>
  );
}
