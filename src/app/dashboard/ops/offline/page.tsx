'use client';

import { useEffect, useState } from 'react';
import { EmptyState, PageHeader } from '@/components/ui';
import {
  listDrafts,
  removeDraft,
  saveDraft,
  type OfflineDraft,
} from '@/lib/offline-drafts';

const KIND_LABEL: Record<OfflineDraft['kind'], string> = {
  meter: 'Bacaan meter',
  inspection: 'Inspeksi',
  maintenance: 'Pemeliharaan',
};

export default function OfflineDraftsPage() {
  const [drafts, setDrafts] = useState<OfflineDraft[]>([]);
  const [kind, setKind] = useState<OfflineDraft['kind']>('meter');
  const [note, setNote] = useState('');

  function refresh() {
    setDrafts(listDrafts());
  }

  useEffect(() => {
    const timeout = window.setTimeout(refresh, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader
        title="Offline drafts"
        description="Simpan meter, inspeksi, atau maintenance saat offline. Sync manual nanti."
      />
      <div className="tk-card mt-6 space-y-3 p-5">
        <label className="tk-field">
          <span className="tk-label">Jenis</span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as OfflineDraft['kind'])}
            className="tk-select"
          >
            <option value="meter">Bacaan meter</option>
            <option value="inspection">Inspeksi</option>
            <option value="maintenance">Pemeliharaan</option>
          </select>
        </label>
        <label className="tk-field">
          <span className="tk-label">Catatan</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Catatan draft…"
            className="tk-input resize-y"
          />
        </label>
        <button
          type="button"
          onClick={() => {
            saveDraft(kind, { note, offline: true });
            setNote('');
            refresh();
          }}
          className="tk-btn w-full"
        >
          Simpan draft lokal
        </button>
      </div>

      {drafts.length === 0 ? (
        <EmptyState
          className="mt-6"
          title="Belum ada draft"
          body="Draft tersimpan di browser ini saja."
        />
      ) : (
        <ul className="mt-6 space-y-2">
          {drafts.map((d) => (
            <li
              key={d.id}
              className="tk-card flex items-start justify-between gap-2 px-4 py-3 text-sm"
            >
              <div className="min-w-0">
                <p className="font-semibold text-zinc-900">
                  {KIND_LABEL[d.kind] ?? d.kind}{' '}
                  <span className="text-xs font-normal text-zinc-400">
                    {d.createdAt.slice(0, 16).replace('T', ' ')}
                  </span>
                </p>
                <p className="mt-1 truncate text-xs text-zinc-500">
                  {typeof d.payload === 'object' &&
                  d.payload &&
                  'note' in d.payload
                    ? String((d.payload as { note?: string }).note ?? '')
                    : JSON.stringify(d.payload)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  removeDraft(d.id);
                  refresh();
                }}
                className="shrink-0 text-xs font-medium text-red-700 hover:underline"
              >
                Hapus
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
