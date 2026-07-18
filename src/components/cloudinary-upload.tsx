'use client';

import { useState } from 'react';

type Signed = {
  uploadUrl: string;
  folder: string;
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
};

export function CloudinaryUpload({
  workspaceId,
  folder = 'payment-proofs',
  onUploaded,
}: {
  workspaceId: string;
  folder?: string;
  onUploaded: (url: string, publicId: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | null) {
    if (!file || !workspaceId) return;
    setBusy(true);
    setError(null);
    try {
      const signRes = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: '/v1/files/signed-upload',
          body: { workspaceId, folder },
        }),
      });
      const signed = (await signRes.json()) as Signed & { message?: string };
      if (!signRes.ok) throw new Error(signed.message ?? 'Sign failed');

      const fd = new FormData();
      fd.append('file', file);
      fd.append('api_key', signed.apiKey);
      fd.append('timestamp', String(signed.timestamp));
      fd.append('signature', signed.signature);
      fd.append('folder', signed.folder);

      const up = await fetch(signed.uploadUrl, { method: 'POST', body: fd });
      const data = (await up.json()) as {
        secure_url?: string;
        public_id?: string;
        error?: { message?: string };
      };
      if (!up.ok || !data.secure_url) {
        throw new Error(data.error?.message ?? 'Upload failed');
      }
      onUploaded(data.secure_url, data.public_id ?? '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="text-xs">
      <input
        type="file"
        accept="image/*,application/pdf"
        disabled={busy || !workspaceId}
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
      {busy && <p className="mt-1 text-zinc-500">Mengunggah…</p>}
      {error && <p className="mt-1 text-red-600">{error}</p>}
    </div>
  );
}
