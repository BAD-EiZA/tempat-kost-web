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
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-semibold">Buat workspace</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Workspace adalah batas organisasi, anggota, dan data kos Anda.
      </p>
      <form action={createAction} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Nama bisnis / workspace</span>
          <input
            name="name"
            required
            maxLength={120}
            placeholder="Contoh: Kos Melati Group"
            className="rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white"
        >
          Buat workspace
        </button>
      </form>
      <p className="mt-6 text-center text-sm">
        <a href="/onboarding/wizard" className="underline">
          Atau buka wizard onboarding AI →
        </a>
      </p>
    </div>
  );
}
