import { getAccessToken } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const KINDS = new Set(['invoices', 'payments', 'tenants', 'expenses']);

export async function GET(request: Request) {
  const token = await getAccessToken();
  if (!token) return new Response('Unauthorized', { status: 401 });

  const url = new URL(request.url);
  const workspaceId = url.searchParams.get('workspaceId');
  const kind = url.searchParams.get('kind');
  if (!workspaceId || !kind || !KINDS.has(kind)) {
    return new Response('Invalid export request', { status: 400 });
  }

  const upstream = await fetch(
    `${API_URL}/v1/reports/export?workspaceId=${encodeURIComponent(workspaceId)}&kind=${kind}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: 'text/csv' } },
  );
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? 'text/plain',
      ...(upstream.headers.get('Content-Disposition')
        ? {
            'Content-Disposition': upstream.headers.get(
              'Content-Disposition',
            )!,
          }
        : {}),
    },
  });
}
