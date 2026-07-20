# Ship checklist - Tempat Kost Web

## Automated

```bash
cd tempat-kost-web
npm run lint
npx tsc --noEmit
npm run build
```

## Smoke (manual)

1. **Landing** `/` - hero, CTAs, nav Masuk/Daftar
2. **Auth** - Kinde sign-in/up (env keys required)
3. **Onboarding** `/onboarding` - create workspace
4. **Wizard** `/onboarding/wizard` - 3 steps + optional AI suggest
5. **Dashboard** `/dashboard` - sidebar groups, workspace chips, overview stats
6. **Core ops** - Properti → Kamar → Penyewa → Kontrak → Tagihan → Pembayaran
7. **Portal** `/portal` - bottom tabs, tunggakan CTA, bills pay/proof
8. **Trust** - invite token page, `/sign/[token]` load
9. **Public** `/p/[slug]` - hero + book form (API + published property)
10. **Keyboard** - focus "Loncat ke konten", ⌘K command palette, Esc closes drawers

## Gates (post-harden)

- No user-visible em/en dashes (`—` `–`) in app UI
- Primary CTAs use emerald tokens (`tk-btn`), not pure black
- Empty lists: EmptyState or consistent muted empty copy

## Assets

Local generated set (replace with brand photography when ready):

| Path | Use |
|---|---|
| `public/images/hero-room.jpg` | Landing hero |
| `public/images/feature-*.jpg` | Landing bento |
| `public/images/ops-desk.jpg` | Landing AI section |
| `public/images/listing-hero.jpg` | Public `/p/[slug]` hero |
| `public/og.png` | Open Graph / Twitter |
| `public/icon-192.png`, `icon-512.png` | PWA + favicons |

## Out of scope for this UI wave

- Admin secret page polish
- Kinde hosted auth skin
- Backend/API changes
