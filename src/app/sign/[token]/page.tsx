'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function SignContractPage() {
  const params = useParams();
  const token = String(params.token ?? '');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [doc, setDoc] = useState<{
    bodyHtml: string;
    status: string;
    signerName: string | null;
    leaseNumber: string;
  } | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [typedSignature, setTypedSignature] = useState(false);
  const drawing = useRef(false);

  useEffect(() => {
    void fetch(`${API}/v1/public/sign/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.message) throw new Error(d.message);
        setDoc(d);
        setName(d.signerName ?? '');
        if (d.status === 'signed') setDone(true);
      })
      .catch((e) => setError(e.message));
  }, [token]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 2;
    const pos = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const down = (e: PointerEvent) => {
      drawing.current = true;
      const p = pos(e);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    };
    const move = (e: PointerEvent) => {
      if (!drawing.current) return;
      const p = pos(e);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      setHasSignature(true);
    };
    const up = () => {
      drawing.current = false;
    };
    c.addEventListener('pointerdown', down);
    c.addEventListener('pointermove', move);
    c.addEventListener('pointerup', up);
    c.addEventListener('pointerleave', up);
    return () => {
      c.removeEventListener('pointerdown', down);
      c.removeEventListener('pointermove', move);
      c.removeEventListener('pointerup', up);
      c.removeEventListener('pointerleave', up);
    };
  }, [doc]);

  async function submit() {
    setError(null);
    const c = canvasRef.current;
    if (!c || !name.trim() || (!hasSignature && !typedSignature)) {
      setError('Nama & tanda tangan wajib');
      return;
    }
    const signatureData = typedSignature
      ? `data:text/plain;charset=utf-8,${encodeURIComponent(name.trim())}`
      : c.toDataURL('image/png');
    const res = await fetch(`${API}/v1/public/sign/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signerName: name, signatureData }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.message ?? 'Gagal tanda tangan');
      return;
    }
    setDone(true);
  }

  if (error && !doc) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-zinc-50 px-6">
        <div className="tk-card max-w-md p-8 text-center">
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        </div>
      </div>
    );
  }
  if (!doc) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-zinc-50 px-6">
        <p className="text-sm text-zinc-500">Memuat kontrak…</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <p className="text-xs font-medium tracking-wide text-emerald-800 uppercase">
            E-sign
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-900">
            Tanda tangan kontrak
          </h1>
          <p className="mt-1 text-sm text-zinc-500">{doc.leaseNumber}</p>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-8">
        <div
          className="tk-contract tk-card max-w-none p-5 text-sm sm:p-6"
          dangerouslySetInnerHTML={{ __html: doc.bodyHtml }}
        />
        {done ? (
          <div className="tk-alert mt-6" data-variant="success">
            Kontrak sudah ditandatangani. Terima kasih.
          </div>
        ) : (
          <div className="tk-card mt-6 space-y-4 p-5">
            <h2 className="text-base font-semibold text-zinc-900">
              Formulir tanda tangan
            </h2>
            <label className="tk-field">
              <span className="tk-label">Nama penandatangan</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="tk-input"
                autoComplete="name"
              />
            </label>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-zinc-800">
                Metode tanda tangan
              </legend>
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={typedSignature}
                  onChange={(event) => setTypedSignature(event.target.checked)}
                />
                Gunakan nama di atas sebagai tanda tangan elektronik
              </label>
            </fieldset>
            <p id="signature-help" className="text-xs text-zinc-500">
              Gambar tanda tangan di kotak, atau pilih tanda tangan elektronik
              berbasis nama.
            </p>
            <canvas
              ref={canvasRef}
              width={500}
              height={160}
              role="img"
              aria-label="Area tanda tangan"
              aria-describedby="signature-help"
              className="w-full touch-none rounded-xl border border-zinc-200 bg-zinc-50"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const canvas = canvasRef.current;
                  canvas
                    ?.getContext('2d')
                    ?.clearRect(0, 0, canvas.width, canvas.height);
                  setHasSignature(false);
                }}
                className="tk-btn-secondary"
              >
                Hapus tanda tangan
              </button>
              <button
                type="button"
                onClick={() => void submit()}
                className="tk-btn"
              >
                Tanda tangani
              </button>
            </div>
            {error ? (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
