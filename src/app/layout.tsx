import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { SwRegister } from '@/components/sw-register';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Tempat Kost',
    template: '%s · Tempat Kost',
  },
  description:
    'Platform SaaS manajemen kos multi-property: invoice, portal penyewa, utilitas, dan AI human-in-the-loop.',
  applicationName: 'Tempat Kost',
  keywords: [
    'manajemen kos',
    'SaaS kos',
    'invoice kos',
    'portal penyewa',
    'multi-property',
  ],
  openGraph: {
    title: 'Tempat Kost',
    description:
      'Kelola banyak kos dari satu dashboard. Multi-property, tagihan, portal penyewa.',
    locale: 'id_ID',
    type: 'website',
    siteName: 'Tempat Kost',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'Tempat Kost - manajemen kos multi-property',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tempat Kost',
    description:
      'Kelola banyak kos dari satu dashboard. Multi-property, tagihan, portal penyewa.',
    images: ['/og.png'],
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Tempat Kost',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-emerald-800 focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          Loncat ke konten
        </a>
        <SwRegister />
        <div id="main-content" className="flex min-h-full flex-1 flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
