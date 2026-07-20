'use client';

import { useState } from 'react';

export default function AdminPage() {
  const [secret, setSecret] = useState('');
  const [overview, setOverview] = useState<Record<string, number> | null>(null);
  const [workspaces, setWorkspaces] = useState<
    Array<{
      id: string;
      name: string;
      slug: string;
      subscription?: { status: string; plan?: { name: string } } | null;
    }>
  >([]);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const [o, w] = await Promise.all([
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/v1/admin/overview`,
          { headers: { 'x-internal-secret': secret } },
        ),
        fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/v1/admin/workspaces`,
          { headers: { 'x-internal-secret': secret } },
        ),
      ]);
      if (!o.ok || !w.ok) throw new Error('Unauthorized / gagal load');
      setOverview(await o.json());
      setWorkspaces(await w.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }

  async function extend(workspaceId: string) {
    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/v1/admin/extend-trial`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': secret,
        },
        body: JSON.stringify({ workspaceId, days: 14 }),
      },
    );
    await load();
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold">Super Admin</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Pakai INTERNAL_API_SECRET (bukan session user).
      </p>
      <div className="mt-6 flex gap-2">
        <input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="x-internal-secret"
          className="flex-1 tk-input"
        />
        <button
          type="button"
          onClick={load}
          className="tk-btn"
        >
          Load
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {overview && (
        <pre className="mt-6 overflow-auto tk-card p-4 text-xs">
          {JSON.stringify(overview, null, 2)}
        </pre>
      )}
      <ul className="tk-list mt-6">
        {workspaces.map((ws) => (
          <li
            key={ws.id}
            className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
          >
            <div>
              <p className="font-medium">{ws.name}</p>
              <p className="text-xs text-zinc-500">
                {ws.slug} · {ws.subscription?.status ?? '-'} ·{' '}
                {ws.subscription?.plan?.name ?? '-'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => extend(ws.id)}
              className="tk-btn-secondary !px-2 !py-1 !text-xs"
            >
              +14d trial
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
