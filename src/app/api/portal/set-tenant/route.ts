import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { requireAuth } from '@/lib/auth';

export async function POST(req: Request) {
  await requireAuth();
  const body = (await req.json()) as { tenantId?: string };
  const tenantId = body.tenantId?.trim();
  if (!tenantId) {
    return NextResponse.json({ message: 'tenantId required' }, { status: 400 });
  }
  const jar = await cookies();
  jar.set('portal_tenant_id', tenantId, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
  });
  return NextResponse.json({ ok: true, tenantId });
}
