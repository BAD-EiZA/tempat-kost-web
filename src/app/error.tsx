'use client';

import { useEffect } from 'react';

export default function ErrorPage({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  useEffect(() => console.error(error), [error]);

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-16">
      <div role="alert" className="tk-card p-6">
        <h1 className="text-xl font-semibold">Halaman bermasalah</h1>
        <p className="mt-2 text-sm text-zinc-600">Data tidak dapat ditampilkan. Coba muat ulang bagian ini.</p>
        <button type="button" className="tk-btn mt-6" onClick={unstable_retry}>Coba lagi</button>
      </div>
    </main>
  );
}
