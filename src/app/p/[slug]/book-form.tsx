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
  accentForeground,
}: {
  slug: string;
  rooms: Room[];
  accent: string;
  accentForeground: string;
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
      <p className="mt-6 text-sm text-zinc-500">
        Tidak ada kamar tersedia untuk booking online.
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => void submit(e)}
      className="tk-card mt-8 space-y-3 p-5"
    >
      <h2 className="text-base font-semibold text-zinc-900">Booking online</h2>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-zinc-800">Kamar</span>
        <select
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="tk-input w-full"
          required
        >
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} - Rp {Number(r.rentAmount).toLocaleString('id-ID')}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-zinc-800">Nama lengkap</span>
        <input
          name="name"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="tk-input w-full"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-zinc-800">WhatsApp / telepon</span>
        <input
          type="tel"
          name="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          className="tk-input w-full"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-zinc-800">Email (opsional)</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="tk-input w-full"
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {msg && (
        <p role="status" className="text-sm text-emerald-800">
          {msg}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl py-3 text-sm font-medium transition active:scale-[0.98] disabled:opacity-50"
        style={{ backgroundColor: accent, color: accentForeground }}
      >
        {busy ? 'Memproses…' : 'Booking & bayar fee'}
      </button>
    </form>
  );
}
