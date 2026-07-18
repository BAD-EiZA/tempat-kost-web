import { PublicBookForm } from './book-form';

type PublicProperty = {
  name: string;
  description: string | null;
  addressLine: string | null;
  city: string | null;
  startingPrice: string | number | null;
  availabilitySummary: { available: number; reserved: number };
  rooms: Array<{
    id: string;
    name: string;
    rentAmount: string | number;
  }>;
  whatsappLink: string | null;
  brandColor: string | null;
  bookingEnabled?: boolean;
};

function formatIdr(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);
}

function safeBrandColor(value: string | null) {
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value : '#18181b';
}

function foregroundFor(background: string) {
  const channels = background
    .slice(1)
    .match(/.{2}/g)!
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045
        ? channel / 12.92
        : Math.pow((channel + 0.055) / 1.055, 2.4),
    );
  const luminance =
    0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  return luminance > 0.38 ? '#18181b' : '#ffffff';
}

export default async function PublicPropertyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let data: PublicProperty | null = null;
  let error: string | null = null;
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/v1/public/properties/${slug}`,
      { cache: 'no-store' },
    );
    if (!res.ok) throw new Error('Not found');
    data = (await res.json()) as PublicProperty;
  } catch {
    error = 'Properti tidak ditemukan atau belum dipublish.';
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center text-sm text-zinc-600">
        {error}
      </div>
    );
  }

  const accent = safeBrandColor(data.brandColor);
  const accentForeground = foregroundFor(accent);

  return (
    <div className="min-h-full bg-zinc-50">
      <header
        className="px-6 py-10"
        style={{ backgroundColor: accent, color: accentForeground }}
      >
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-semibold">{data.name}</h1>
          <p className="mt-2 text-sm opacity-90">
            {[data.addressLine, data.city].filter(Boolean).join(', ')}
          </p>
          {data.startingPrice != null && (
            <p className="mt-4 text-lg">
              Mulai {formatIdr(Number(data.startingPrice))}/bulan
            </p>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-8">
        {data.description && (
          <p className="text-sm leading-relaxed text-zinc-700">
            {data.description}
          </p>
        )}
        <p className="mt-4 text-sm text-zinc-600">
          Tersedia {data.availabilitySummary.available} kamar
          {data.availabilitySummary.reserved
            ? ` · ${data.availabilitySummary.reserved} reserved`
            : ''}
        </p>
        <ul className="mt-6 divide-y rounded-xl border bg-white">
          {data.rooms.map((r) => (
            <li key={r.id} className="flex justify-between px-4 py-3 text-sm">
              <span>{r.name}</span>
              <span>{formatIdr(Number(r.rentAmount))}</span>
            </li>
          ))}
        </ul>
        {data.whatsappLink && (
          <a
            href={data.whatsappLink}
            target="_blank"
            rel="noreferrer"
            className="mt-6 flex w-full items-center justify-center rounded-xl border py-3 text-sm font-medium"
            style={{ borderColor: accent, color: accent }}
          >
            Chat WhatsApp
          </a>
        )}
        <PublicBookForm
          slug={slug}
          rooms={data.rooms}
          accent={accent}
          accentForeground={accentForeground}
        />
      </main>
    </div>
  );
}
