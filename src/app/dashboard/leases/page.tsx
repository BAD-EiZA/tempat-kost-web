import { redirect } from 'next/navigation';
import {
  Alert,
  ConfirmSubmitButton,
  EmptyState,
  PageHeader,
  PendingSubmitButton,
  StatusBadge,
  WorkspaceChips,
} from '@/components/ui';
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
import { formatDateId, formatIdr } from '@/lib/format';
import { CreateLeaseForm } from './create-lease-form';

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
      <PageHeader
        title="Kontrak"
        description="Draft, e-sign, aktifkan, lalu akhiri sewa."
      />
      {signToken && (
        <Alert variant="success" className="mt-3">
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
        </Alert>
      )}

      {workspaces.length > 0 && (
        <WorkspaceChips
          workspaces={workspaces}
          workspaceId={workspaceId}
          hrefFor={(id) => `/dashboard/leases?workspaceId=${id}`}
        />
      )}

      {error && (
        <Alert variant="error" className="mt-4">{error}</Alert>
      )}

      {leases.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="Belum ada kontrak"
          body="Buat kontrak dari form di bawah setelah properti, kamar, dan penyewa siap."
        />
      ) : (
      <ul className="tk-list mt-6">
          {leases.map((l) => (
            <li key={l.id} className="px-6 py-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{l.leaseNumber}</p>
                    <StatusBadge status={l.status} kind="lease" />
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    {l.tenant?.fullName} · {l.property?.name} / {l.room?.name} ·{' '}
                    {formatIdr(l.rentAmount)}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {formatDateId(l.startDate)}
                    {l.endDate ? ` - ${formatDateId(l.endDate)}` : ''}
                  </p>
                  <form action={generateContractAction} className="mt-2">
                    <input type="hidden" name="leaseId" value={l.id} />
                    <input type="hidden" name="workspaceId" value={workspaceId} />
                    <button type="submit" className="tk-btn-secondary !px-2 !py-1 !text-[11px]">
                      Generate e-sign
                    </button>
                  </form>
                </div>
                <div className="flex flex-col gap-3 sm:min-w-[14rem]">
                  {l.status === 'DRAFT' ||
                  l.status === 'UPCOMING' ||
                  l.status === 'PENDING_SIGNATURE' ? (
                    <form
                      action={activateAction}
                      className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 text-xs text-zinc-700"
                    >
                      <p className="mb-2 text-[11px] font-semibold text-zinc-900">
                        Check-in / aktifkan
                      </p>
                      <input type="hidden" name="id" value={l.id} />
                      <input
                        type="hidden"
                        name="workspaceId"
                        value={workspaceId}
                      />
                      <div className="grid grid-cols-2 gap-1.5">
                        <label className="flex items-center gap-1.5">
                          <input type="checkbox" name="identityVerified" defaultChecked /> ID
                        </label>
                        <label className="flex items-center gap-1.5">
                          <input type="checkbox" name="contractSigned" defaultChecked /> Kontrak
                        </label>
                        <label className="flex items-center gap-1.5">
                          <input type="checkbox" name="depositRecorded" defaultChecked /> Deposit
                        </label>
                        <label className="flex items-center gap-1.5">
                          <input type="checkbox" name="keysHanded" defaultChecked /> Kunci
                        </label>
                        <label className="col-span-2 flex items-center gap-1.5">
                          <input type="checkbox" name="rulesAccepted" defaultChecked /> Peraturan
                        </label>
                      </div>
                      <input
                        name="meterInitial"
                        type="number"
                        step="0.01"
                        placeholder="Meter awal"
                        className="tk-input mt-2 w-full !py-1.5 !text-xs"
                      />
                      <PendingSubmitButton
                        className="tk-btn-sm mt-2 w-full"
                        pendingLabel="Mengaktifkan..."
                      >
                        Aktifkan
                      </PendingSubmitButton>
                    </form>
                  ) : null}
                  {(l.status === 'ACTIVE' || l.status === 'ENDING_SOON') && (
                    <form
                      action={endAction}
                      className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 text-xs text-zinc-700"
                    >
                      <p className="mb-2 text-[11px] font-semibold text-zinc-900">
                        Check-out / akhiri
                      </p>
                      <input type="hidden" name="id" value={l.id} />
                      <input
                        type="hidden"
                        name="workspaceId"
                        value={workspaceId}
                      />
                      <label className="flex items-center gap-1.5">
                        <input type="checkbox" name="keysReturned" defaultChecked /> Kunci kembali
                      </label>
                      <input
                        name="meterFinal"
                        type="number"
                        step="0.01"
                        placeholder="Meter akhir"
                        className="tk-input mt-2 w-full !py-1.5 !text-xs"
                      />
                      <input
                        name="damageCost"
                        type="number"
                        placeholder="Biaya rusak"
                        className="tk-input mt-1.5 w-full !py-1.5 !text-xs"
                      />
                      <input
                        name="depositSettlement"
                        placeholder="Catatan deposit"
                        className="tk-input mt-1.5 w-full !py-1.5 !text-xs"
                      />
                      <ConfirmSubmitButton
                        className="tk-btn-secondary mt-2 w-full !text-xs"
                        title="Akhiri kontrak?"
                        description={`Kontrak ${l.leaseNumber} akan diakhiri memakai data serah-terima dan biaya yang diisi.`}
                        confirmLabel="Ya, akhiri"
                        pendingLabel="Mengakhiri..."
                        danger
                      >
                        Akhiri
                      </ConfirmSubmitButton>
                    </form>
                  )}
                </div>
              </div>
            </li>
          ))}
      </ul>
      )}

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

      {workspaceId &&
        (properties.length === 0 ||
          tenants.length === 0 ||
          rooms.length === 0) && (
          <EmptyState
            className="mt-6"
            title="Belum siap buat kontrak"
            body="Butuh minimal 1 properti, 1 kamar, dan 1 penyewa."
          />
        )}
    </>
  );
}
