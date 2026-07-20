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
    <form action={action} className="tk-card mt-8 p-6">
      <h2 className="text-base font-semibold text-zinc-900">
        Buat kontrak (draft)
      </h2>
      <p className="mt-1 text-sm text-zinc-500">
        Isi properti, kamar, penyewa, dan nominal sewa.
      </p>
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="tk-field">
          <span className="tk-label">Properti</span>
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
            className="tk-select"
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="tk-field">
          <span className="tk-label">Kamar</span>
          <select
            name="roomId"
            required
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="tk-select"
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
        <label className="tk-field sm:col-span-2">
          <span className="tk-label">Penyewa</span>
          <select
            name="tenantId"
            required
            className="tk-select"
            defaultValue={tenants[0]?.id}
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.fullName}
              </option>
            ))}
          </select>
        </label>
        <label className="tk-field">
          <span className="tk-label">Mulai</span>
          <input
            type="date"
            name="startDate"
            required
            defaultValue={today}
            className="tk-input"
          />
        </label>
        <label className="tk-field">
          <span className="tk-label">Selesai (opsional)</span>
          <input type="date" name="endDate" className="tk-input" />
        </label>
        <label className="tk-field">
          <span className="tk-label">Sewa (IDR)</span>
          <input
            type="number"
            name="rentAmount"
            min={0}
            step={1000}
            defaultValue={Number(selectedRoom?.rentAmount ?? 0)}
            key={`rent-${roomId}`}
            className="tk-input"
          />
        </label>
        <label className="tk-field">
          <span className="tk-label">Deposit (IDR)</span>
          <input
            type="number"
            name="depositAmount"
            min={0}
            step={1000}
            defaultValue={0}
            className="tk-input"
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={!roomId}
        className="tk-btn mt-4 disabled:opacity-50"
      >
        Simpan draft
      </button>
    </form>
  );
}
