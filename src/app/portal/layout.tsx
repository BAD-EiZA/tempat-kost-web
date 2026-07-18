import Link from 'next/link';
import { Suspense } from 'react';
import { LogoutLink } from '@kinde-oss/kinde-auth-nextjs/components';
import { requireAuth } from '@/lib/auth';
import { resolvePortalTenantId, withTenant } from '@/lib/portal-tenant';
import { PortalTenantSwitcher } from '@/components/portal-tenant-switcher';

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
    ['Home', '/portal'],
    ['Tagihan', '/portal/bills'],
    ['Bayar', '/portal/payments'],
    ['Kontrak', '/portal/contracts'],
    ['Listrik', '/portal/utilities'],
    ['Info', '/portal/announcements'],
    ['Maint.', '/portal/maintenance'],
    ['Profil', '/portal/profile'],
  ] as const;

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-zinc-200 bg-white px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <Link href={withTenant('/portal', tenantId)} className="font-semibold">
              Portal Penyewa
            </Link>
            <nav className="flex flex-wrap gap-3 text-sm text-zinc-600">
              {links.map(([label, href]) => (
                <Link key={href} href={withTenant(href, tenantId)}>
                  {label}
                </Link>
              ))}
            </nav>
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
