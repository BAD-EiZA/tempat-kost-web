'use client';

import { useState } from 'react';
import { CloudinaryUpload } from '@/components/cloudinary-upload';

export function ProofUploadField({
  workspaceId,
  name = 'proofUrl',
}: {
  workspaceId: string;
  name?: string;
}) {
  const [url, setUrl] = useState('');
  return (
    <div className="w-full space-y-1">
      <CloudinaryUpload
        workspaceId={workspaceId}
        folder="payment-proofs"
        onUploaded={(u) => setUrl(u)}
      />
      <input type="hidden" name={name} value={url} />
      {url ? (
        <p className="truncate text-[10px] text-emerald-700">Uploaded ✓</p>
      ) : (
        <input
          name={name}
          placeholder="atau paste URL"
          className="w-full rounded border border-zinc-300 px-2 py-1 text-xs"
          onChange={(e) => setUrl(e.target.value)}
        />
      )}
    </div>
  );
}
