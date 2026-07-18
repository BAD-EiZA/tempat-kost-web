'use client';

import { useEffect, useState } from 'react';
import {
  listDrafts,
  removeDraft,
  saveDraft,
  type OfflineDraft,
} from '@/lib/offline-drafts';

export default function OfflineDraftsPage() {
  const [drafts, setDrafts] = useState<OfflineDraft[]>([]);
  const [kind, setKind] = useState<OfflineDraft['kind']>('meter');
  const [note, setNote] = useState('');

  function refresh() {
    setDrafts(listDrafts());
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold">Offline drafts</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Simpan meter / inspeksi / maintenance saat offline, sync manual nanti.
      </p>
      <div className="mt-6 space-y-2 rounded-xl border bg-white p-4">
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as OfflineDraft['kind'])}
          className="w-full rounded border px-3 py-2 text-sm"
        >
          <option value="meter">Meter reading</option>
          <option value="inspection">Inspection</option>
          <option value="maintenance">Maintenance</option>
        </select>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Catatan draft…"
          className="w-full rounded border px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => {
            saveDraft(kind, { note, offline: true });
            setNote('');
            refresh();
          }}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white"
        >
          Simpan draft lokal
        </button>
      </div>
      <ul className="mt-6 divide-y rounded-xl border bg-white">
        {drafts.length === 0 ? (
          <li className="p-4 text-sm text-zinc-500">Belum ada draft.</li>
        ) : (
          drafts.map((d) => (
            <li
              key={d.id}
              className="flex items-start justify-between gap-2 px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium">
                  {d.kind}{' '}
                  <span className="text-xs font-normal text-zinc-400">
                    {d.createdAt.slice(0, 16).replace('T', ' ')}
                  </span>
                </p>
                <p className="text-xs text-zinc-500">
                  {JSON.stringify(d.payload)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  removeDraft(d.id);
                  refresh();
                }}
                className="text-xs text-red-600"
              >
                Hapus
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
