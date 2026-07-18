import { withAuth } from '@kinde-oss/kinde-auth-nextjs/middleware';
import type { NextRequest } from 'next/server';

export default function proxy(req: NextRequest) {
  return withAuth(req, {
    publicPaths: [
      '/',
      '/p',
      '/sign',
      '/api/auth',
      '/manifest.webmanifest',
      '/sw.js',
    ],
    isReturnToCurrentPage: true,
  });
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
