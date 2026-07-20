import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { apiFetch, listWorkspaces } from '@/lib/api';
import { PageHeader, WorkspaceChips } from '@/components/ui';

async function saveAction(formData: FormData) {
  'use server';
  await requireAuth();
  const workspaceId = String(formData.get('workspaceId') ?? '');
  if (!workspaceId) return;
  await apiFetch(`/v1/workspaces/${workspaceId}/settings`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: String(formData.get('name') ?? '') || undefined,
      timezone: String(formData.get('timezone') ?? '') || undefined,
      invoicePrefix: String(formData.get('invoicePrefix') ?? '') || undefined,
      defaultDueDay: Number(formData.get('defaultDueDay') ?? 1) || 1,
      bankName: String(formData.get('bankName') ?? '') || undefined,
      bankAccountName: String(formData.get('bankAccountName') ?? '') || undefined,
      bankAccountNo: String(formData.get('bankAccountNo') ?? '') || undefined,
    }),
  });
  redirect(`/dashboard/settings?workspaceId=${workspaceId}`);
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ workspaceId?: string }>;
}) {
  await requireAuth();
  const { workspaceId: qWs } = await searchParams;
  let workspaces: Awaited<ReturnType<typeof listWorkspaces>> = [];
  let workspaceId = qWs ?? '';
  let ws: {
    name: string;
    timezone: string;
    invoicePrefix: string | null;
    defaultDueDay: number;
    bankName: string | null;
    bankAccountName: string | null;
    bankAccountNo: string | null;
  } | null = null;
  let error: string | null = null;

  try {
    workspaces = await listWorkspaces();
    if (!workspaceId && workspaces[0]) workspaceId = workspaces[0].id;
    if (workspaceId) {
      ws = await apiFetch(`/v1/workspaces/${workspaceId}`);
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Gagal memuat';
  }

  return (
    <>
      <PageHeader
        title="Pengaturan workspace"
        description="Identitas penagihan dan rekening pembayaran."
      />
      {workspaces.length > 0 && (
        <WorkspaceChips
          workspaces={workspaces}
          workspaceId={workspaceId}
          hrefFor={(id) => `/dashboard/settings?workspaceId=${id}`}
          className="mt-4"
        />
      )}
      {error && (
        <div className="tk-alert mt-4" data-variant="warning">
          {error}
        </div>
      )}
      {ws && workspaceId && (
        <form action={saveAction} className="mt-8 max-w-xl space-y-4 tk-card p-4 sm:p-6">
          <input type="hidden" name="workspaceId" value={workspaceId} />
          {(
            [
              ['name', 'Nama', ws.name],
              ['timezone', 'Zona waktu', ws.timezone],
              ['invoicePrefix', 'Awalan nomor tagihan', ws.invoicePrefix ?? ''],
              ['defaultDueDay', 'Tanggal jatuh tempo', String(ws.defaultDueDay)],
              ['bankName', 'Bank', ws.bankName ?? ''],
              ['bankAccountName', 'Nama rekening', ws.bankAccountName ?? ''],
              ['bankAccountNo', 'No. rekening', ws.bankAccountNo ?? ''],
            ] as const
          ).map(([name, label, val]) => (
            <label key={name} className="flex flex-col gap-1 text-sm">
              <span className="font-medium">{label}</span>
               <input
                 name={name}
                 defaultValue={val}
                 type={name === 'defaultDueDay' ? 'number' : 'text'}
                 min={name === 'defaultDueDay' ? 1 : undefined}
                 max={name === 'defaultDueDay' ? 31 : undefined}
                 required={name === 'name' || name === 'timezone'}
                 className="tk-input"
              />
            </label>
          ))}
          <button
            type="submit"
            className="tk-btn"
          >
            Simpan pengaturan
          </button>
        </form>
      )}
    </>
  );
}
