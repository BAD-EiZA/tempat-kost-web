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
  const [open, setOpen] = useState(false);
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
      setMsg('Bukti terkirim, menunggu verifikasi finance');
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
    <div className="text-xs">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-sm font-medium text-emerald-800 underline-offset-2 hover:underline"
        aria-expanded={open}
      >
        {open ? 'Tutup unggah bukti' : 'Unggah bukti transfer'}
      </button>
      {open ? (
        <div className="mt-3 space-y-2 rounded-xl border border-zinc-100 bg-zinc-50 p-3">
          <CloudinaryUpload
            workspaceId={workspaceId}
            folder="payment-proofs"
            onUploaded={(url) => setProofUrl(url)}
          />
          {proofUrl ? (
            <p className="truncate text-emerald-800">Bukti siap dikirim</p>
          ) : null}
          <label className="tk-field">
            <span className="tk-label text-xs">No. referensi (opsional)</span>
            <input
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              className="tk-input w-full !py-1.5 !text-xs"
            />
          </label>
          <button
            type="button"
            disabled={busy || !proofUrl}
            onClick={() => void submit()}
            className="tk-btn-sm disabled:opacity-50"
          >
            {busy ? 'Mengirim…' : 'Kirim bukti'}
          </button>
          {msg ? (
            <p className="text-emerald-800" role="status">
              {msg}
            </p>
          ) : null}
          {error ? (
            <p className="text-red-600" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
