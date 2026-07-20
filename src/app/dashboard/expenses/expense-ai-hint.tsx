'use client';

import { useState } from 'react';

export function ExpenseAiHint({ workspaceId }: { workspaceId: string }) {
  const [desc, setDesc] = useState('');
  const [hint, setHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function suggest() {
    if (!desc.trim() || !workspaceId) return;
    setBusy(true);
    setHint(null);
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: '/v1/ai/expense-categorization',
          body: { workspaceId, description: desc },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Gagal');
      const cats = (data.resultJson as { categories?: Array<{ key: string; label: string }> })
        ?.categories;
      if (cats?.length) {
        setHint(
          cats.map((c) => `${c.label} (${c.key})`).join(' · ') +
            ' - salin ke field kategori',
        );
        const input = document.querySelector<HTMLInputElement>(
          'input[name="category"]',
        );
        if (input && cats[0]) input.value = cats[0].key;
      } else setHint(JSON.stringify(data.resultJson ?? data).slice(0, 200));
    } catch (e) {
      setHint(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 p-3">
      <p className="text-xs font-medium text-zinc-600">AI kategori (opsional)</p>
      <div className="mt-2 flex gap-2">
        <input
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Deskripsi untuk AI…"
          className="flex-1 rounded-lg border border-zinc-200 px-2 py-1.5 text-xs"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => void suggest()}
          className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs disabled:opacity-50"
        >
          {busy ? '…' : 'Saran'}
        </button>
      </div>
      {hint && <p className="mt-2 text-[10px] text-zinc-600">{hint}</p>}
    </div>
  );
}
