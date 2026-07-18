# Tempat Kost — Web

Next.js App Router frontend (dashboard, portal, public pages).

## Stack

- Next.js + TypeScript + Tailwind
- Kinde (`@kinde-oss/kinde-auth-nextjs`)
- TanStack Query (siap dipakai client components)

## Setup

1. Copy env:

```bash
cp .env.example .env.local
```

2. Isi kunci Kinde + URL API (lihat root `ENV.md`).

3. Install & run:

```bash
npm install
npm run dev
```

App: `http://localhost:3000`

## Routes (Phase 0)

| Path | Keterangan |
|---|---|
| `/` | Landing |
| `/sign-in`, `/sign-up` | Clerk |
| `/dashboard` | List workspace (butuh API) |
| `/onboarding` | Buat workspace pertama |

Pastikan API jalan di `NEXT_PUBLIC_API_URL` (default `http://localhost:4000`).
