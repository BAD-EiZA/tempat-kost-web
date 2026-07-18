import { redirect } from 'next/navigation';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

export async function requireAuth() {
  const { isAuthenticated } = getKindeServerSession();
  if (!(await isAuthenticated())) {
    redirect('/api/auth/login');
  }
}

export async function getAccessToken(): Promise<string | null> {
  const { getAccessTokenRaw, isAuthenticated } = getKindeServerSession();
  if (!(await isAuthenticated())) return null;
  const raw = await getAccessTokenRaw();
  return raw ?? null;
}

export async function getSessionUser() {
  const { getUser, isAuthenticated } = getKindeServerSession();
  if (!(await isAuthenticated())) return null;
  return getUser();
}
