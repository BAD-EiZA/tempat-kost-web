import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import {
  EmptyState,
  PageHeader,
  WorkspaceChips,
} from '@/components/ui';
import {
  createUtilityPolicy,
  listProperties,
  listUtilityPolicies,
  listWorkspaces,
} from '@/lib/api';
import { formatIdr } from '@/lib/format';

async function createAction(formData: FormData) {
  'use server';
  await requireAuth();
  const workspaceId = String(formData.get('workspaceId') ?? '');
  const propertyId = String(formData.get('propertyId') ?? '');
  const payerType = String(formData.get('payerType') ?? 'TENANT');
  const billingMethod = String(
    formData.get('billingMethod') ?? 'FIXED_MONTHLY',
  );
  const ratePerUnit = Number(formData.get('ratePerUnit') ?? 0);
  const fixedMonthlyFee = Number(formData.get('fixedMonthlyFee') ?? 0);
  const ownerUnitAllowance = Number(formData.get('ownerUnitAllowance') ?? 0);
  if (!workspaceId || !propertyId) return;
  await createUtilityPolicy({
    workspaceId,
    propertyId,
    payerType,
    billingMethod,
    ratePerUnit: ratePerUnit || undefined,
    fixedMonthlyFee: fixedMonthlyFee || undefined,
    ownerUnitAllowance: ownerUnitAllowance || undefined,
  });
  redirect(`/dashboard/utilities?workspaceId=${workspaceId}`);
}

export default async function UtilitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ workspaceId?: string }>;
}) {
  await requireAuth();
  const { workspaceId: qWs } = await searchParams;
  let workspaces: Awaited<ReturnType<typeof listWorkspaces>> = [];
  let policies: Awaited<ReturnType<typeof listUtilityPolicies>> = [];
  let properties: Awaited<ReturnType<typeof listProperties>> = [];
  let error: string | null = null;
  let workspaceId = qWs ?? '';

  try {
    workspaces = await listWorkspaces();
    if (!workspaceId && workspaces[0]) workspaceId = workspaces[0].id;
    if (workspaceId) {
      [policies, properties] = await Promise.all([
        listUtilityPolicies(workspaceId),
        listProperties(workspaceId),
      ]);
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Gagal memuat utilitas';
  }

  return (
    <>
      <PageHeader
        title="Listrik / Utilitas"
        description="Kebijakan per properti: tenant, owner, shared, atau included."
      />

      {workspaces.length > 0 && (
        <WorkspaceChips
          workspaces={workspaces}
          workspaceId={workspaceId}
          hrefFor={(id) => `/dashboard/utilities?workspaceId=${id}`}
        />
      )}

      {error && (
        <div className="tk-alert mt-4" data-variant="warning">
          {error}
        </div>
      )}

      {policies.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="Belum ada kebijakan"
          body="Atur bagaimana listrik/air ditagih per properti."
        />
      ) : (
        <ul className="mt-6 space-y-2">
          {policies.map((p) => (
            <li key={p.id} className="tk-card px-5 py-4 text-sm">
              <p className="font-semibold text-zinc-900">
                {p.property?.name ?? p.propertyId}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {p.payerType} · {p.billingMethod}
                {p.ratePerUnit != null
                  ? ` · ${formatIdr(Number(p.ratePerUnit))}/kWh`
                  : ''}
                {p.fixedMonthlyFee != null
                  ? ` · fixed ${formatIdr(Number(p.fixedMonthlyFee))}`
                  : ''}
                {p.ownerUnitAllowance != null
                  ? ` · kuota owner ${p.ownerUnitAllowance} kWh`
                  : ''}
              </p>
            </li>
          ))}
        </ul>
      )}

      {workspaceId && properties.length > 0 && (
        <form
          action={createAction}
          className="tk-card mt-8 p-6"
        >
          <h2 className="text-base font-semibold text-zinc-900">
            Tambah kebijakan
          </h2>
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span>Properti</span>
              <select
                name="propertyId"
                required
                className="tk-input"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span>Penanggung</span>
              <select
                name="payerType"
                className="tk-input"
                defaultValue="TENANT"
              >
                <option value="TENANT">Penyewa</option>
                <option value="OWNER">Pemilik</option>
                <option value="SHARED">Bersama</option>
                <option value="INCLUDED_IN_RENT">Termasuk sewa</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span>Metode</span>
              <select
                name="billingMethod"
                className="tk-input"
                defaultValue="FIXED_MONTHLY"
              >
                <option value="FIXED_MONTHLY">Fixed bulanan</option>
                <option value="INDIVIDUAL_POSTPAID_METER">Meter pascabayar</option>
                <option value="INCLUDED">Included</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span>Tarif / kWh</span>
              <input
                name="ratePerUnit"
                type="number"
                min={0}
                step={1}
                placeholder="1700"
                className="tk-input"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span>Fixed bulanan</span>
              <input
                name="fixedMonthlyFee"
                type="number"
                min={0}
                step={1000}
                className="tk-input"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span>Kuota owner (kWh) - untuk SHARED</span>
              <input
                name="ownerUnitAllowance"
                type="number"
                min={0}
                step={1}
                placeholder="20"
                className="tk-input"
              />
            </label>
          </div>
          <button
            type="submit"
            className="tk-btn mt-4"
          >
            Simpan
          </button>
        </form>
      )}
    </>
  );
}
