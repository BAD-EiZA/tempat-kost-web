import Image from 'next/image';
import Link from 'next/link';
import { formatIdr } from '@/lib/format';
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

function safeBrandColor(value: string | null) {
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value : '#047857';
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
      <div className="flex min-h-[100dvh] items-center justify-center bg-zinc-50 px-6">
        <div className="tk-card max-w-md p-8 text-center">
          <p className="text-sm text-zinc-600">{error}</p>
          <Link href="/" className="tk-btn mt-4 inline-flex !text-sm">
            Kembali ke beranda
          </Link>
        </div>
      </div>
    );
  }

  const accent = safeBrandColor(data.brandColor);
  const accentForeground = foregroundFor(accent);
  const location = [data.addressLine, data.city].filter(Boolean).join(', ');

  return (
    <div className="min-h-full bg-zinc-50">
      <div className="relative min-h-[42vh] w-full overflow-hidden bg-zinc-900 sm:min-h-[48vh]">
        <Image
          src="/images/listing-hero.jpg"
          alt={`Foto properti ${data.name}`}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-80"
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top, ${accent}ee 0%, transparent 55%)`,
          }}
        />
        <div
          className="relative mx-auto flex min-h-[42vh] max-w-2xl flex-col justify-end px-6 py-10 sm:min-h-[48vh] sm:py-14"
          style={{ color: accentForeground }}
        >
          <p className="text-xs font-medium tracking-[0.16em] uppercase opacity-90">
            Listing publik
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            {data.name}
          </h1>
          {location ? (
            <p className="mt-2 text-sm opacity-90">{location}</p>
          ) : null}
          {data.startingPrice != null && (
            <p className="mt-5 text-lg font-medium">
              Mulai {formatIdr(Number(data.startingPrice))}/bulan
            </p>
          )}
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-6 py-8">
        {data.description ? (
          <p className="text-sm leading-relaxed text-zinc-700">
            {data.description}
          </p>
        ) : null}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="tk-card p-4">
            <p className="text-xs text-zinc-500">Tersedia</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-900">
              {data.availabilitySummary.available}
            </p>
          </div>
          <div className="tk-card p-4">
            <p className="text-xs text-zinc-500">Reserved</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-900">
              {data.availabilitySummary.reserved}
            </p>
          </div>
        </div>

        <h2 className="mt-8 text-base font-semibold text-zinc-900">Kamar</h2>
        {data.rooms.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            Belum ada kamar yang ditampilkan.
          </p>
        ) : (
          <ul className="tk-list mt-3">
            {data.rooms.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 text-sm last:border-0"
              >
                <span className="font-medium text-zinc-900">{r.name}</span>
                <span className="tabular-nums text-zinc-600">
                  {formatIdr(Number(r.rentAmount))}
                </span>
              </li>
            ))}
          </ul>
        )}

        {data.whatsappLink ? (
          <a
            href={data.whatsappLink}
            target="_blank"
            rel="noreferrer"
            className="mt-6 flex w-full items-center justify-center rounded-xl border py-3 text-sm font-medium transition hover:bg-white"
            style={{ borderColor: accent, color: accent }}
          >
            Chat WhatsApp
          </a>
        ) : null}

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
