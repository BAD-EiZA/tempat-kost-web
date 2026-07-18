import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-xl items-center px-6 py-16">
      <div>
        <p className="text-sm font-semibold text-accent">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Halaman tidak ditemukan</h1>
        <p className="mt-3 text-zinc-600">Alamat mungkin salah atau halaman sudah dipindahkan.</p>
        <Link href="/" className="tk-btn mt-6 inline-block">Kembali ke beranda</Link>
      </div>
    </main>
  );
}
