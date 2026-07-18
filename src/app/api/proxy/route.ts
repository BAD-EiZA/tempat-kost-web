import { getAccessToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function POST(req: Request) {
  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  const payload = (await req.json()) as {
    path: string;
    body?: unknown;
    method?: string;
  };
  const method = (payload.method ?? 'POST').toUpperCase();
  const res = await fetch(`${API_URL}${payload.path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(method !== 'GET' && method !== 'HEAD'
        ? { 'Content-Type': 'application/json' }
        : {}),
      Accept: 'application/json',
    },
    body:
      method !== 'GET' && method !== 'HEAD' && payload.body !== undefined
        ? JSON.stringify(payload.body)
        : undefined,
  });
  const text = await res.text();
  let data: unknown = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  return NextResponse.json(data, { status: res.status });
}
