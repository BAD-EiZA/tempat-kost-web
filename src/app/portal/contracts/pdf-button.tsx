'use client';

import { useState } from 'react';

export function ContractPdfButton({
  contractId,
  tenantId,
}: {
  contractId: string;
  tenantId: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function download() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: `/v1/portal/contracts/${contractId}/pdf?tenantId=${encodeURIComponent(tenantId)}`,
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
      a.download = data.fileName ?? 'kontrak.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={() => void download()}
        disabled={busy}
        className="tk-btn-secondary !px-2 !py-1 !text-xs"
      >
        {busy ? '…' : 'PDF'}
      </button>
      {error ? <span className="text-red-600">{error}</span> : null}
    </span>
  );
}
