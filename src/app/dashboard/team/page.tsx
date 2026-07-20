import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { apiFetch, listWorkspaces } from '@/lib/api';
import {
  EmptyState,
  PageHeader,
  WorkspaceChips,
} from '@/components/ui';

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
      <PageHeader
        title="Tim & akses"
        description="Anggota workspace, undangan, dan peran."
        actions={
          workspaceId ? (
            <Link
              href={`/dashboard/roles?workspaceId=${workspaceId}`}
              className="text-sm font-medium text-emerald-800 underline-offset-2 hover:underline"
            >
              Custom roles
            </Link>
          ) : null
        }
      />
      {workspaces.length > 0 && (
        <WorkspaceChips
          workspaces={workspaces}
          workspaceId={workspaceId}
          hrefFor={(id) => `/dashboard/team?workspaceId=${id}`}
        />
      )}
      {error && (
        <div className="tk-alert mt-4" data-variant="warning">
          {error}
        </div>
      )}
      {members.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="Belum ada anggota"
          body="Undang staf lewat form di bawah."
        />
      ) : (
        <ul className="mt-6 space-y-2">
          {members.map((m) => (
            <li
              key={m.id}
              className="tk-card flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm"
            >
              <div>
                <p className="font-semibold text-zinc-900">
                  {m.user.fullName ?? m.user.email}
                </p>
                {m.user.fullName && m.user.email ? (
                  <p className="text-xs text-zinc-500">{m.user.email}</p>
                ) : null}
              </div>
              <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
                {m.role.name}
              </span>
            </li>
          ))}
        </ul>
      )}
      {invitations.length > 0 && (
        <div className="tk-card mt-4 p-4 text-xs text-zinc-600">
          <p className="font-medium text-zinc-800">Undangan pending</p>
          <p className="mt-1">{invitations.map((i) => i.email).join(', ')}</p>
        </div>
      )}
      {workspaceId && (
        <form action={inviteAction} className="tk-card mt-8 p-6">
          <h2 className="text-base font-semibold text-zinc-900">
            Undang anggota
          </h2>
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="tk-field">
              <span className="tk-label">Email</span>
              <input
                name="email"
                type="email"
                required
                placeholder="email@contoh.com"
                className="tk-input"
              />
            </label>
            <label className="tk-field">
              <span className="tk-label">Peran</span>
              <select name="roleKey" className="tk-select">
                <option value="manager">Manager</option>
                <option value="finance">Finance</option>
                <option value="admin">Admin</option>
                <option value="field">Field</option>
                <option value="technician">Technician</option>
              </select>
            </label>
          </div>
          <button type="submit" className="tk-btn mt-4">
            Kirim undangan
          </button>
        </form>
      )}
    </>
  );
}
