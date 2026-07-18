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
    ctx.strokeStyle = '#111';
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
    return <p className="p-8 text-center text-sm text-red-600">{error}</p>;
  }
  if (!doc) {
    return <p className="p-8 text-center text-sm">Memuat kontrak…</p>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-xl font-semibold">Tanda tangan kontrak</h1>
      <p className="text-sm text-zinc-600">{doc.leaseNumber}</p>
      <div
        className="tk-contract mt-6 max-w-none rounded-xl border bg-white p-4 text-sm"
        dangerouslySetInnerHTML={{ __html: doc.bodyHtml }}
      />
      {done ? (
        <p className="mt-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
          Kontrak sudah ditandatangani. Terima kasih.
        </p>
      ) : (
        <div className="mt-6 space-y-3 rounded-xl border bg-white p-4">
          <label className="block text-sm">
            Nama penandatangan
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </label>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Metode tanda tangan</legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={typedSignature}
                onChange={(event) => setTypedSignature(event.target.checked)}
              />
              Gunakan nama di atas sebagai tanda tangan elektronik
            </label>
          </fieldset>
          <p id="signature-help" className="text-xs text-zinc-500">
            Gambar tanda tangan di kotak, atau pilih tanda tangan elektronik berbasis nama.
          </p>
          <canvas
            ref={canvasRef}
            width={500}
            height={160}
            role="img"
            aria-label="Area tanda tangan"
            aria-describedby="signature-help"
            className="w-full touch-none rounded border bg-zinc-50"
          />
          <button
            type="button"
            onClick={() => {
              const canvas = canvasRef.current;
              canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
              setHasSignature(false);
            }}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            Hapus tanda tangan
          </button>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          <button
            type="button"
            onClick={() => void submit()}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white"
          >
            Tanda tangani
          </button>
        </div>
      )}
    </div>
  );
}
