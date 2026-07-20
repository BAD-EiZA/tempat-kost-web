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
import { formatDateId, formatIdr } from '@/lib/format';
import { ExpenseAiHint } from './expense-ai-hint';
import {
  EmptyState,
  PageHeader,
  StatusBadge,
  WorkspaceChips,
} from '@/components/ui';

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
      <PageHeader
        title="Pengeluaran"
        description="Draft, approve, lalu paid."
      />

      {workspaces.length > 0 && (
        <WorkspaceChips
          workspaces={workspaces}
          workspaceId={workspaceId}
          hrefFor={(id) => `/dashboard/expenses?workspaceId=${id}`}
        />
      )}

      {error && (
        <div className="tk-alert mt-4" data-variant="warning">
          {error}
        </div>
      )}

      {expenses.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="Belum ada pengeluaran"
          body="Catat biaya operasional dari form di bawah."
        />
      ) : (
      <ul className="mt-6 space-y-2">
          {expenses.map((e) => (
            <li
              key={e.id}
              className="tk-card flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-sm"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-zinc-900">{e.category}</p>
                  <StatusBadge status={e.status} kind="invoice" />
                </div>
                <p className="mt-1 text-base font-semibold tabular-nums">
                  {formatIdr(e.amount)}
                </p>
                <p className="text-xs text-zinc-500">
                  {e.property?.name ?? 'Umum'} · {formatDateId(e.expenseDate)}
                </p>
              </div>
              <div className="flex gap-2">
                {e.status === 'DRAFT' && (
                  <form action={approveAction}>
                    <input type="hidden" name="id" value={e.id} />
                    <input type="hidden" name="workspaceId" value={workspaceId} />
                    <button
                      type="submit"
                      className="tk-btn-sm"
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
                      className="tk-btn-sm"
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

      {workspaceId && (
        <form
          action={createAction}
          className="tk-card mt-8 p-6"
        >
          <h2 className="text-base font-semibold text-zinc-900">
            Tambah pengeluaran
          </h2>
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="tk-field">
              <span className="tk-label">Kategori</span>
              <input
                name="category"
                required
                placeholder="Listrik / Maintenance"
                className="tk-input"
              />
            </label>
            <label className="tk-field">
              <span className="tk-label">Nominal</span>
              <input
                name="amount"
                type="number"
                min={0}
                step={1000}
                required
                className="tk-input"
              />
            </label>
            <label className="tk-field">
              <span className="tk-label">Tanggal</span>
              <input
                name="expenseDate"
                type="date"
                required
                defaultValue={today}
                className="tk-input"
              />
            </label>
            <label className="tk-field">
              <span className="tk-label">Properti (opsional)</span>
              <select name="propertyId" className="tk-select" defaultValue="">
                <option value="">Umum</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="tk-field sm:col-span-2">
              <span className="tk-label">Catatan</span>
              <input name="description" className="tk-input" />
            </label>
          </div>
          <ExpenseAiHint workspaceId={workspaceId} />
          <button type="submit" className="tk-btn mt-4">
            Simpan draft
          </button>
        </form>
      )}
    </>
  );
}
