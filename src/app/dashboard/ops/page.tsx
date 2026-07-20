import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { apiFetch, listWorkspaces } from '@/lib/api';
import {
  PageHeader,
  WorkspaceChips,
} from '@/components/ui';

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
      <PageHeader
        title="Operasional lapangan"
        description="Paket, tamu, pengumuman, dan biaya berulang."
        actions={
          <Link
            href="/dashboard/ops/offline"
            className="text-sm font-medium text-emerald-800 underline-offset-2 hover:underline"
          >
            Offline drafts
          </Link>
        }
      />
      {workspaces.length > 0 && (
        <WorkspaceChips
          workspaces={workspaces}
          workspaceId={workspaceId}
          hrefFor={(id) => `/dashboard/ops?workspaceId=${id}`}
        />
      )}
      {error && (
        <div className="tk-alert mt-4" data-variant="warning">
          {error}
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="tk-card p-5">
          <h2 className="text-base font-semibold text-zinc-900">
            Paket ({packages.length})
          </h2>
          <ul className="mt-2 max-h-40 space-y-1 overflow-auto text-xs">
            {packages.length === 0 ? (
              <li className="text-zinc-500">Belum ada paket.</li>
            ) : null}
            {packages.map((p) => (
              <li key={p.id} className="flex justify-between gap-2 py-0.5">
                <span>{p.recipient}</span>
                <span className="text-zinc-500">
                  {p.pickedUp ? 'Diambil' : 'Menunggu'}
                </span>
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
                className="tk-input flex-1 !px-2 !py-1 !text-xs"
              />
              <button type="submit" className="tk-btn-sm" aria-label="Tambah paket">
                +
              </button>
            </form>
          )}
        </section>

        <section className="tk-card p-5">
          <h2 className="text-base font-semibold text-zinc-900">
            Tamu ({guests.length})
          </h2>
          <ul className="mt-2 max-h-40 space-y-1 overflow-auto text-xs">
            {guests.length === 0 ? (
              <li className="text-zinc-500">Belum ada tamu.</li>
            ) : null}
            {guests.map((g) => (
              <li key={g.id}>
                {g.guestName} {g.roomLabel ? `- ${g.roomLabel}` : ''}
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
                className="tk-input flex-1 !px-2 !py-1 !text-xs"
              />
              <input
                name="roomLabel"
                placeholder="Kamar"
                className="tk-input w-20 !px-2 !py-1 !text-xs"
              />
              <button type="submit" className="tk-btn-sm" aria-label="Tambah tamu">
                +
              </button>
            </form>
          )}
        </section>

        <section className="tk-card p-5">
          <h2 className="text-base font-semibold text-zinc-900">Pengumuman</h2>
          <ul className="mt-2 max-h-32 space-y-1 overflow-auto text-xs">
            {announcements.length === 0 ? (
              <li className="text-zinc-500">Belum ada pengumuman.</li>
            ) : null}
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
                className="tk-input w-full !px-2 !py-1 !text-xs"
              />
              <textarea
                name="body"
                required
                rows={2}
                placeholder="Isi"
                className="tk-input w-full !px-2 !py-1 !text-xs"
              />
              <button type="submit" className="tk-btn-sm">
                Publish
              </button>
            </form>
          )}
        </section>

        <section className="tk-card p-5">
          <h2 className="font-medium">Recurring expense</h2>
          {workspaceId && (
            <form action={createRecurring} className="mt-3 grid gap-2 sm:grid-cols-2">
              <input type="hidden" name="workspaceId" value={workspaceId} />
              <input
                name="category"
                required
                placeholder="Kategori"
                className="tk-input !px-2 !py-1 !text-xs"
              />
              <input
                name="amount"
                type="number"
                required
                placeholder="Nominal"
                className="tk-input !px-2 !py-1 !text-xs"
              />
              <input
                name="nextDate"
                type="date"
                required
                defaultValue={today}
                className="tk-input !px-2 !py-1 !text-xs sm:col-span-2"
              />
              <button
                type="submit"
                className="tk-btn-sm sm:col-span-2"
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
