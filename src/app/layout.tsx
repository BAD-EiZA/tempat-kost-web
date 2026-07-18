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
  title: 'Tempat Kost',
  description: 'Platform SaaS manajemen kos multi-property',
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
      <body className="flex min-h-full flex-col bg-white text-zinc-900">
        <SwRegister />
        {children}
      </body>
    </html>
  );
}
