import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';

async function acceptAction(formData: FormData) {
  'use server';
  await requireAuth();
  const token = String(formData.get('token') ?? '');
  if (!token) return;
  await apiFetch('/v1/team/invitations/accept', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
  redirect('/dashboard');
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  await requireAuth();
  const { token } = await params;

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-semibold">Undangan workspace</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Terima undangan untuk bergabung sebagai anggota staf.
      </p>
      <form action={acceptAction} className="mt-8">
        <input type="hidden" name="token" value={token} />
        <button
          type="submit"
          className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white"
        >
          Terima undangan
        </button>
      </form>
    </div>
  );
}
