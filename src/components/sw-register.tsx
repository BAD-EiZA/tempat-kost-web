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
    <button
      type="button"
      onClick={async () => {
        await deferred.prompt();
        setCanInstall(false);
      }}
      className="fixed bottom-4 right-4 z-40 rounded-full bg-zinc-900 px-4 py-2 text-xs font-medium text-white shadow-lg"
    >
      Install app
    </button>
  );
}
