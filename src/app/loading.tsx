export default function Loading() {
  return (
    <main className="mx-auto flex min-h-[50vh] w-full max-w-6xl items-center px-6 py-16">
      <div role="status" aria-live="polite" className="w-full animate-pulse">
        <span className="sr-only">Memuat halaman...</span>
        <div className="h-7 w-48 rounded-lg bg-zinc-200" />
        <div className="mt-4 h-4 w-72 max-w-full rounded bg-zinc-100" />
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="h-24 rounded-2xl border border-zinc-200 bg-white" />
          <div className="h-24 rounded-2xl border border-zinc-200 bg-white" />
          <div className="h-24 rounded-2xl border border-zinc-200 bg-white" />
          <div className="h-24 rounded-2xl border border-zinc-200 bg-white" />
        </div>
        <div className="mt-6 h-40 rounded-2xl border border-zinc-200 bg-white" />
      </div>
    </main>
  );
}
