import { requireAuth } from '@/lib/auth';
import { resolvePortalTenantId } from '@/lib/portal-tenant';
import { apiFetch } from '@/lib/api';
import { ContractPdfButton } from './pdf-button';

type Lease = {
  id: string;
  leaseNumber: string;
  status: string;
  startDate: string;
  endDate: string | null;
  rentAmount: string | number;
  depositAmount: string | number;
  room?: { name: string };
  property?: { name: string; addressLine: string | null };
  checkinRecord?: { completedAt: string } | null;
  checkoutRecord?: { completedAt: string } | null;
  contracts?: Array<{
    id: string;
    version: number;
    status: string;
    signToken: string | null;
    signedAt: string | null;
  }>;
};

function formatIdr(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);
}

export default async function PortalContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ tenantId?: string }>;
}) {
  await requireAuth();
  const sp = await searchParams;
  let leases: Lease[] = [];
  let tenantId = '';
  let error: string | null = null;

  try {
    const resolved = await resolvePortalTenantId(sp.tenantId);
    tenantId = resolved.tenantId;
    if (tenantId) {
      leases = await apiFetch<Lease[]>(
        `/v1/portal/contracts?tenantId=${encodeURIComponent(tenantId)}`,
      );
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Gagal memuat kontrak';
  }

  return (
    <>
      <h1 className="text-xl font-semibold">Kontrak</h1>
      {error && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
          {error}
        </div>
      )}
      <ul className="mt-4 divide-y rounded-xl border bg-white">
        {leases.length === 0 ? (
          <li className="p-4 text-sm text-zinc-500">Belum ada kontrak.</li>
        ) : (
          leases.map((l) => (
            <li key={l.id} className="px-4 py-3 text-sm">
              <p className="font-medium">
                {l.leaseNumber}{' '}
                <span className="text-xs font-normal text-zinc-500">
                  {l.status}
                </span>
              </p>
              <p className="text-xs text-zinc-500">
                {l.property?.name} / {l.room?.name} ·{' '}
                {formatIdr(Number(l.rentAmount))}
              </p>
              <p className="text-xs text-zinc-400">
                {String(l.startDate).slice(0, 10)}
                {l.endDate ? ` → ${String(l.endDate).slice(0, 10)}` : ''}
              </p>
              {l.contracts && l.contracts.length > 0 && (
                <ul className="mt-2 space-y-2">
                  {l.contracts.map((c) => (
                    <li
                      key={c.id}
                      className="flex flex-wrap items-center gap-2 text-xs"
                    >
                      <span>
                        v{c.version} · {c.status}
                        {c.signedAt
                          ? ` · ${String(c.signedAt).slice(0, 10)}`
                          : ''}
                      </span>
                      {c.status !== 'signed' && c.signToken ? (
                        <a
                          href={`/sign/${c.signToken}`}
                          className="underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Tanda tangani
                        </a>
                      ) : null}
                      {tenantId ? (
                        <ContractPdfButton
                          contractId={c.id}
                          tenantId={tenantId}
                        />
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))
        )}
      </ul>
    </>
  );
}
