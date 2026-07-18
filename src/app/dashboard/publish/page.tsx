import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { apiFetch, listProperties, listWorkspaces } from '@/lib/api';

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
      <h1 className="text-2xl font-semibold">Publish halaman publik</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Halaman: /p/[slug] · CTA WhatsApp
      </p>
      {sp.slug && (
        <p className="mt-3 text-sm text-emerald-700">
          Live:{' '}
          <Link href={`/p/${sp.slug}`} className="underline">
            /p/{sp.slug}
          </Link>
        </p>
      )}
      {workspaces.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/dashboard/publish?workspaceId=${ws.id}`}
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
      {workspaceId && properties.length > 0 && (
        <form action={publishAction} className="mt-8 max-w-lg space-y-3 rounded-xl border bg-white p-6">
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <label className="flex flex-col gap-1 text-sm">
            <span>Properti</span>
            <select name="propertyId" required className="rounded-lg border px-3 py-2">
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Slug publik</span>
            <input
              name="slug"
              required
              placeholder="kos-melati"
              className="rounded-lg border px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>WhatsApp (628…)</span>
            <input name="whatsapp" className="rounded-lg border px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Warna brand</span>
            <input
              name="brandColor"
              type="color"
              defaultValue="#18181b"
              className="h-10 w-full rounded-lg border"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Harga mulai</span>
            <input
              name="startingPrice"
              type="number"
              className="rounded-lg border px-3 py-2"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white"
          >
            Publish
          </button>
        </form>
      )}
    </>
  );
}
