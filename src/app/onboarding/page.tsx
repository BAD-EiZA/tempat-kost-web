import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import { createWorkspace } from '@/lib/api';

async function createAction(formData: FormData) {
  'use server';
  await requireAuth();
  const name = String(formData.get('name') ?? '').trim();
  if (!name) {
    return;
  }
  await createWorkspace(name);
  redirect('/dashboard');
}

export default async function OnboardingPage() {
  await requireAuth();

  return (
    <div className="flex min-h-[100dvh] flex-1 flex-col justify-center bg-zinc-50 px-6 py-16">
      <div className="tk-card mx-auto w-full max-w-md p-6 sm:p-8">
        <p className="text-xs font-medium tracking-wide text-emerald-800 uppercase">
          Tempat Kost
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
          Buat workspace
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
          Workspace adalah batas organisasi, anggota, dan data kos Anda.
        </p>
        <form action={createAction} className="mt-8 flex flex-col gap-4">
          <label className="tk-field">
            <span className="tk-label">Nama bisnis / workspace</span>
            <input
              name="name"
              required
              maxLength={120}
              placeholder="Contoh: Kos Melati Group"
              className="tk-input"
            />
          </label>
          <button type="submit" className="tk-btn w-full !py-2.5">
            Buat workspace
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-600">
          <Link
            href="/onboarding/wizard"
            className="font-medium text-emerald-800 underline-offset-2 hover:underline"
          >
            Atau buka wizard onboarding AI
          </Link>
        </p>
      </div>
    </div>
  );
}
