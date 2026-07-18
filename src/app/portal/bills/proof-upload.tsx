'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CloudinaryUpload } from '@/components/cloudinary-upload';

export function PortalProofUpload({
  tenantId,
  workspaceId,
  invoiceId,
  amount,
}: {
  tenantId: string;
  workspaceId: string;
  invoiceId: string;
  amount: number;
}) {
  const router = useRouter();
  const [proofUrl, setProofUrl] = useState('');
  const [ref, setRef] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!proofUrl) {
      setError('Unggah bukti dulu');
      return;
    }
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: '/v1/portal/proof',
          body: {
            tenantId,
            invoiceId,
            proofUrl,
            amount,
            manualReference: ref || undefined,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Gagal upload bukti');
      setMsg('Bukti terkirim · menunggu verifikasi finance');
      setProofUrl('');
      setRef('');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2 text-xs">
      <p className="font-medium text-zinc-600">Atau unggah bukti transfer</p>
      <CloudinaryUpload
        workspaceId={workspaceId}
        folder="payment-proofs"
        onUploaded={(url) => setProofUrl(url)}
      />
      {proofUrl && (
        <p className="truncate text-emerald-700">Bukti siap diunggah</p>
      )}
      <input
        value={ref}
        onChange={(e) => setRef(e.target.value)}
        placeholder="No. referensi (opsional)"
        className="w-full rounded border px-2 py-1"
      />
      <button
        type="button"
        disabled={busy || !proofUrl}
        onClick={() => void submit()}
        className="rounded bg-zinc-900 px-3 py-1.5 text-white disabled:opacity-50"
      >
        {busy ? '…' : 'Kirim bukti'}
      </button>
      {msg && <p className="text-emerald-700">{msg}</p>}
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
