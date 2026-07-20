'use client';

export default function GlobalError({ unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  return (
    <html lang="id">
      <body style={{ margin: 0, background: '#fafafa', color: '#09090b', fontFamily: 'system-ui, sans-serif' }}>
        <main role="alert" style={{ maxWidth: 560, margin: '0 auto', padding: '64px 24px' }}>
          <title>Terjadi kesalahan | Tempat Kost</title>
          <h1>Sistem bermasalah</h1>
          <p>Halaman tidak dapat dimuat. Coba lagi, atau kembali beberapa saat lagi.</p>
          <button type="button" onClick={unstable_retry} style={{ border: 0, borderRadius: 10, background: '#047857', color: '#fff', padding: '10px 16px', fontWeight: 600 }}>
            Coba lagi
          </button>
        </main>
      </body>
    </html>
  );
}
