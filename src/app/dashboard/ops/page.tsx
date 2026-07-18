import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { apiFetch, listWorkspaces } from '@/lib/api';

async function createPackage(formData: FormData) {
  'use server';
  await requireAuth();
  const workspaceId = String(formData.get('workspaceId') ?? '');
  const recipient = String(formData.get('recipient') ?? '').trim();
  if (!workspaceId || !recipient) return;
  await apiFetch('/v1/ops/packages', {
    method: 'POST',
    body: JSON.stringify({
      workspaceId,
      recipient,
      courier: String(formData.get('courier') ?? '') || undefined,
    }),
  });
  redirect(`/dashboard/ops?workspaceId=${workspaceId}`);
}

async function createGuest(formData: FormData) {
  'use server';
  await requireAuth();
  const workspaceId = String(formData.get('workspaceId') ?? '');
  const guestName = String(formData.get('guestName') ?? '').trim();
  if (!workspaceId || !guestName) return;
  await apiFetch('/v1/ops/guests', {
    method: 'POST',
    body: JSON.stringify({
      workspaceId,
      guestName,
      roomLabel: String(formData.get('roomLabel') ?? '') || undefined,
    }),
  });
  redirect(`/dashboard/ops?workspaceId=${workspaceId}`);
}

async function createAnn(formData: FormData) {
  'use server';
  await requireAuth();
  const workspaceId = String(formData.get('workspaceId') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  const body = String(formData.get('body') ?? '').trim();
  if (!workspaceId || !title || !body) return;
  await apiFetch('/v1/ops/announcements', {
    method: 'POST',
    body: JSON.stringify({ workspaceId, title, body, publish: true }),
  });
  redirect(`/dashboard/ops?workspaceId=${workspaceId}`);
}

async function createRecurring(formData: FormData) {
  'use server';
  await requireAuth();
  const workspaceId = String(formData.get('workspaceId') ?? '');
  const category = String(formData.get('category') ?? '').trim();
  const amount = Number(formData.get('amount') ?? 0);
  const nextDate = String(formData.get('nextDate') ?? '');
  if (!workspaceId || !category || !nextDate) return;
  await apiFetch('/v1/ops/recurring-expenses', {
    method: 'POST',
    body: JSON.stringify({ workspaceId, category, amount, nextDate }),
  });
  redirect(`/dashboard/ops?workspaceId=${workspaceId}`);
}

export default async function OpsPage({
  searchParams,
}: {
  searchParams: Promise<{ workspaceId?: string }>;
}) {
  await requireAuth();
  const { workspaceId: qWs } = await searchParams;
  let workspaces: Awaited<ReturnType<typeof listWorkspaces>> = [];
  let workspaceId = qWs ?? '';
  let packages: Array<{ id: string; recipient: string; pickedUp: boolean }> =
    [];
  let guests: Array<{ id: string; guestName: string; roomLabel: string | null }> =
    [];
  let announcements: Array<{ id: string; title: string }> = [];
  let error: string | null = null;
  const today = new Date().toISOString().slice(0, 10);

  try {
    workspaces = await listWorkspaces();
    if (!workspaceId && workspaces[0]) workspaceId = workspaces[0].id;
    if (workspaceId) {
      [packages, guests, announcements] = await Promise.all([
        apiFetch<typeof packages>(
          `/v1/ops/packages?workspaceId=${workspaceId}`,
        ),
        apiFetch<typeof guests>(`/v1/ops/guests?workspaceId=${workspaceId}`),
        apiFetch<typeof announcements>(
          `/v1/ops/announcements?workspaceId=${workspaceId}`,
        ),
      ]);
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Gagal memuat ops';
  }

  return (
    <>
      <h1 className="text-2xl font-semibold">Operasional lapangan</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Paket, tamu, pengumuman, recurring expense.
      </p>
      {workspaces.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/dashboard/ops?workspaceId=${ws.id}`}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                ws.id === workspaceId ? 'bg-zinc-900 text-white' : 'bg-zinc-100'
              }`}
            >
              {ws.name}
            </Link>
          ))}
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
          {error}
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border bg-white p-5">
          <h2 className="font-medium">Paket ({packages.length})</h2>
          <ul className="mt-2 max-h-40 space-y-1 overflow-auto text-xs">
            {packages.map((p) => (
              <li key={p.id}>
                {p.recipient} {p.pickedUp ? '✓' : '· menunggu'}
              </li>
            ))}
          </ul>
          {workspaceId && (
            <form action={createPackage} className="mt-3 flex gap-2">
              <input type="hidden" name="workspaceId" value={workspaceId} />
              <input
                name="recipient"
                required
                placeholder="Penerima"
                className="flex-1 rounded border px-2 py-1 text-xs"
              />
              <button type="submit" className="rounded bg-zinc-900 px-2 py-1 text-xs text-white">
                +
              </button>
            </form>
          )}
        </section>

        <section className="rounded-xl border bg-white p-5">
          <h2 className="font-medium">Tamu ({guests.length})</h2>
          <ul className="mt-2 max-h-40 space-y-1 overflow-auto text-xs">
            {guests.map((g) => (
              <li key={g.id}>
                {g.guestName} {g.roomLabel ? `→ ${g.roomLabel}` : ''}
              </li>
            ))}
          </ul>
          {workspaceId && (
            <form action={createGuest} className="mt-3 flex gap-2">
              <input type="hidden" name="workspaceId" value={workspaceId} />
              <input
                name="guestName"
                required
                placeholder="Nama tamu"
                className="flex-1 rounded border px-2 py-1 text-xs"
              />
              <input
                name="roomLabel"
                placeholder="Kamar"
                className="w-20 rounded border px-2 py-1 text-xs"
              />
              <button type="submit" className="rounded bg-zinc-900 px-2 py-1 text-xs text-white">
                +
              </button>
            </form>
          )}
        </section>

        <section className="rounded-xl border bg-white p-5">
          <h2 className="font-medium">Pengumuman</h2>
          <ul className="mt-2 max-h-32 space-y-1 overflow-auto text-xs">
            {announcements.map((a) => (
              <li key={a.id}>{a.title}</li>
            ))}
          </ul>
          {workspaceId && (
            <form action={createAnn} className="mt-3 space-y-2">
              <input type="hidden" name="workspaceId" value={workspaceId} />
              <input
                name="title"
                required
                placeholder="Judul"
                className="w-full rounded border px-2 py-1 text-xs"
              />
              <textarea
                name="body"
                required
                rows={2}
                placeholder="Isi"
                className="w-full rounded border px-2 py-1 text-xs"
              />
              <button type="submit" className="rounded bg-zinc-900 px-3 py-1 text-xs text-white">
                Publish
              </button>
            </form>
          )}
        </section>

        <section className="rounded-xl border bg-white p-5">
          <h2 className="font-medium">Recurring expense</h2>
          {workspaceId && (
            <form action={createRecurring} className="mt-3 grid gap-2 sm:grid-cols-2">
              <input type="hidden" name="workspaceId" value={workspaceId} />
              <input
                name="category"
                required
                placeholder="Kategori"
                className="rounded border px-2 py-1 text-xs"
              />
              <input
                name="amount"
                type="number"
                required
                placeholder="Nominal"
                className="rounded border px-2 py-1 text-xs"
              />
              <input
                name="nextDate"
                type="date"
                required
                defaultValue={today}
                className="rounded border px-2 py-1 text-xs sm:col-span-2"
              />
              <button
                type="submit"
                className="rounded bg-zinc-900 px-3 py-1 text-xs text-white sm:col-span-2"
              >
                Simpan recurring
              </button>
            </form>
          )}
        </section>
      </div>
    </>
  );
}
