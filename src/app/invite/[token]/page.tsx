import Link from 'next/link';
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
    <div className="flex min-h-[100dvh] items-center justify-center bg-zinc-50 px-6 py-16">
      <div className="tk-card w-full max-w-md p-8">
        <p className="text-xs font-medium tracking-wide text-emerald-800 uppercase">
          Tempat Kost
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
          Undangan workspace
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          Terima undangan untuk bergabung sebagai anggota staf. Anda akan diarahkan
          ke dashboard setelah menerima.
        </p>
        <form action={acceptAction} className="mt-8 space-y-3">
          <input type="hidden" name="token" value={token} />
          <button type="submit" className="tk-btn w-full !py-2.5">
            Terima undangan
          </button>
          <Link
            href="/dashboard"
            className="tk-btn-secondary flex w-full !py-2.5"
          >
            Nanti saja
          </Link>
        </form>
      </div>
    </div>
  );
}
