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
const STEP_LABEL: Record<(typeof STEPS)[number], string> = {
  basics: 'Dasar',
  ops: 'Operasional',
  review: 'Review',
};

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
      setError('Isi workspace ID dulu');
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
      <p className="text-xs font-medium tracking-wide text-emerald-800 uppercase">
        Onboarding
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
        Wizard setup
      </h1>
      <p className="mt-1 text-sm text-zinc-600">
        Tiga langkah singkat, lalu saran struktur AI (preview, konfirmasi
        manual).
      </p>

      <ol className="mt-5 flex flex-wrap gap-2">
        {STEPS.map((s, i) => (
          <li key={s}>
            <button
              type="button"
              onClick={() => setStepIdx(i)}
              className={
                i === stepIdx
                  ? 'tk-chip tk-chip-active'
                  : i < stepIdx
                    ? 'tk-chip border border-emerald-200 bg-emerald-50 text-emerald-900'
                    : 'tk-chip'
              }
            >
              {i + 1}. {STEP_LABEL[s]}
            </button>
          </li>
        ))}
      </ol>

      {error && (
        <div className="tk-alert mt-4" data-variant="error">
          {error}
        </div>
      )}

      <div className="tk-card mt-6 space-y-4 p-6">
        {step === 'basics' && (
          <>
            <label className="tk-field">
              <span className="tk-label">Kota</span>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="tk-input"
              />
            </label>
            <label className="tk-field">
              <span className="tk-label">Perkiraan kamar</span>
              <input
                type="number"
                value={rooms}
                onChange={(e) => setRooms(Number(e.target.value))}
                className="tk-input"
              />
            </label>
            <label className="tk-field">
              <span className="tk-label">Jumlah properti</span>
              <input
                type="number"
                value={props}
                onChange={(e) => setProps(Number(e.target.value))}
                className="tk-input"
              />
            </label>
            <button
              type="button"
              disabled={busy || !draft}
              onClick={() => void saveStep(1)}
              className="tk-btn w-full !py-2.5 disabled:opacity-50"
            >
              Lanjut operasional
            </button>
          </>
        )}

        {step === 'ops' && (
          <>
            <label className="tk-field">
              <span className="tk-label">Listrik ditanggung</span>
              <select
                value={electricityBy}
                onChange={(e) => setElectricityBy(e.target.value)}
                className="tk-select"
              >
                <option value="tenant">Penyewa</option>
                <option value="owner">Pemilik</option>
              </select>
            </label>
            <label className="tk-field">
              <span className="tk-label">Air ditanggung</span>
              <select
                value={waterBy}
                onChange={(e) => setWaterBy(e.target.value)}
                className="tk-select"
              >
                <option value="tenant">Penyewa</option>
                <option value="owner">Pemilik</option>
              </select>
            </label>
            <label className="tk-field">
              <span className="tk-label">Siklus tagihan</span>
              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value)}
                className="tk-select"
              >
                <option value="monthly">Bulanan</option>
                <option value="yearly">Tahunan</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-700">
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
                className="tk-btn-secondary flex-1 !py-2.5"
              >
                Kembali
              </button>
              <button
                type="button"
                disabled={busy || !draft}
                onClick={() => void saveStep(2)}
                className="tk-btn flex-1 !py-2.5 disabled:opacity-50"
              >
                Review
              </button>
            </div>
          </>
        )}

        {step === 'review' && (
          <>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-zinc-100 pb-2">
                <dt className="text-zinc-500">Kota</dt>
                <dd className="font-medium">{city}</dd>
              </div>
              <div className="flex justify-between border-b border-zinc-100 pb-2">
                <dt className="text-zinc-500">Properti / kamar</dt>
                <dd className="font-medium">
                  {props} / {rooms}
                </dd>
              </div>
              <div className="flex justify-between border-b border-zinc-100 pb-2">
                <dt className="text-zinc-500">Listrik / air</dt>
                <dd className="font-medium">
                  {electricityBy} / {waterBy}
                </dd>
              </div>
              <div className="flex justify-between border-b border-zinc-100 pb-2">
                <dt className="text-zinc-500">Billing</dt>
                <dd className="font-medium">{billingCycle}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">Deposit</dt>
                <dd className="font-medium">{hasDeposit ? 'Ya' : 'Tidak'}</dd>
              </div>
            </dl>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setStepIdx(1)}
                className="tk-btn-secondary flex-1 !py-2.5"
              >
                Kembali
              </button>
              <button
                type="button"
                disabled={busy || !draft}
                onClick={() => void saveAndSuggest()}
                className="tk-btn flex-1 !py-2.5 disabled:opacity-50"
              >
                {busy ? '…' : 'Minta saran AI'}
              </button>
            </div>
          </>
        )}
      </div>

      {draft?.suggestionJson && (
        <div className="tk-card mt-6 p-5">
          <h2 className="text-base font-semibold text-zinc-900">
            Saran AI (preview)
          </h2>
          <pre className="mt-2 max-h-80 overflow-auto rounded-xl bg-zinc-50 p-3 text-xs text-zinc-700">
            {JSON.stringify(draft.suggestionJson, null, 2)}
          </pre>
          <label className="tk-field mt-3">
            <span className="tk-label">Workspace ID (apply)</span>
            <input
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              className="tk-input"
              placeholder="cuid workspace"
            />
          </label>
          <button
            type="button"
            disabled={busy || !workspaceId}
            onClick={() => void applySuggestion()}
            className="tk-btn mt-3 w-full disabled:opacity-50"
          >
            Apply: buat properti + kamar
          </button>
          {applyResult && (
            <div className="tk-alert mt-3" data-variant="success">
              {applyResult}
            </div>
          )}
          <Link
            href="/dashboard"
            className="mt-3 inline-block text-sm font-medium text-emerald-800 underline-offset-2 hover:underline"
          >
            Lanjut ke dashboard
          </Link>
        </div>
      )}

      <p className="mt-6 text-center text-sm text-zinc-500">
        <Link href="/onboarding" className="underline-offset-2 hover:underline">
          Buat workspace manual
        </Link>
      </p>
    </div>
  );
}
