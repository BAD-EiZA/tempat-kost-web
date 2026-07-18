'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

type Role = {
  id: string;
  key: string;
  name: string;
  isSystem: boolean;
  permissions: Array<{ resource: string; action: string }>;
};

function RolesInner() {
  const sp = useSearchParams();
  const workspaceId = sp.get('workspaceId') ?? '';
  const [roles, setRoles] = useState<Role[]>([]);
  const [catalog, setCatalog] = useState<{
    resources: string[];
    actions: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [editSelected, setEditSelected] = useState<Record<string, boolean>>({});
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    if (!workspaceId) return;
    const [r, c] = await Promise.all([
      fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: `/v1/team/roles?workspaceId=${workspaceId}`,
          method: 'GET',
        }),
      }),
      fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: '/v1/team/roles/catalog',
          method: 'GET',
        }),
      }),
    ]);
    const rData = await r.json();
    const cData = await c.json();
    if (Array.isArray(rData)) setRoles(rData);
    else setError(rData.message ?? 'Gagal load roles');
    if (cData.resources) setCatalog(cData);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  function permsFromMap(map: Record<string, boolean>) {
    return Object.entries(map)
      .filter(([, v]) => v)
      .map(([k]) => {
        const [resource, action] = k.split(':');
        return { resource, action };
      });
  }

  async function createRole() {
    setError(null);
    setMsg(null);
    const res = await fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: '/v1/team/roles',
        body: {
          workspaceId,
          key,
          name,
          permissions: permsFromMap(selected),
        },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.message ?? 'Gagal buat role');
      return;
    }
    setName('');
    setKey('');
    setSelected({});
    setMsg('Role dibuat');
    await load();
  }

  function startEdit(role: Role) {
    setEditId(role.id);
    const map: Record<string, boolean> = {};
    for (const p of role.permissions) {
      map[`${p.resource}:${p.action}`] = true;
    }
    setEditSelected(map);
  }

  async function saveEdit() {
    if (!editId) return;
    setError(null);
    setMsg(null);
    const res = await fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: `/v1/team/roles/${editId}/permissions`,
        method: 'PUT',
        body: { permissions: permsFromMap(editSelected) },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.message ?? 'Gagal update');
      return;
    }
    setEditId(null);
    setMsg('Permissions disimpan');
    await load();
  }

  function Matrix({
    value,
    onChange,
  }: {
    value: Record<string, boolean>;
    onChange: (v: Record<string, boolean>) => void;
  }) {
    if (!catalog) return null;
    return (
      <div className="mt-2 max-h-56 overflow-auto text-xs">
        {catalog.resources.map((res) => (
          <div key={res} className="mb-2">
            <p className="font-medium">{res}</p>
            <div className="flex flex-wrap gap-2">
              {catalog.actions.map((act) => {
                const k = `${res}:${act}`;
                return (
                  <label key={k} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={!!value[k]}
                      onChange={(e) =>
                        onChange({ ...value, [k]: e.target.checked })
                      }
                    />
                    {act}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold">Custom roles</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Workspace: {workspaceId || '—'} · edit permission role existing
      </p>
      {!workspaceId && (
        <p className="mt-4 text-sm text-amber-700">
          Buka dari{' '}
          <Link href="/dashboard/team" className="underline">
            Tim
          </Link>
          .
        </p>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {msg && <p className="mt-3 text-sm text-emerald-700">{msg}</p>}

      <ul className="mt-6 space-y-3">
        {roles.map((r) => (
          <li key={r.id} className="rounded-xl border bg-white p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-medium">{r.name}</span>
                <span className="text-xs text-zinc-500">
                  {' '}
                  ({r.key}) {r.isSystem ? 'system' : 'custom'} ·{' '}
                  {r.permissions.length} perms
                </span>
              </div>
              {r.key !== 'owner' && (
                <button
                  type="button"
                  onClick={() => startEdit(r)}
                  className="rounded border px-2 py-1 text-xs"
                >
                  Edit permissions
                </button>
              )}
            </div>
            {editId === r.id && (
              <div className="mt-3 border-t pt-3">
                <Matrix value={editSelected} onChange={setEditSelected} />
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void saveEdit()}
                    className="rounded bg-zinc-900 px-3 py-1 text-xs text-white"
                  >
                    Simpan
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditId(null)}
                    className="rounded border px-3 py-1 text-xs"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {catalog && workspaceId && (
        <div className="mt-8 rounded-xl border bg-white p-6">
          <h2 className="font-medium">Buat role baru</h2>
          <div className="mt-3 flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama"
              className="rounded border px-3 py-2 text-sm"
            />
            <input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="key"
              className="rounded border px-3 py-2 text-sm"
            />
          </div>
          <Matrix value={selected} onChange={setSelected} />
          <button
            type="button"
            onClick={() => void createRole()}
            className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white"
          >
            Simpan role
          </button>
        </div>
      )}
    </div>
  );
}

export default function RolesPage() {
  return (
    <Suspense fallback={<p className="text-sm">Memuat…</p>}>
      <RolesInner />
    </Suspense>
  );
}
