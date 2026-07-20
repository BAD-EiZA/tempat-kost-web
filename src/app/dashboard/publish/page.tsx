import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { apiFetch, listProperties, listWorkspaces } from '@/lib/api';
import {
  EmptyState,
  PageHeader,
  WorkspaceChips,
} from '@/components/ui';

async function publishAction(formData: FormData) {
  'use server';
  await requireAuth();
  const workspaceId = String(formData.get('workspaceId') ?? '');
  const propertyId = String(formData.get('propertyId') ?? '');
  const slug = String(formData.get('slug') ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-');
  if (!propertyId || !slug) return;
  await apiFetch('/v1/properties/publish', {
    method: 'POST',
    body: JSON.stringify({
      propertyId,
      slug,
      whatsapp: String(formData.get('whatsapp') ?? '') || undefined,
      brandColor: String(formData.get('brandColor') ?? '') || undefined,
      startingPrice: Number(formData.get('startingPrice') ?? 0) || undefined,
      published: true,
    }),
  });
  redirect(`/dashboard/publish?workspaceId=${workspaceId}&slug=${slug}`);
}

export default async function PublishPage({
  searchParams,
}: {
  searchParams: Promise<{ workspaceId?: string; slug?: string }>;
}) {
  await requireAuth();
  const sp = await searchParams;
  let workspaces: Awaited<ReturnType<typeof listWorkspaces>> = [];
  let properties: Awaited<ReturnType<typeof listProperties>> = [];
  let workspaceId = sp.workspaceId ?? '';
  let error: string | null = null;

  try {
    workspaces = await listWorkspaces();
    if (!workspaceId && workspaces[0]) workspaceId = workspaces[0].id;
    if (workspaceId) properties = await listProperties(workspaceId);
  } catch (e) {
    error = e instanceof Error ? e.message : 'Gagal';
  }

  return (
    <>
      <PageHeader
        title="Terbitkan halaman publik"
        description="Tampilkan properti kepada calon penghuni melalui halaman publik dan WhatsApp."
      />
      {sp.slug && (
        <div className="tk-alert mt-4" data-variant="success">
          Halaman terbit:{' '}
          <Link
            href={`/p/${sp.slug}`}
            className="font-medium underline-offset-2 hover:underline"
          >
            /p/{sp.slug}
          </Link>
        </div>
      )}
      {workspaces.length > 0 && (
        <WorkspaceChips
          workspaces={workspaces}
          workspaceId={workspaceId}
          hrefFor={(id) => `/dashboard/publish?workspaceId=${id}`}
        />
      )}
      {error && (
        <div className="tk-alert mt-4" data-variant="warning">
          {error}
        </div>
      )}
      {workspaceId && properties.length > 0 && (
        <form
          action={publishAction}
          className="tk-card mt-8 max-w-lg space-y-4 p-6"
        >
          <h2 className="text-base font-semibold text-zinc-900">
            Pengaturan listing
          </h2>
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <label className="tk-field">
            <span className="tk-label">Properti</span>
            <select name="propertyId" required className="tk-select">
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="tk-field">
            <span className="tk-label">Slug halaman publik</span>
            <input
              name="slug"
              required
              placeholder="kos-melati"
              className="tk-input"
            />
            <span className="text-xs text-zinc-500">
              Huruf kecil, angka, dan tanda hubung. Contoh: kos-melati
            </span>
          </label>
          <label className="tk-field">
            <span className="tk-label">Nomor WhatsApp</span>
            <input
              name="whatsapp"
              inputMode="tel"
              placeholder="628123456789"
              className="tk-input"
            />
          </label>
          <label className="tk-field">
            <span className="tk-label">Warna brand</span>
            <input
              name="brandColor"
              type="color"
              defaultValue="#047857"
              className="h-10 w-full rounded-lg border border-zinc-200"
            />
          </label>
          <label className="tk-field">
            <span className="tk-label">Harga mulai (Rp)</span>
            <input
              name="startingPrice"
              type="number"
              min={0}
              step={1000}
              className="tk-input"
            />
          </label>
          <p className="tk-alert" data-variant="warning">
            Setelah diterbitkan, siapa pun dengan tautan dapat membuka halaman.
          </p>
          <label className="flex items-start gap-2 text-sm text-zinc-700">
            <input type="checkbox" required className="mt-0.5" />
            <span>
              Saya sudah memeriksa properti, harga, dan nomor WhatsApp.
            </span>
          </label>
          <button type="submit" className="tk-btn">
            Terbitkan halaman
          </button>
        </form>
      )}
      {workspaceId && properties.length === 0 && !error && (
        <EmptyState
          className="mt-6"
          title="Belum ada properti"
          body="Tambah properti dulu sebelum menerbitkan listing publik."
          action={
            <Link
              href={`/dashboard/properties?workspaceId=${workspaceId}`}
              className="tk-btn !text-sm"
            >
              Ke properti
            </Link>
          }
        />
      )}
    </>
  );
}
