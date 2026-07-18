import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { apiFetch, listWorkspaces } from '@/lib/api';

async function inviteAction(formData: FormData) {
  'use server';
  await requireAuth();
  const workspaceId = String(formData.get('workspaceId') ?? '');
  const email = String(formData.get('email') ?? '').trim();
  const roleKey = String(formData.get('roleKey') ?? 'manager');
  if (!workspaceId || !email) return;
  await apiFetch('/v1/team/invitations', {
    method: 'POST',
    body: JSON.stringify({ workspaceId, email, roleKey }),
  });
  redirect(`/dashboard/team?workspaceId=${workspaceId}`);
}

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ workspaceId?: string }>;
}) {
  await requireAuth();
  const { workspaceId: qWs } = await searchParams;
  let workspaces: Awaited<ReturnType<typeof listWorkspaces>> = [];
  let members: Array<{
    id: string;
    user: { email: string | null; fullName: string | null };
    role: { key: string; name: string };
  }> = [];
  let invitations: Array<{ id: string; email: string; token: string }> = [];
  let workspaceId = qWs ?? '';
  let error: string | null = null;

  try {
    workspaces = await listWorkspaces();
    if (!workspaceId && workspaces[0]) workspaceId = workspaces[0].id;
    if (workspaceId) {
      [members, invitations] = await Promise.all([
        apiFetch<typeof members>(
          `/v1/team/members?workspaceId=${workspaceId}`,
        ),
        apiFetch<typeof invitations>(
          `/v1/team/invitations?workspaceId=${workspaceId}`,
        ),
      ]);
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Gagal memuat tim';
  }

  return (
    <>
      <h1 className="text-2xl font-semibold">Tim & akses</h1>
      {workspaces.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/dashboard/team?workspaceId=${ws.id}`}
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
      <ul className="mt-6 divide-y rounded-xl border bg-white">
        {members.map((m) => (
          <li key={m.id} className="px-6 py-3 text-sm">
            <span className="font-medium">
              {m.user.fullName ?? m.user.email}
            </span>{' '}
            <span className="text-xs text-zinc-500">
              {m.role.name} ({m.role.key})
            </span>
          </li>
        ))}
      </ul>
      {invitations.length > 0 && (
        <div className="mt-4 text-xs text-zinc-500">
          Pending: {invitations.map((i) => i.email).join(', ')}
        </div>
      )}
      {workspaceId && (
        <form action={inviteAction} className="mt-8 rounded-xl border bg-white p-6">
          <h2 className="font-medium">Undang anggota</h2>
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              name="email"
              type="email"
              required
              placeholder="email@contoh.com"
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <select name="roleKey" className="rounded-lg border px-3 py-2 text-sm">
              <option value="manager">Manager</option>
              <option value="finance">Finance</option>
              <option value="admin">Admin</option>
              <option value="field">Field</option>
              <option value="technician">Technician</option>
            </select>
          </div>
          <button
            type="submit"
            className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white"
          >
            Kirim undangan (email log)
          </button>
        </form>
      )}
      {workspaceId && (
        <p className="mt-6 text-sm">
          <Link
            href={`/dashboard/roles?workspaceId=${workspaceId}`}
            className="underline"
          >
            Kelola custom roles →
          </Link>
        </p>
      )}
    </>
  );
}
