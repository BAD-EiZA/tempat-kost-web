'use client';

import { useState } from 'react';

type SnapResult = {
  token: string;
  redirectUrl?: string;
  clientKey?: string;
  isProduction?: boolean;
};

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        opts?: {
          onSuccess?: () => void;
          onPending?: () => void;
          onError?: () => void;
          onClose?: () => void;
        },
      ) => void;
    };
  }
}

async function loadSnap(isProduction?: boolean) {
  if (window.snap) return;
  const src = isProduction
    ? 'https://app.midtrans.com/snap/snap.js'
    : 'https://app.sandbox.midtrans.com/snap/snap.js';
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Snap load failed'));
    document.body.appendChild(s);
  });
}

export function PayButton({
  createPayment,
}: {
  createPayment: () => Promise<SnapResult>;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setError(null);
    try {
      const snap = await createPayment();
      if (snap.redirectUrl && !snap.token) {
        window.location.href = snap.redirectUrl;
        return;
      }
      await loadSnap(snap.isProduction);
      if (snap.clientKey) {
        const script = document.querySelector(
          'script[src*="midtrans.com/snap"]',
        ) as HTMLScriptElement | null;
        if (script) script.setAttribute('data-client-key', snap.clientKey);
      }
      if (window.snap && snap.token) {
        window.snap.pay(snap.token);
      } else if (snap.redirectUrl) {
        window.location.href = snap.redirectUrl;
      } else {
        setError('Token pembayaran tidak tersedia');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal membuat pembayaran');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
      >
        {loading ? 'Memuat…' : 'Bayar online'}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
