import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { apiFetch, listWorkspaces } from '@/lib/api';

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
      <h1 className="text-2xl font-semibold">Pengaturan workspace</h1>
      {workspaces.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {workspaces.map((w) => (
            <Link
              key={w.id}
              href={`/dashboard/settings?workspaceId=${w.id}`}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                w.id === workspaceId ? 'bg-zinc-900 text-white' : 'bg-zinc-100'
              }`}
            >
              {w.name}
            </Link>
          ))}
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
          {error}
        </div>
      )}
      {ws && workspaceId && (
        <form action={saveAction} className="mt-8 max-w-xl space-y-3 rounded-xl border bg-white p-6">
          <input type="hidden" name="workspaceId" value={workspaceId} />
          {(
            [
              ['name', 'Nama', ws.name],
              ['timezone', 'Zona waktu', ws.timezone],
              ['invoicePrefix', 'Prefix invoice', ws.invoicePrefix ?? ''],
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
                className="rounded-lg border border-zinc-300 px-3 py-2"
              />
            </label>
          ))}
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white"
          >
            Simpan
          </button>
        </form>
      )}
    </>
  );
}
