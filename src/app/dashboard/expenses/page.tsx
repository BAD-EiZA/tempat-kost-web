import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import {
  approveExpense,
  createExpense,
  listExpenses,
  listProperties,
  listWorkspaces,
  payExpense,
} from '@/lib/api';
import { ExpenseAiHint } from './expense-ai-hint';

function formatIdr(n: string | number) {
  const v = typeof n === 'string' ? Number(n) : n;
  if (Number.isNaN(v)) return String(n);
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(v);
}

async function createAction(formData: FormData) {
  'use server';
  await requireAuth();
  const workspaceId = String(formData.get('workspaceId') ?? '');
  const propertyId = String(formData.get('propertyId') ?? '') || undefined;
  const category = String(formData.get('category') ?? '').trim();
  const amount = Number(formData.get('amount') ?? 0);
  const expenseDate = String(formData.get('expenseDate') ?? '');
  const description =
    String(formData.get('description') ?? '').trim() || undefined;
  if (!workspaceId || !category || !expenseDate) return;
  await createExpense({
    workspaceId,
    propertyId,
    category,
    amount: Number.isFinite(amount) ? amount : 0,
    expenseDate,
    description,
  });
  redirect(`/dashboard/expenses?workspaceId=${workspaceId}`);
}

async function approveAction(formData: FormData) {
  'use server';
  await requireAuth();
  const id = String(formData.get('id') ?? '');
  const workspaceId = String(formData.get('workspaceId') ?? '');
  if (!id) return;
  await approveExpense(id);
  redirect(`/dashboard/expenses?workspaceId=${workspaceId}`);
}

async function payAction(formData: FormData) {
  'use server';
  await requireAuth();
  const id = String(formData.get('id') ?? '');
  const workspaceId = String(formData.get('workspaceId') ?? '');
  if (!id) return;
  await payExpense(id);
  redirect(`/dashboard/expenses?workspaceId=${workspaceId}`);
}

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ workspaceId?: string }>;
}) {
  await requireAuth();
  const { workspaceId: qWs } = await searchParams;
  let workspaces: Awaited<ReturnType<typeof listWorkspaces>> = [];
  let expenses: Awaited<ReturnType<typeof listExpenses>> = [];
  let properties: Awaited<ReturnType<typeof listProperties>> = [];
  let error: string | null = null;
  let workspaceId = qWs ?? '';
  const today = new Date().toISOString().slice(0, 10);

  try {
    workspaces = await listWorkspaces();
    if (!workspaceId && workspaces[0]) workspaceId = workspaces[0].id;
    if (workspaceId) {
      [expenses, properties] = await Promise.all([
        listExpenses(workspaceId),
        listProperties(workspaceId),
      ]);
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Gagal memuat pengeluaran';
  }

  return (
    <>
      <h1 className="text-2xl font-semibold">Pengeluaran</h1>
      <p className="mt-1 text-sm text-zinc-600">Draft → approve → paid.</p>

      {workspaces.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/dashboard/expenses?workspaceId=${ws.id}`}
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
        {expenses.length === 0 ? (
          <li className="p-6 text-sm text-zinc-600">Belum ada pengeluaran.</li>
        ) : (
          expenses.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-sm">
              <div>
                <p className="font-medium">
                  {e.category}{' '}
                  <span className="text-xs font-normal text-zinc-500">
                    {e.status}
                  </span>
                </p>
                <p className="text-xs text-zinc-500">
                  {e.property?.name ?? 'Umum'} · {formatIdr(e.amount)} ·{' '}
                  {String(e.expenseDate).slice(0, 10)}
                </p>
              </div>
              <div className="flex gap-2">
                {e.status === 'DRAFT' && (
                  <form action={approveAction}>
                    <input type="hidden" name="id" value={e.id} />
                    <input type="hidden" name="workspaceId" value={workspaceId} />
                    <button
                      type="submit"
                      className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs text-white"
                    >
                      Approve
                    </button>
                  </form>
                )}
                {e.status === 'APPROVED' && (
                  <form action={payAction}>
                    <input type="hidden" name="id" value={e.id} />
                    <input type="hidden" name="workspaceId" value={workspaceId} />
                    <button
                      type="submit"
                      className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs text-white"
                    >
                      Mark paid
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))
        )}
      </ul>

      {workspaceId && (
        <form
          action={createAction}
          className="mt-8 rounded-xl border border-zinc-200 bg-white p-6"
        >
          <h2 className="font-medium">Tambah pengeluaran</h2>
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span>Kategori</span>
              <input
                name="category"
                required
                placeholder="Listrik / Maintenance"
                className="rounded-lg border border-zinc-300 px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span>Nominal</span>
              <input
                name="amount"
                type="number"
                min={0}
                step={1000}
                required
                className="rounded-lg border border-zinc-300 px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span>Tanggal</span>
              <input
                name="expenseDate"
                type="date"
                required
                defaultValue={today}
                className="rounded-lg border border-zinc-300 px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span>Properti (opsional)</span>
              <select
                name="propertyId"
                className="rounded-lg border border-zinc-300 px-3 py-2"
                defaultValue=""
              >
                <option value="">— Umum —</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span>Catatan</span>
              <input
                name="description"
                className="rounded-lg border border-zinc-300 px-3 py-2"
              />
            </label>
          </div>
          <ExpenseAiHint workspaceId={workspaceId} />
          <button
            type="submit"
            className="mt-4 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white"
          >
            Simpan draft
          </button>
        </form>
      )}
    </>
  );
}
