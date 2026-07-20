import Link from 'next/link';
import { Suspense } from 'react';
import { LogoutLink } from '@kinde-oss/kinde-auth-nextjs/components';
import { requireAuth } from '@/lib/auth';
import { resolvePortalTenantId, withTenant } from '@/lib/portal-tenant';
import { PortalTenantSwitcher } from '@/components/portal-tenant-switcher';
import { PortalNav } from './portal-nav';

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  let tenants: Array<{ id: string; fullName: string }> = [];
  let tenantId = '';
  try {
    const resolved = await resolvePortalTenantId();
    tenants = resolved.tenants;
    tenantId = resolved.tenantId;
  } catch {
    /* empty */
  }

  const primary = [
    { label: 'Home', href: '/portal' },
    { label: 'Tagihan', href: '/portal/bills' },
    { label: 'Kontrak', href: '/portal/contracts' },
    { label: 'Lapor', href: '/portal/maintenance' },
  ].map((link) => ({ ...link, href: withTenant(link.href, tenantId) }));

  const more = [
    { label: 'Pembayaran', href: '/portal/payments' },
    { label: 'Listrik', href: '/portal/utilities' },
    { label: 'Pengumuman', href: '/portal/announcements' },
    { label: 'Notifikasi', href: '/portal/notifications' },
    { label: 'Profil', href: '/portal/profile' },
  ].map((link) => ({ ...link, href: withTenant(link.href, tenantId) }));

  return (
    <div className="flex min-h-full flex-col bg-zinc-50">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Link
              href={withTenant('/portal', tenantId)}
              className="shrink-0 text-sm font-semibold tracking-tight text-zinc-900"
            >
              Portal
            </Link>
            <PortalNav primary={primary} more={more} />
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <Suspense fallback={null}>
              <PortalTenantSwitcher tenants={tenants} currentId={tenantId} />
            </Suspense>
            <LogoutLink className="rounded-lg px-2 py-1 text-xs text-zinc-600 transition hover:bg-zinc-100">
              Keluar
            </LogoutLink>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-8">
        {children}
      </main>
    </div>
  );
}
