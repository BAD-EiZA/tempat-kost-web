'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

type Tenant = { id: string; fullName: string; workspaceId?: string };

export function PortalTenantSwitcher({
  tenants,
  currentId,
}: {
  tenants: Tenant[];
  currentId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, start] = useTransition();

  if (tenants.length <= 1) return null;

  async function onChange(tenantId: string) {
    start(async () => {
      await fetch('/api/portal/set-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId }),
      });
      const params = new URLSearchParams(searchParams.toString());
      params.set('tenantId', tenantId);
      router.push(`${pathname}?${params.toString()}`);
      router.refresh();
    });
  }

  return (
    <label className="flex items-center gap-1 text-xs text-zinc-600">
      <span className="hidden sm:inline">Profil</span>
      <select
        value={currentId}
        disabled={pending}
        onChange={(e) => void onChange(e.target.value)}
        className="max-w-[10rem] rounded border border-zinc-200 bg-white px-2 py-1 text-xs"
      >
        {tenants.map((t) => (
          <option key={t.id} value={t.id}>
            {t.fullName}
          </option>
        ))}
      </select>
    </label>
  );
}
