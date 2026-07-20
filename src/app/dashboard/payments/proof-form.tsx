'use client';

import { useState } from 'react';

export function ProofPaymentForm({
  action,
  workspaceId,
  invoiceId,
  amount,
}: {
  action: (formData: FormData) => Promise<void>;
  workspaceId: string;
  invoiceId: string;
  amount: number;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <form action={action} className="mt-2 space-y-2 rounded-lg border border-zinc-100 bg-zinc-50 p-3">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <input type="hidden" name="amount" value={amount} />
      <input type="hidden" name="runAiOcr" value="1" />
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          name="manualReference"
          placeholder="No. referensi"
          className="tk-input !px-2 !py-1 !text-xs"
        />
        <input
          name="proofUrl"
          placeholder="URL bukti (Cloudinary)"
          className="tk-input !px-2 !py-1 !text-xs"
          onChange={(e) => setPreview(e.target.value || null)}
        />
      </div>
      <label className="block text-xs text-zinc-600">
        Atau tempel base64 gambar (opsional)
        <textarea
          name="proofBase64"
          rows={2}
          className="tk-input mt-1 w-full font-mono !text-[10px]"
          placeholder="data:image/jpeg;base64,..."
        />
      </label>
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="Pratinjau bukti pembayaran"
          className="max-h-24 rounded-lg border border-zinc-200"
        />
      ) : null}
      <button
        type="submit"
        className="tk-btn-sm"
      >
        Upload bukti + AI OCR
      </button>
    </form>
  );
}
