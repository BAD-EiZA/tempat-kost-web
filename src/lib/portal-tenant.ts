import { cookies } from 'next/headers';
import { apiFetch } from '@/lib/api';

export type PortalTenant = {
  id: string;
  fullName: string;
  workspaceId: string;
  status?: string;
  leases?: Array<{
    id: string;
    status: string;
    room?: { name: string };
    property?: { name: string };
  }>;
};

export type PortalMe = {
  user: { id: string; email: string | null };
  tenants: PortalTenant[];
};

export async function getPortalMe() {
  return apiFetch<PortalMe>('/v1/portal/me');
}

export async function resolvePortalTenantId(
  searchTenantId?: string | null,
): Promise<{ me: PortalMe; tenantId: string; tenants: PortalTenant[] }> {
  const me = await getPortalMe();
  const tenants = me.tenants ?? [];
  const jar = await cookies();
  const cookieId = jar.get('portal_tenant_id')?.value;
  const tenantId =
    (searchTenantId && tenants.some((t) => t.id === searchTenantId)
      ? searchTenantId
      : null) ||
    (cookieId && tenants.some((t) => t.id === cookieId) ? cookieId : null) ||
    tenants[0]?.id ||
    '';
  return { me, tenantId, tenants };
}

export function withTenant(path: string, tenantId: string) {
  if (!tenantId) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}tenantId=${encodeURIComponent(tenantId)}`;
}
