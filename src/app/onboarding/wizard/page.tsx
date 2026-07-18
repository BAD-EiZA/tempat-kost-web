'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Draft = {
  id: string;
  step: string;
  answersJson: Record<string, unknown>;
  suggestionJson?: Record<string, unknown> | null;
};

const STEPS = ['basics', 'ops', 'review'] as const;

export default function OnboardingWizardPage() {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [city, setCity] = useState('Jakarta');
  const [rooms, setRooms] = useState(12);
  const [props, setProps] = useState(1);
  const [electricityBy, setElectricityBy] = useState('tenant');
  const [waterBy, setWaterBy] = useState('owner');
  const [hasDeposit, setHasDeposit] = useState(true);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [workspaceId, setWorkspaceId] = useState('');
  const [applyResult, setApplyResult] = useState<string | null>(null);

  async function proxy(path: string, body?: object, method = 'POST') {
    const res = await fetch('/api/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, body, method }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? 'Gagal');
    return data;
  }

  useEffect(() => {
    void (async () => {
      try {
        const d = await proxy('/v1/onboarding/draft', undefined, 'GET');
        setDraft(d);
        const a = (d.answersJson ?? {}) as Record<string, unknown>;
        if (a.city) setCity(String(a.city));
        if (a.estimatedRooms) setRooms(Number(a.estimatedRooms));
        if (a.propertyCount) setProps(Number(a.propertyCount));
        if (a.electricityBy) setElectricityBy(String(a.electricityBy));
        if (a.waterBy) setWaterBy(String(a.waterBy));
        if (typeof a.hasDeposit === 'boolean') setHasDeposit(a.hasDeposit);
        if (a.billingCycle) setBillingCycle(String(a.billingCycle));
        const si = STEPS.indexOf(d.step as (typeof STEPS)[number]);
        if (si >= 0) setStepIdx(si);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error');
      }
    })();
  }, []);

  async function saveStep(next?: number) {
    if (!draft) return;
    setBusy(true);
    setError(null);
    try {
      const step = STEPS[stepIdx];
      const answers = {
        city,
        estimatedRooms: rooms,
        propertyCount: props,
        electricityBy,
        waterBy,
        hasDeposit,
        billingCycle,
      };
      await proxy('/v1/onboarding/step', {
        draftId: draft.id,
        step,
        answers,
      });
      if (typeof next === 'number') setStepIdx(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  async function applySuggestion() {
    if (!draft || !workspaceId) {
      setError('Isi workspaceId dulu');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const data = await proxy('/v1/onboarding/apply', {
        draftId: draft.id,
        workspaceId,
      });
      setApplyResult(
        `Property ${data.property?.name} · ${data.roomsCreated} kamar`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  async function saveAndSuggest() {
    if (!draft) return;
    setBusy(true);
    setError(null);
    try {
      await proxy('/v1/onboarding/step', {
        draftId: draft.id,
        step: 'review',
        answers: {
          city,
          estimatedRooms: rooms,
          propertyCount: props,
          electricityBy,
          waterBy,
          hasDeposit,
          billingCycle,
        },
      });
      const updated = await proxy('/v1/onboarding/suggest', {
        draftId: draft.id,
      });
      setDraft(updated);
      setStepIdx(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  const step = STEPS[stepIdx];

  return (
    <div className="mx-auto max-w-lg px-6 py-12">
      <h1 className="text-2xl font-semibold">Wizard onboarding</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Multi-step setup → saran struktur AI (preview, konfirmasi manual).
      </p>
      <div className="mt-4 flex gap-2">
        {STEPS.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => setStepIdx(i)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              i === stepIdx ? 'bg-zinc-900 text-white' : 'bg-zinc-100'
            }`}
          >
            {i + 1}. {s}
          </button>
        ))}
      </div>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-6 space-y-3 rounded-xl border bg-white p-6">
        {step === 'basics' && (
          <>
            <label className="block text-sm">
              Kota
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              Perkiraan kamar
              <input
                type="number"
                value={rooms}
                onChange={(e) => setRooms(Number(e.target.value))}
                className="mt-1 w-full rounded border px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              Jumlah properti
              <input
                type="number"
                value={props}
                onChange={(e) => setProps(Number(e.target.value))}
                className="mt-1 w-full rounded border px-3 py-2"
              />
            </label>
            <button
              type="button"
              disabled={busy || !draft}
              onClick={() => void saveStep(1)}
              className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm text-white disabled:opacity-50"
            >
              Lanjut ops →
            </button>
          </>
        )}

        {step === 'ops' && (
          <>
            <label className="block text-sm">
              Listrik ditanggung
              <select
                value={electricityBy}
                onChange={(e) => setElectricityBy(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2"
              >
                <option value="tenant">Penyewa</option>
                <option value="owner">Pemilik</option>
              </select>
            </label>
            <label className="block text-sm">
              Air ditanggung
              <select
                value={waterBy}
                onChange={(e) => setWaterBy(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2"
              >
                <option value="tenant">Penyewa</option>
                <option value="owner">Pemilik</option>
              </select>
            </label>
            <label className="block text-sm">
              Siklus tagihan
              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2"
              >
                <option value="monthly">Bulanan</option>
                <option value="yearly">Tahunan</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={hasDeposit}
                onChange={(e) => setHasDeposit(e.target.checked)}
              />
              Pakai deposit
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setStepIdx(0)}
                className="flex-1 rounded-lg border py-2.5 text-sm"
              >
                ← Kembali
              </button>
              <button
                type="button"
                disabled={busy || !draft}
                onClick={() => void saveStep(2)}
                className="flex-1 rounded-lg bg-zinc-900 py-2.5 text-sm text-white disabled:opacity-50"
              >
                Review →
              </button>
            </div>
          </>
        )}

        {step === 'review' && (
          <>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-500">Kota</dt>
                <dd>{city}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Properti / kamar</dt>
                <dd>
                  {props} / {rooms}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Listrik / air</dt>
                <dd>
                  {electricityBy} / {waterBy}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Billing</dt>
                <dd>{billingCycle}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Deposit</dt>
                <dd>{hasDeposit ? 'Ya' : 'Tidak'}</dd>
              </div>
            </dl>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setStepIdx(1)}
                className="flex-1 rounded-lg border py-2.5 text-sm"
              >
                ← Kembali
              </button>
              <button
                type="button"
                disabled={busy || !draft}
                onClick={() => void saveAndSuggest()}
                className="flex-1 rounded-lg bg-zinc-900 py-2.5 text-sm text-white disabled:opacity-50"
              >
                {busy ? '…' : 'Minta saran AI'}
              </button>
            </div>
          </>
        )}
      </div>

      {draft?.suggestionJson && (
        <div className="mt-6 rounded-xl border bg-white p-4">
          <h2 className="font-medium">Saran (preview)</h2>
          <pre className="mt-2 max-h-80 overflow-auto text-xs">
            {JSON.stringify(draft.suggestionJson, null, 2)}
          </pre>
          <label className="mt-3 block text-sm">
            Workspace ID (apply)
            <input
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              placeholder="cuid workspace"
            />
          </label>
          <button
            type="button"
            disabled={busy || !workspaceId}
            onClick={() => void applySuggestion()}
            className="mt-2 w-full rounded-lg bg-emerald-700 py-2 text-sm text-white disabled:opacity-50"
          >
            Apply → buat properti + kamar
          </button>
          {applyResult && (
            <p className="mt-2 text-sm text-emerald-700">{applyResult}</p>
          )}
          <Link
            href="/dashboard"
            className="mt-3 inline-block text-sm underline"
          >
            Lanjut ke dashboard →
          </Link>
        </div>
      )}
    </div>
  );
}
