'use client';

import { useState } from 'react';
import { CloudinaryUpload } from '@/components/cloudinary-upload';

export function DocUpload({ workspaceId }: { workspaceId: string }) {
  const [url, setUrl] = useState('');
  return (
    <div>
      <CloudinaryUpload
        workspaceId={workspaceId}
        folder="tenant-docs"
        onUploaded={(u) => setUrl(u)}
      />
      <input type="hidden" name="fileUrl" value={url} required={false} />
      {!url && (
        <input
          name="fileUrl"
          required
          placeholder="atau paste URL file"
          className="mt-2 w-full tk-input text-sm"
          onChange={(e) => setUrl(e.target.value)}
        />
      )}
      {url && (
        <p className="mt-1 truncate text-xs text-emerald-700">File siap</p>
      )}
    </div>
  );
}
