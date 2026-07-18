import { getAccessToken } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = await getAccessToken();
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message =
      typeof data === 'object' &&
      data &&
      'message' in data &&
      typeof (data as { message: unknown }).message === 'string'
        ? (data as { message: string }).message
        : res.statusText;
    throw new ApiError(res.status, message, data);
  }

  return data as T;
}

export async function getMe() {
  return apiFetch<{
    id: string;
    externalUserId: string;
    email: string | null;
    fullName: string | null;
    workspaces: Array<{
      membershipId: string;
      workspaceId: string;
      workspaceName: string;
      workspaceSlug: string;
      roleKey: string;
      status: string;
    }>;
    menu?: Array<{ href: string; label: string }>;
  }>('/v1/auth/me');
}

export async function listWorkspaces() {
  return apiFetch<
    Array<{
      id: string;
      name: string;
      slug: string;
      status: string;
      roleKey: string;
      membershipId: string;
    }>
  >('/v1/workspaces');
}

export async function createWorkspace(name: string, slug?: string) {
  return apiFetch<{
    id: string;
    name: string;
    slug: string;
    status: string;
    roleKey: string;
  }>('/v1/workspaces', {
    method: 'POST',
    body: JSON.stringify({ name, slug }),
  });
}

export type WorkspaceOverview = {
  properties: number;
  rooms: number;
  occupiedRooms: number;
  availableRooms: number;
  occupancyRate: number;
  activeTenants: number;
  activeLeases: number;
  openInvoiceCount: number;
  outstanding: number;
  overdueInvoices: number;
  pendingPayments: number;
  expensesPaid: number;
};

export async function getWorkspaceOverview(workspaceId: string) {
  return apiFetch<WorkspaceOverview>(
    `/v1/reports/overview?workspaceId=${encodeURIComponent(workspaceId)}`,
  );
}

export type Property = {
  id: string;
  workspaceId: string;
  name: string;
  code: string;
  status: string;
  addressLine: string | null;
  city: string | null;
  province: string | null;
  contactPhone: string | null;
  _count?: { rooms: number };
};

export type Room = {
  id: string;
  workspaceId: string;
  propertyId: string;
  name: string;
  code: string;
  status: string;
  floorLabel: string | null;
  rentAmount: string | number;
  depositAmount: string | number;
  capacity: number;
  buildingId?: string | null;
  floorId?: string | null;
  property?: { id: string; name: string; code: string };
  roomType?: { id: string; name: string } | null;
  building?: { id: string; name: string } | null;
  floor?: { id: string; name: string; level: number } | null;
};

export async function listProperties(workspaceId: string) {
  return apiFetch<Property[]>(
    `/v1/properties?workspaceId=${encodeURIComponent(workspaceId)}`,
  );
}

export async function createProperty(input: {
  workspaceId: string;
  name: string;
  code?: string;
  addressLine?: string;
  city?: string;
}) {
  return apiFetch<Property>('/v1/properties', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function listRooms(workspaceId: string, propertyId?: string) {
  const q = new URLSearchParams({ workspaceId });
  if (propertyId) q.set('propertyId', propertyId);
  return apiFetch<Room[]>(`/v1/rooms?${q.toString()}`);
}

export async function createRoom(input: {
  workspaceId: string;
  propertyId: string;
  name: string;
  code?: string;
  rentAmount?: number;
  depositAmount?: number;
  capacity?: number;
  floorLabel?: string;
  buildingId?: string;
  floorId?: string;
  roomTypeId?: string;
}) {
  return apiFetch<Room>('/v1/rooms', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateRoom(
  id: string,
  data: {
    buildingId?: string | null;
    floorId?: string | null;
    roomTypeId?: string | null;
    name?: string;
    rentAmount?: number;
    status?: string;
  },
) {
  return apiFetch<Room>(`/v1/rooms/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function bulkCreateRooms(input: {
  workspaceId: string;
  propertyId: string;
  prefix: string;
  startNumber: number;
  count: number;
  rentAmount?: number;
}) {
  return apiFetch('/v1/rooms/bulk', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export type Tenant = {
  id: string;
  workspaceId: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  status: string;
  _count?: { leases?: number };
  [key: string]: unknown;
};

export async function listTenants(workspaceId: string) {
  return apiFetch<Tenant[]>(
    `/v1/tenants?workspaceId=${encodeURIComponent(workspaceId)}`,
  );
}

export async function createTenant(input: {
  workspaceId: string;
  fullName: string;
  phone?: string;
  email?: string;
}) {
  return apiFetch<Tenant>('/v1/tenants', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export type Lease = {
  id: string;
  leaseNumber: string;
  status: string;
  startDate: string;
  endDate: string | null;
  rentAmount: string | number;
  depositAmount: string | number;
  room?: { name: string };
  property?: { name: string };
  tenant?: { fullName: string };
};

export async function listLeases(workspaceId: string) {
  return apiFetch<Lease[]>(
    `/v1/leases?workspaceId=${encodeURIComponent(workspaceId)}`,
  );
}

export async function createLease(input: {
  workspaceId: string;
  propertyId: string;
  roomId: string;
  tenantId: string;
  startDate: string;
  endDate?: string;
  rentAmount?: number;
  depositAmount?: number;
}) {
  return apiFetch<Lease>('/v1/leases', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export type Invoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  type?: string;
  total: string | number;
  amountPaid: string | number;
  dueDate: string;
  tenant?: { fullName: string };
  lease?: { leaseNumber: string };
  [key: string]: unknown;
};

export async function listInvoices(workspaceId: string) {
  return apiFetch<Invoice[]>(
    `/v1/invoices?workspaceId=${encodeURIComponent(workspaceId)}`,
  );
}

export async function createInvoiceFromLease(leaseId: string) {
  return apiFetch(`/v1/invoices/from-lease`, {
    method: 'POST',
    body: JSON.stringify({ leaseId }),
  });
}

export async function issueInvoice(id: string) {
  return apiFetch(`/v1/invoices/${id}/issue`, { method: 'POST' });
}

export async function voidInvoice(id: string) {
  return apiFetch(`/v1/invoices/${id}/void`, { method: 'POST' });
}

// ponytail: loose payment shape — tighten when payment UI stabilizes
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Payment = any;

export async function listPayments(workspaceId: string) {
  return apiFetch<Payment[]>(
    `/v1/payments?workspaceId=${encodeURIComponent(workspaceId)}`,
  );
}

export async function getPayment(id: string) {
  return apiFetch<Payment>(`/v1/payments/${id}`);
}

export async function createPayment(input: {
  workspaceId: string;
  invoiceId: string;
  amount: number;
  method?: string;
  manualReference?: string;
  proofUrl?: string;
  proofBase64?: string;
  runAiOcr?: boolean;
}) {
  return apiFetch('/v1/payments', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function confirmPayment(id: string) {
  return apiFetch(`/v1/payments/${id}/confirm`, { method: 'POST' });
}

export async function rejectPayment(id: string) {
  return apiFetch(`/v1/payments/${id}/reject`, { method: 'POST' });
}

export async function listDeposits(workspaceId: string) {
  return apiFetch<
    Array<{
      id: string;
      balance: string | number;
      status: string;
      tenant?: { fullName: string };
      lease?: { leaseNumber: string; status?: string };
      transactions?: Array<{
        id: string;
        type: string;
        amount: string | number;
        reason?: string | null;
      }>;
      [key: string]: unknown;
    }>
  >(`/v1/deposits?workspaceId=${encodeURIComponent(workspaceId)}`);
}

export async function recordDepositTxn(input: {
  depositAccountId: string;
  type: string;
  amount: number;
  reason?: string;
}) {
  return apiFetch('/v1/deposits/transactions', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function listExpenses(workspaceId: string) {
  return apiFetch<
    Array<{
      id: string;
      category: string;
      amount: string | number;
      status: string;
      expenseDate: string;
      description: string | null;
      property?: { name: string } | null;
    }>
  >(`/v1/expenses?workspaceId=${encodeURIComponent(workspaceId)}`);
}

export async function createExpense(input: {
  workspaceId: string;
  propertyId?: string;
  category: string;
  amount: number;
  expenseDate: string;
  description?: string;
}) {
  return apiFetch('/v1/expenses', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function approveExpense(id: string) {
  return apiFetch(`/v1/expenses/${id}/approve`, { method: 'POST' });
}

export async function payExpense(id: string) {
  return apiFetch(`/v1/expenses/${id}/pay`, { method: 'POST' });
}

export async function listUtilityPolicies(workspaceId: string) {
  return apiFetch<
    Array<{
      id: string;
      propertyId?: string;
      payerType: string;
      billingMethod: string;
      ratePerUnit: string | number | null;
      fixedMonthlyFee: string | number | null;
      ownerUnitAllowance?: string | number | null;
      property?: { name: string };
      [key: string]: unknown;
    }>
  >(`/v1/utilities/policies?workspaceId=${encodeURIComponent(workspaceId)}`);
}

export async function createUtilityPolicy(input: {
  workspaceId: string;
  propertyId: string;
  payerType: string;
  billingMethod: string;
  ratePerUnit?: number;
  fixedMonthlyFee?: number;
  ownerUnitAllowance?: number;
}) {
  return apiFetch('/v1/utilities/policies', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
