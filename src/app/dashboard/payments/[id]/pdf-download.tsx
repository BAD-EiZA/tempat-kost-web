'use client';

import { useState } from 'react';

export function PdfDownload({ paymentId }: { paymentId: string }) {
  const [error, setError] = useState<string | null>(null);

  async function download() {
    setError(null);
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: `/v1/receipts/by-payment/${paymentId}/pdf`,
          method: 'GET',
        }),
      });
      const data = (await res.json()) as {
        pdfBase64?: string;
        fileName?: string;
        message?: string;
      };
      if (!res.ok || !data.pdfBase64) {
        throw new Error(data.message ?? 'PDF gagal');
      }
      const bin = atob(data.pdfBase64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.fileName ?? 'kuitansi.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void download()}
        className="rounded-lg border px-3 py-1.5 text-xs"
      >
        Download PDF
      </button>
      {error && <p className="text-[10px] text-red-600">{error}</p>}
    </div>
  );
}
