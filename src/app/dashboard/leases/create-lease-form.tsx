'use client';

import { useMemo, useState } from 'react';

type Property = { id: string; name: string };
type Room = {
  id: string;
  name: string;
  propertyId: string;
  status: string;
  rentAmount: string | number;
};
type Tenant = { id: string; fullName: string };

export function CreateLeaseForm({
  workspaceId,
  properties,
  rooms,
  tenants,
  today,
  action,
}: {
  workspaceId: string;
  properties: Property[];
  rooms: Room[];
  tenants: Tenant[];
  today: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? '');
  const filteredRooms = useMemo(
    () => rooms.filter((r) => r.propertyId === propertyId),
    [rooms, propertyId],
  );
  const [roomId, setRoomId] = useState(filteredRooms[0]?.id ?? '');
  const selectedRoom = filteredRooms.find((r) => r.id === roomId);

  return (
    <form action={action} className="mt-8 rounded-xl border border-zinc-200 bg-white p-6">
      <h2 className="font-medium">Buat kontrak (draft)</h2>
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span>Properti</span>
          <select
            name="propertyId"
            required
            value={propertyId}
            onChange={(e) => {
              const next = e.target.value;
              setPropertyId(next);
              const first = rooms.find((r) => r.propertyId === next);
              setRoomId(first?.id ?? '');
            }}
            className="rounded-lg border border-zinc-300 px-3 py-2"
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Kamar</span>
          <select
            name="roomId"
            required
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2"
          >
            {filteredRooms.length === 0 ? (
              <option value="">Tidak ada kamar</option>
            ) : (
              filteredRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.status})
                </option>
              ))
            )}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span>Penyewa</span>
          <select
            name="tenantId"
            required
            className="rounded-lg border border-zinc-300 px-3 py-2"
            defaultValue={tenants[0]?.id}
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.fullName}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Mulai</span>
          <input
            type="date"
            name="startDate"
            required
            defaultValue={today}
            className="rounded-lg border border-zinc-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Selesai (opsional)</span>
          <input
            type="date"
            name="endDate"
            className="rounded-lg border border-zinc-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Sewa (IDR)</span>
          <input
            type="number"
            name="rentAmount"
            min={0}
            step={1000}
            defaultValue={Number(selectedRoom?.rentAmount ?? 0)}
            key={`rent-${roomId}`}
            className="rounded-lg border border-zinc-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Deposit (IDR)</span>
          <input
            type="number"
            name="depositAmount"
            min={0}
            step={1000}
            defaultValue={0}
            className="rounded-lg border border-zinc-300 px-3 py-2"
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={!roomId}
        className="mt-4 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
      >
        Simpan draft
      </button>
    </form>
  );
}
