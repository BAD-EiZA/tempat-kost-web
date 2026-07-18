'use client';

import { useState } from 'react';

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

export function PortalPayClient({
  tenantId,
  invoiceId,
}: {
  tenantId: string;
  invoiceId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/portal/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, invoiceId }),
      });
      const data = (await res.json()) as {
        token?: string;
        redirectUrl?: string;
        clientKey?: string;
        isProduction?: boolean;
        message?: string;
      };
      if (!res.ok) throw new Error(data.message ?? 'Gagal bayar');

      if (data.redirectUrl && !data.token) {
        window.location.href = data.redirectUrl;
        return;
      }

      const snapUrl = data.isProduction
        ? 'https://app.midtrans.com/snap/snap.js'
        : 'https://app.sandbox.midtrans.com/snap/snap.js';
      if (!window.snap) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script');
          s.src = snapUrl;
          if (data.clientKey) s.setAttribute('data-client-key', data.clientKey);
          s.onload = () => resolve();
          s.onerror = () => reject(new Error('Snap gagal dimuat'));
          document.body.appendChild(s);
        });
      }
      if (window.snap && data.token) {
        window.snap.pay(data.token);
      } else if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={pay}
        disabled={loading}
        className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
      >
        {loading ? '…' : 'Bayar online'}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
