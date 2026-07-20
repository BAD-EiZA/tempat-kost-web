'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  LoginLink,
  LogoutLink,
  RegisterLink,
} from '@kinde-oss/kinde-auth-nextjs/components';
import { motion, useReducedMotion } from 'framer-motion';

const features = [
  {
    title: 'Multi-property',
    body: 'Workspace, properti, dan kamar dalam satu hierarki. Satu dashboard untuk banyak kos.',
    image: '/images/feature-multi.jpg',
    span: 'md:col-span-2',
  },
  {
    title: 'Invoice & bayar',
    body: 'Tagihan otomatis, Midtrans Snap, bukti transfer dengan OCR yang tetap Anda approve.',
    image: '/images/feature-billing.jpg',
    span: '',
  },
  {
    title: 'Portal penyewa',
    body: 'Bayar, kontrak, dan maintenance self-service dari HP.',
    image: '/images/feature-portal.jpg',
    span: '',
  },
  {
    title: 'Utilitas fleksibel',
    body: 'Listrik dan air: fixed, meter, atau hybrid per properti.',
    image: '/images/feature-utility.jpg',
    span: 'md:col-span-2',
  },
];

const steps = [
  {
    title: 'Buat workspace',
    body: 'Daftarkan bisnis kos, undang tim, atur akses per properti.',
  },
  {
    title: 'Import atau input data',
    body: 'Spreadsheet mapping AI, atau input manual kamar, penyewa, dan kontrak.',
  },
  {
    title: 'Tagih dan pantau',
    body: 'Invoice jalan, portal buka, outstanding terlihat real-time.',
  },
];

const testimonials = [
  {
    quote:
      'Dari spreadsheet berantakan ke satu dashboard. Tagihan bulanan jadi rapi.',
    name: 'Rina Wijaya',
    title: 'Pemilik 3 kos, Bandung',
  },
  {
    quote:
      'Staf lapangan catat meter dari HP. Saya pantau outstanding dari mana saja.',
    name: 'Budi Santoso',
    title: 'Property Manager, Jakarta',
  },
  {
    quote:
      'OCR bukti bayar hemat waktu rekonsiliasi. Tetap kami yang approve.',
    name: 'Sari Putri',
    title: 'Finance, Yogyakarta',
  },
];

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function LandingPage({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="relative flex min-h-full flex-col overflow-x-hidden bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-zinc-50/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/"
            className="shrink-0 text-sm font-semibold tracking-tight text-zinc-900"
          >
            Tempat Kost
          </Link>
          <nav
            aria-label="Navigasi utama"
            className="hidden items-center gap-1 md:flex"
          >
            {[
              ['Fitur', '#fitur'],
              ['Cara kerja', '#cara-kerja'],
              ['Cerita', '#cerita'],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="rounded-lg px-3 py-1.5 text-sm text-zinc-600 transition hover:bg-white hover:text-zinc-900"
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            {!signedIn ? (
              <>
                <LoginLink className="rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-white">
                  Masuk
                </LoginLink>
                <RegisterLink className="tk-btn !rounded-lg !px-3.5 !py-1.5 !text-sm">
                  Daftar
                </RegisterLink>
              </>
            ) : (
              <Link
                href="/dashboard"
                className="tk-btn !rounded-lg !px-3.5 !py-1.5 !text-sm"
              >
                Dashboard
              </Link>
            )}
          </div>
        </div>
      </header>

      <section className="relative mx-auto grid min-h-[100dvh] w-full max-w-[1400px] items-center gap-10 px-4 pt-8 pb-16 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:pt-12 lg:pb-20">
        <div className="max-w-xl">
          <p className="mb-3 text-xs font-medium tracking-[0.18em] text-emerald-800 uppercase">
            SaaS manajemen kos
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl lg:leading-[1.05]">
            Kelola banyak kos dari satu dashboard
          </h1>
          <p className="mt-4 max-w-[36ch] text-base leading-relaxed text-zinc-600 sm:text-lg">
            Multi-property, invoice, portal penyewa, dan AI human-in-the-loop
            untuk operator kos Indonesia.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {!signedIn ? (
              <RegisterLink className="tk-btn !px-5 !py-2.5 !text-sm">
                Mulai gratis
              </RegisterLink>
            ) : (
              <Link href="/dashboard" className="tk-btn !px-5 !py-2.5 !text-sm">
                Buka dashboard
              </Link>
            )}
            <a href="#fitur" className="tk-btn-secondary !px-5 !py-2.5 !text-sm">
              Lihat fitur
            </a>
          </div>
        </div>
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 shadow-[0_24px_60px_-28px_rgb(0_0_0/0.25)] lg:aspect-[5/4]">
          <Image
            src="/images/hero-room.jpg"
            alt="Interior kamar kos modern dengan pencahayaan natural"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-zinc-900/25 via-transparent to-emerald-900/10" />
        </div>
      </section>

      <section className="border-y border-zinc-200 bg-white">
        <div className="mx-auto grid max-w-[1400px] grid-cols-2 gap-6 px-4 py-10 sm:grid-cols-4 sm:px-6">
          {[
            ['Multi-property', 'Satu workspace, banyak lokasi'],
            ['Billing loop', 'Lease sampai receipt'],
            ['Portal HP', 'Self-service penyewa'],
            ['AI + approve', 'Saran, bukan auto-keputusan'],
          ].map(([title, body]) => (
            <div key={title}>
              <p className="text-sm font-semibold text-zinc-900">{title}</p>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="fitur" className="bg-zinc-50 px-4 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-[1400px]">
          <Reveal className="max-w-xl">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
              Operasional kos, lengkap
            </h2>
            <p className="mt-3 max-w-[50ch] text-base leading-relaxed text-zinc-600">
              Dari okupansi sampai kas. Modul yang dipakai harian, bukan fitur
              demo.
            </p>
          </Reveal>
          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
            {features.map((item, i) => (
              <Reveal
                key={item.title}
                delay={i * 0.05}
                className={`group overflow-hidden rounded-2xl border border-zinc-200 bg-white ${item.span}`}
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-zinc-100">
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 40vw"
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="p-5 sm:p-6">
                  <h3 className="text-lg font-semibold tracking-tight text-zinc-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                    {item.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="cara-kerja" className="bg-white px-4 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-[1400px]">
          <Reveal className="max-w-xl">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
              Mulai dalam tiga langkah
            </h2>
            <p className="mt-3 max-w-[50ch] text-base leading-relaxed text-zinc-600">
              Onboarding singkat. Data lama bisa diimport. AI membantu mapping,
              Anda yang commit.
            </p>
          </Reveal>
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((step, i) => (
              <Reveal key={step.title} delay={i * 0.06}>
                <li className="relative h-full rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-800 text-sm font-semibold text-white">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-zinc-900">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                    {step.body}
                  </p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-emerald-950 px-4 py-20 text-emerald-50 sm:px-6 sm:py-24">
        <div className="mx-auto grid max-w-[1400px] items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              AI human-in-the-loop
            </h2>
            <p className="mt-4 max-w-[48ch] text-base leading-relaxed text-emerald-100/85">
              OCR KTP, triage maintenance, insight kas, dan draft komunikasi.
              Saran AI tidak pernah auto-approve pembayaran atau deposit.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-emerald-100/90">
              {[
                'OCR bukti bayar + risk flags',
                'Triage maintenance dari foto',
                'Forecast kas 30 hari',
                'Draft chat, Anda yang kirim',
              ].map((line) => (
                <li key={line} className="flex gap-2">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400"
                    aria-hidden
                  />
                  {line}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.08}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-emerald-800/80">
              <Image
                src="/images/ops-desk.jpg"
                alt="Meja kerja operator properti dengan laptop dan dokumen"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover opacity-90"
              />
            </div>
          </Reveal>
        </div>
      </section>

      <section id="cerita" className="bg-zinc-50 px-4 py-20 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-[1400px]">
          <Reveal className="max-w-xl">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
              Dipakai operator kos
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.05}>
                <figure className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-6">
                  <blockquote className="text-sm leading-relaxed text-zinc-700">
                    “{t.quote}”
                  </blockquote>
                  <figcaption className="mt-6 border-t border-zinc-100 pt-4">
                    <p className="text-sm font-semibold text-zinc-900">
                      {t.name}
                    </p>
                    <p className="text-xs text-zinc-500">{t.title}</p>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-20 sm:px-6 sm:py-24">
        <Reveal className="mx-auto max-w-3xl rounded-2xl border border-zinc-200 bg-zinc-50 px-6 py-12 text-center sm:px-12">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            Siap rapiin operasional kos?
          </h2>
          <p className="mx-auto mt-3 max-w-[40ch] text-base text-zinc-600">
            Kinde auth, Supabase, Cloudinary, Midtrans, SMTP, Gemini. Production
            path, bukan mock.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {!signedIn ? (
              <RegisterLink className="tk-btn !px-5 !py-2.5 !text-sm">
                Daftar sekarang
              </RegisterLink>
            ) : (
              <Link href="/dashboard" className="tk-btn !px-5 !py-2.5 !text-sm">
                Ke dashboard
              </Link>
            )}
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-zinc-200 bg-white px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 text-sm text-zinc-500">
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
