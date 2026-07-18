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

  const links = [
    { label: 'Home', href: '/portal' },
    { label: 'Tagihan', href: '/portal/bills' },
    { label: 'Bayar', href: '/portal/payments' },
    { label: 'Kontrak', href: '/portal/contracts' },
    { label: 'Listrik', href: '/portal/utilities' },
    { label: 'Info', href: '/portal/announcements' },
    { label: 'Notifikasi', href: '/portal/notifications' },
    { label: 'Maint.', href: '/portal/maintenance' },
    { label: 'Profil', href: '/portal/profile' },
  ].map((link) => ({ ...link, href: withTenant(link.href, tenantId) }));

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-zinc-200 bg-white px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <Link href={withTenant('/portal', tenantId)} className="font-semibold">
              Portal Penyewa
            </Link>
            <PortalNav links={links} />
          </div>
          <div className="flex items-center gap-2">
            <Suspense fallback={null}>
              <PortalTenantSwitcher tenants={tenants} currentId={tenantId} />
            </Suspense>
            <LogoutLink className="rounded-lg px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100">
              Keluar
            </LogoutLink>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
