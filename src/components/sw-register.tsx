'use client';

import { useEffect, useState } from 'react';

export function SwRegister() {
  const [canInstall, setCanInstall] = useState(false);
  const [deferred, setDeferred] = useState<{
    prompt: () => Promise<void>;
  } | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => null);
    }
    function onBip(e: Event) {
      e.preventDefault();
      if (sessionStorage.getItem('pwa-install-dismissed')) return;
      const ev = e as Event & {
        prompt: () => Promise<void>;
      };
      setDeferred(ev);
      setCanInstall(true);
    }
    window.addEventListener('beforeinstallprompt', onBip);
    return () => window.removeEventListener('beforeinstallprompt', onBip);
  }, []);

  if (!canInstall || !deferred) return null;

  return (
    <div
      role="region"
      aria-label="Instal aplikasi"
      className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-[calc(1rem+env(safe-area-inset-right))] z-40 flex items-center rounded-full bg-emerald-800 text-xs font-medium text-white shadow-lg"
    >
      <button
        type="button"
        onClick={async () => {
          await deferred.prompt();
          setCanInstall(false);
          setDeferred(null);
        }}
        className="rounded-l-full px-4 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
      >
        Install app
      </button>
      <button
        type="button"
        aria-label="Tutup saran instal aplikasi"
        onClick={() => {
          sessionStorage.setItem('pwa-install-dismissed', 'true');
          setCanInstall(false);
          setDeferred(null);
        }}
        className="rounded-r-full border-l border-white/20 px-3 py-2 text-zinc-300 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
      >
        ×
      </button>
    </div>
  );
}
