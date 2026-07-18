'use client';

import { useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        opts?: {
          onSuccess?: () => void;
          onPending?: () => void;
          onError?: () => void;
          onClose?: () => void;
        },
      ) => void;
    };
  }
}

type Room = {
  id: string;
  name: string;
  rentAmount: string | number;
};

export function PublicBookForm({
  slug,
  rooms,
  accent,
}: {
  slug: string;
  rooms: Room[];
  accent: string;
}) {
  const [roomId, setRoomId] = useState(rooms[0]?.id ?? '');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch(`${API}/v1/public/properties/${slug}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          fullName,
          phone,
          email: email || undefined,
        }),
      });
      const data = (await res.json()) as {
        bookingId?: string;
        feeAmount?: number;
        holdUntil?: string;
        payment?: {
          token?: string;
          redirectUrl?: string;
          clientKey?: string;
          isProduction?: boolean;
        } | null;
        message?: string;
      };
      if (!res.ok) throw new Error(data.message ?? 'Gagal booking');

      setMsg(
        `Booking dibuat. Fee Rp ${Number(data.feeAmount ?? 0).toLocaleString('id-ID')}. Hold sampai ${String(data.holdUntil).slice(0, 10)}.`,
      );

      if (data.payment?.token) {
        const snapUrl = data.payment.isProduction
          ? 'https://app.midtrans.com/snap/snap.js'
          : 'https://app.sandbox.midtrans.com/snap/snap.js';
        if (!window.snap) {
          await new Promise<void>((resolve, reject) => {
            const s = document.createElement('script');
            s.src = snapUrl;
            if (data.payment?.clientKey) {
              s.setAttribute('data-client-key', data.payment.clientKey);
            }
            s.onload = () => resolve();
            s.onerror = () => reject(new Error('Snap gagal dimuat'));
            document.body.appendChild(s);
          });
        }
        window.snap?.pay(data.payment.token);
      } else if (data.payment?.redirectUrl) {
        window.location.href = data.payment.redirectUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setBusy(false);
    }
  }

  if (!rooms.length) {
    return (
      <p className="mt-6 text-sm text-zinc-500">Tidak ada kamar tersedia untuk booking online.</p>
    );
  }

  return (
    <form
      onSubmit={(e) => void submit(e)}
      className="mt-8 space-y-3 rounded-xl border bg-white p-5"
    >
      <h2 className="font-semibold">Booking online</h2>
      <label className="block text-sm">
        Kamar
        <select
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2"
          required
        >
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} — Rp {Number(r.rentAmount).toLocaleString('id-ID')}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Nama lengkap
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        WhatsApp / telepon
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Email (opsional)
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {msg && <p className="text-sm text-emerald-700">{msg}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl py-3 text-sm font-medium text-white disabled:opacity-50"
        style={{ backgroundColor: accent }}
      >
        {busy ? 'Memproses…' : 'Booking & bayar fee'}
      </button>
    </form>
  );
}
