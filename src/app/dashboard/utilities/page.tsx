import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import {
  createUtilityPolicy,
  listProperties,
  listUtilityPolicies,
  listWorkspaces,
} from '@/lib/api';

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
      <h1 className="text-2xl font-semibold">Listrik / Utilitas</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Kebijakan per properti: TENANT / OWNER / SHARED / INCLUDED.
      </p>

      {workspaces.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/dashboard/utilities?workspaceId=${ws.id}`}
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
        {policies.length === 0 ? (
          <li className="p-6 text-sm text-zinc-600">Belum ada kebijakan.</li>
        ) : (
          policies.map((p) => (
            <li key={p.id} className="px-6 py-4 text-sm">
              <p className="font-medium">
                {p.property?.name ?? p.propertyId} · {p.payerType}
              </p>
              <p className="text-xs text-zinc-500">
                {p.billingMethod}
                {p.ratePerUnit != null ? ` · Rp${p.ratePerUnit}/kWh` : ''}
                {p.fixedMonthlyFee != null
                  ? ` · fixed ${p.fixedMonthlyFee}`
                  : ''}
                {p.ownerUnitAllowance != null
                  ? ` · kuota owner ${p.ownerUnitAllowance} kWh`
                  : ''}
              </p>
            </li>
          ))
        )}
      </ul>

      {workspaceId && properties.length > 0 && (
        <form
          action={createAction}
          className="mt-8 rounded-xl border border-zinc-200 bg-white p-6"
        >
          <h2 className="font-medium">Tambah kebijakan</h2>
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span>Properti</span>
              <select
                name="propertyId"
                required
                className="rounded-lg border border-zinc-300 px-3 py-2"
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
                className="rounded-lg border border-zinc-300 px-3 py-2"
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
                className="rounded-lg border border-zinc-300 px-3 py-2"
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
                className="rounded-lg border border-zinc-300 px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span>Fixed bulanan</span>
              <input
                name="fixedMonthlyFee"
                type="number"
                min={0}
                step={1000}
                className="rounded-lg border border-zinc-300 px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span>Kuota owner (kWh) — untuk SHARED</span>
              <input
                name="ownerUnitAllowance"
                type="number"
                min={0}
                step={1}
                placeholder="20"
                className="rounded-lg border border-zinc-300 px-3 py-2"
              />
            </label>
          </div>
          <button
            type="submit"
            className="mt-4 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white"
          >
            Simpan
          </button>
        </form>
      )}
    </>
  );
}
