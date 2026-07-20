import { cn } from '@/lib/utils';

const INVOICE: Record<string, { label: string; className: string }> = {
  OPEN: {
    label: 'Belum bayar',
    className: 'bg-amber-50 text-amber-900 ring-amber-200',
  },
  OVERDUE: {
    label: 'Terlambat',
    className: 'bg-red-50 text-red-800 ring-red-200',
  },
  PARTIALLY_PAID: {
    label: 'Sebagian',
    className: 'bg-orange-50 text-orange-900 ring-orange-200',
  },
  PAID: {
    label: 'Lunas',
    className: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
  },
  VOID: {
    label: 'Dibatalkan',
    className: 'bg-zinc-100 text-zinc-600 ring-zinc-200',
  },
  DRAFT: {
    label: 'Draft',
    className: 'bg-zinc-100 text-zinc-600 ring-zinc-200',
  },
  SCHEDULED: {
    label: 'Terjadwal',
    className: 'bg-blue-50 text-blue-900 ring-blue-200',
  },
};

const PAYMENT: Record<string, { label: string; className: string }> = {
  pending: {
    label: 'Menunggu',
    className: 'bg-amber-50 text-amber-900 ring-amber-200',
  },
  PENDING: {
    label: 'Menunggu',
    className: 'bg-amber-50 text-amber-900 ring-amber-200',
  },
  SUBMITTED: {
    label: 'Menunggu',
    className: 'bg-amber-50 text-amber-900 ring-amber-200',
  },
  CONFIRMED: {
    label: 'Dikonfirmasi',
    className: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
  },
  REJECTED: {
    label: 'Ditolak',
    className: 'bg-red-50 text-red-800 ring-red-200',
  },
  settlement: {
    label: 'Berhasil',
    className: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
  },
  SETTLEMENT: {
    label: 'Berhasil',
    className: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
  },
  capture: {
    label: 'Berhasil',
    className: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
  },
  CAPTURE: {
    label: 'Berhasil',
    className: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
  },
  expire: {
    label: 'Kedaluwarsa',
    className: 'bg-zinc-100 text-zinc-600 ring-zinc-200',
  },
  EXPIRE: {
    label: 'Kedaluwarsa',
    className: 'bg-zinc-100 text-zinc-600 ring-zinc-200',
  },
  deny: {
    label: 'Ditolak',
    className: 'bg-red-50 text-red-800 ring-red-200',
  },
  DENY: {
    label: 'Ditolak',
    className: 'bg-red-50 text-red-800 ring-red-200',
  },
  cancel: {
    label: 'Dibatalkan',
    className: 'bg-zinc-100 text-zinc-600 ring-zinc-200',
  },
  CANCEL: {
    label: 'Dibatalkan',
    className: 'bg-zinc-100 text-zinc-600 ring-zinc-200',
  },
  failure: {
    label: 'Gagal',
    className: 'bg-red-50 text-red-800 ring-red-200',
  },
  FAILURE: {
    label: 'Gagal',
    className: 'bg-red-50 text-red-800 ring-red-200',
  },
};

const LEASE: Record<string, { label: string; className: string }> = {
  ACTIVE: {
    label: 'Aktif',
    className: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
  },
  DRAFT: {
    label: 'Draft',
    className: 'bg-zinc-100 text-zinc-600 ring-zinc-200',
  },
  ENDED: {
    label: 'Selesai',
    className: 'bg-zinc-100 text-zinc-600 ring-zinc-200',
  },
  TERMINATED: {
    label: 'Dihentikan',
    className: 'bg-red-50 text-red-800 ring-red-200',
  },
};

const ROOM: Record<string, { label: string; className: string }> = {
  AVAILABLE: {
    label: 'Tersedia',
    className: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
  },
  OCCUPIED: {
    label: 'Terisi',
    className: 'bg-blue-50 text-blue-900 ring-blue-200',
  },
  MAINTENANCE: {
    label: 'Perbaikan',
    className: 'bg-amber-50 text-amber-900 ring-amber-200',
  },
  INACTIVE: {
    label: 'Nonaktif',
    className: 'bg-zinc-100 text-zinc-600 ring-zinc-200',
  },
};

const TENANT: Record<string, { label: string; className: string }> = {
  ACTIVE: {
    label: 'Aktif',
    className: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
  },
  INACTIVE: {
    label: 'Nonaktif',
    className: 'bg-zinc-100 text-zinc-600 ring-zinc-200',
  },
  BLACKLISTED: {
    label: 'Blacklist',
    className: 'bg-red-50 text-red-800 ring-red-200',
  },
};

const PROPERTY: Record<string, { label: string; className: string }> = {
  ACTIVE: {
    label: 'Aktif',
    className: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
  },
  INACTIVE: {
    label: 'Nonaktif',
    className: 'bg-zinc-100 text-zinc-600 ring-zinc-200',
  },
  DRAFT: {
    label: 'Draft',
    className: 'bg-zinc-100 text-zinc-600 ring-zinc-200',
  },
};

const MAINTENANCE: Record<string, { label: string; className: string }> = {
  OPEN: {
    label: 'Terbuka',
    className: 'bg-amber-50 text-amber-900 ring-amber-200',
  },
  IN_PROGRESS: {
    label: 'Dikerjakan',
    className: 'bg-blue-50 text-blue-900 ring-blue-200',
  },
  DONE: {
    label: 'Selesai',
    className: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
  },
  CLOSED: {
    label: 'Ditutup',
    className: 'bg-zinc-100 text-zinc-600 ring-zinc-200',
  },
  CANCELLED: {
    label: 'Dibatalkan',
    className: 'bg-zinc-100 text-zinc-600 ring-zinc-200',
  },
};

const CONTRACT: Record<string, { label: string; className: string }> = {
  draft: {
    label: 'Draft',
    className: 'bg-zinc-100 text-zinc-600 ring-zinc-200',
  },
  sent: {
    label: 'Menunggu TT',
    className: 'bg-amber-50 text-amber-900 ring-amber-200',
  },
  signed: {
    label: 'Ditandatangani',
    className: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
  },
  void: {
    label: 'Batal',
    className: 'bg-zinc-100 text-zinc-600 ring-zinc-200',
  },
};

const PROSPECT: Record<string, { label: string; className: string }> = {
  NEW: {
    label: 'Baru',
    className: 'bg-blue-50 text-blue-900 ring-blue-200',
  },
  CONTACTED: {
    label: 'Dihubungi',
    className: 'bg-sky-50 text-sky-900 ring-sky-200',
  },
  SURVEY_SCHEDULED: {
    label: 'Survey dijadwalkan',
    className: 'bg-violet-50 text-violet-900 ring-violet-200',
  },
  SURVEY_COMPLETED: {
    label: 'Survey selesai',
    className: 'bg-indigo-50 text-indigo-900 ring-indigo-200',
  },
  NEGOTIATION: {
    label: 'Negosiasi',
    className: 'bg-amber-50 text-amber-900 ring-amber-200',
  },
  RESERVED: {
    label: 'Reserved',
    className: 'bg-orange-50 text-orange-900 ring-orange-200',
  },
  CONVERTED: {
    label: 'Converted',
    className: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
  },
  LOST: {
    label: 'Lost',
    className: 'bg-zinc-100 text-zinc-600 ring-zinc-200',
  },
};

const BOOKING: Record<string, { label: string; className: string }> = {
  HOLD: {
    label: 'Hold',
    className: 'bg-amber-50 text-amber-900 ring-amber-200',
  },
  PENDING: {
    label: 'Menunggu',
    className: 'bg-amber-50 text-amber-900 ring-amber-200',
  },
  PAID: {
    label: 'Lunas fee',
    className: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
  },
  CONVERTED: {
    label: 'Converted',
    className: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
  },
  EXPIRED: {
    label: 'Kedaluwarsa',
    className: 'bg-zinc-100 text-zinc-600 ring-zinc-200',
  },
  CANCELLED: {
    label: 'Dibatalkan',
    className: 'bg-zinc-100 text-zinc-600 ring-zinc-200',
  },
};

const SURVEY: Record<string, { label: string; className: string }> = {
  SCHEDULED: {
    label: 'Dijadwalkan',
    className: 'bg-blue-50 text-blue-900 ring-blue-200',
  },
  DONE: {
    label: 'Selesai',
    className: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
  },
  CANCELLED: {
    label: 'Dibatalkan',
    className: 'bg-zinc-100 text-zinc-600 ring-zinc-200',
  },
  NO_SHOW: {
    label: 'Tidak datang',
    className: 'bg-amber-50 text-amber-900 ring-amber-200',
  },
};

const MAPS = {
  invoice: INVOICE,
  payment: PAYMENT,
  lease: LEASE,
  room: ROOM,
  tenant: TENANT,
  property: PROPERTY,
  maintenance: MAINTENANCE,
  contract: CONTRACT,
  prospect: PROSPECT,
  booking: BOOKING,
  survey: SURVEY,
} as const;

export type StatusKind = keyof typeof MAPS;

export function StatusBadge({
  status,
  kind = 'invoice',
  className,
}: {
  status: string;
  kind?: StatusKind;
  className?: string;
}) {
  const map = MAPS[kind];
  const entry =
    map[status] ?? map[status.toUpperCase()] ?? map[status.toLowerCase()];
  const label = entry?.label ?? status;
  const tone = entry?.className ?? 'bg-zinc-100 text-zinc-600 ring-zinc-200';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset',
        tone,
        className,
      )}
    >
      {label}
    </span>
  );
}
