'use client';

import Link from 'next/link';
import {
  LoginLink,
  LogoutLink,
  RegisterLink,
} from '@kinde-oss/kinde-auth-nextjs/components';
import {
  BackgroundBeams,
  BentoGrid,
  BentoGridItem,
  FloatingNav,
  GlowingEffect,
  HoverEffect,
  InfiniteMovingCards,
  LampContainer,
  Meteors,
  MovingBorderButton,
  SparklesCore,
  Spotlight,
  TextGenerateEffect,
  TypewriterEffectSmooth,
  WobbleCard,
} from '@/components/ui';

const features = [
  {
    title: 'Multi-property',
    description:
      'Workspace → properti → kamar. Satu dashboard untuk banyak kos.',
    link: '#fitur',
  },
  {
    title: 'Invoice & pembayaran',
    description:
      'Tagihan otomatis, Midtrans Snap, bukti transfer + OCR human-in-loop.',
    link: '#fitur',
  },
  {
    title: 'Portal penyewa',
    description: 'Bayar, kontrak, maintenance — self-service dari HP.',
    link: '#fitur',
  },
  {
    title: 'AI ops',
    description:
      'OCR KTP, triage maintenance, insight kas, draft komunikasi.',
    link: '#ai',
  },
  {
    title: 'Utilitas fleksibel',
    description: 'Listrik & air: fixed, meter, atau hybrid per properti.',
    link: '#fitur',
  },
  {
    title: 'Tim & RBAC',
    description: 'Owner, finance, field, teknisi — akses per properti.',
    link: '#fitur',
  },
];

const testimonials = [
  {
    quote:
      'Dari spreadsheet berantakan ke satu dashboard. Tagihan bulanan jadi rapi.',
    name: 'Rina',
    title: 'Pemilik 3 kos, Bandung',
  },
  {
    quote:
      'Staf lapangan catat meter dari HP. Saya pantau outstanding dari mana saja.',
    name: 'Budi',
    title: 'Property Manager, Jakarta',
  },
  {
    quote:
      'OCR bukti bayar hemat waktu rekonsiliasi. Tetap kami yang approve.',
    name: 'Sari',
    title: 'Finance, Yogyakarta',
  },
  {
    quote: 'Portal penyewa mengurangi chat WA “sudah transfer belum?”.',
    name: 'Andi',
    title: 'Owner, Surabaya',
  },
];

export function LandingPage({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="relative flex min-h-full flex-col overflow-x-hidden bg-white">
      <FloatingNav
        navItems={[
          { name: 'Fitur', link: '#fitur' },
          { name: 'AI', link: '#ai' },
          { name: 'Cerita', link: '#cerita' },
        ]}
        rightSlot={
          !signedIn ? (
            <>
              <LoginLink className="rounded-full px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100">
                Masuk
              </LoginLink>
              <RegisterLink className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white">
                Daftar
              </RegisterLink>
            </>
          ) : (
            <Link
              href="/dashboard"
              className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white"
            >
              Dashboard
            </Link>
          )
        }
      />

      {/* Hero */}
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden bg-zinc-950 px-6 pt-24 pb-20">
        <Spotlight className="-top-40 left-0 md:-top-20 md:left-60" fill="white" />
        <Spotlight className="top-10 left-full h-[80vh] w-[50vw]" fill="#818cf8" />
        <BackgroundBeams className="opacity-40" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <p className="mb-4 text-xs font-medium tracking-[0.2em] text-indigo-300 uppercase">
            Tempat Kost
          </p>
          <TypewriterEffectSmooth
            className="justify-center"
            words={[
              { text: 'Kelola', className: 'text-white' },
              { text: 'banyak', className: 'text-white' },
              { text: 'kos', className: 'text-indigo-400' },
              { text: 'dari', className: 'text-white' },
              { text: 'satu', className: 'text-white' },
              { text: 'dashboard.', className: 'text-white' },
            ]}
          />
          <div className="mx-auto mt-4 max-w-2xl">
            <TextGenerateEffect
              className="text-center text-base font-normal text-zinc-300 sm:text-lg"
              words="Multi-property, invoice, Midtrans, portal penyewa, dan AI human-in-the-loop — dibangun untuk pemilik satu kos hingga operator ratusan kamar."
              duration={0.35}
            />
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {!signedIn ? (
              <RegisterLink>
                <MovingBorderButton
                  as="span"
                  duration={2500}
                  className="border-zinc-700 bg-zinc-900"
                  containerClassName="h-12 w-auto min-w-[10rem]"
                >
                  Mulai gratis
                </MovingBorderButton>
              </RegisterLink>
            ) : (
              <Link href="/dashboard">
                <MovingBorderButton
                  as="span"
                  duration={2500}
                  className="border-zinc-700 bg-zinc-900"
                  containerClassName="h-12 w-auto min-w-[10rem]"
                >
                  Buka dashboard
                </MovingBorderButton>
              </Link>
            )}
            <a
              href="#fitur"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-zinc-700 px-6 font-medium text-zinc-200 transition hover:bg-white/10"
            >
              Lihat fitur
            </a>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* Bento */}
      <section id="fitur" className="relative bg-white px-6 py-24">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Semua yang dibutuhkan operasional kos
          </h2>
          <p className="mt-3 text-zinc-600">
            Kelola operasional, pembayaran, dan penyewa dalam satu tempat.
          </p>
        </div>
        <BentoGrid className="max-w-5xl">
          <BentoGridItem
            className="md:col-span-2"
            title="Billing loop lengkap"
            description="Lease → invoice → payment → deposit → receipt. Midtrans + manual + OCR risk flags."
            header={
              <div className="relative flex h-full min-h-[6rem] w-full flex-1 overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500/20 via-violet-500/10 to-transparent">
                <Meteors number={12} />
                <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-indigo-700">
                  Invoice · Snap · Proof
                </div>
              </div>
            }
          />
          <BentoGridItem
            title="Portal penyewa"
            description="Bayar tagihan, lihat kontrak, ajukan maintenance."
            header={
              <div className="flex h-full min-h-[6rem] items-center justify-center rounded-xl bg-zinc-100 text-2xl">
                🏠
              </div>
            }
          />
          <BentoGridItem
            title="Maintenance AI"
            description="Triage, foto damage, estimasi biaya — human approve."
            header={
              <div className="flex h-full min-h-[6rem] items-center justify-center rounded-xl bg-amber-50 text-2xl">
                🔧
              </div>
            }
          />
          <BentoGridItem
            className="md:col-span-2"
            title="Insights & smart search"
            description="Cash history, forecast 30d, rent recommendation, NL search ke deep-link."
            header={
              <div className="relative flex h-full min-h-[6rem] w-full overflow-hidden rounded-xl bg-zinc-950">
                <SparklesCore particleDensity={30} className="opacity-80" />
                <div className="absolute inset-0 flex items-center justify-center text-xs text-indigo-200">
                  Metrics · Forecast · Search
                </div>
              </div>
            }
          />
        </BentoGrid>
      </section>

      {/* Hover features */}
      <section className="bg-zinc-50 px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <HoverEffect items={features} />
        </div>
      </section>

      {/* Lamp + AI */}
      <section id="ai" className="bg-zinc-950">
        <LampContainer>
          <h2 className="mt-8 bg-gradient-to-br from-zinc-100 to-zinc-400 bg-clip-text text-center text-3xl font-bold tracking-tight text-transparent md:text-5xl">
            AI human-in-the-loop
          </h2>
          <p className="mt-4 max-w-lg text-center text-sm text-zinc-400">
            OCR, triage, draft, insight — tidak pernah auto-approve pembayaran
            atau deposit.
          </p>
        </LampContainer>
      </section>

      {/* Wobble CTA */}
      <section className="bg-white px-6 py-20">
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2">
          <WobbleCard containerClassName="bg-indigo-900 min-h-[16rem]">
            <h3 className="max-w-sm text-xl font-semibold text-white md:text-2xl">
              Import spreadsheet + mapping AI
            </h3>
            <p className="mt-3 max-w-xs text-sm text-indigo-100">
              Rooms, tenants, leases, payments, expenses — dry-run lalu commit.
            </p>
          </WobbleCard>
          <GlowingEffect>
            <div className="flex min-h-[16rem] flex-col justify-center p-8">
              <h3 className="text-xl font-semibold text-zinc-900">
                Siap production path
              </h3>
              <p className="mt-2 text-sm text-zinc-600">
                Kinde auth · Supabase · Cloudinary · Midtrans · SMTP · Gemini
              </p>
              {!signedIn ? (
                <RegisterLink className="mt-6 inline-flex w-fit rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white">
                  Daftar sekarang
                </RegisterLink>
              ) : (
                <Link
                  href="/dashboard"
                  className="mt-6 inline-flex w-fit rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white"
                >
                  Ke dashboard
                </Link>
              )}
            </div>
          </GlowingEffect>
        </div>
      </section>

      {/* Testimonials */}
      <section id="cerita" className="bg-zinc-50 py-20">
        <h2 className="mb-8 text-center text-2xl font-bold text-zinc-900">
          Dipakai operator kos nyata
        </h2>
        <div className="flex justify-center">
          <InfiniteMovingCards
            items={testimonials}
            direction="right"
            speed="slow"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white px-6 py-10">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 text-sm text-zinc-500">
          <span className="font-semibold text-zinc-900">Tempat Kost</span>
          <div className="flex gap-4">
            {!signedIn ? (
              <>
                <LoginLink className="hover:text-zinc-900">Masuk</LoginLink>
                <RegisterLink className="hover:text-zinc-900">
                  Daftar
                </RegisterLink>
              </>
            ) : (
              <>
                <Link href="/dashboard" className="hover:text-zinc-900">
                  Dashboard
                </Link>
                <LogoutLink className="hover:text-zinc-900">Keluar</LogoutLink>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
