import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to handle noise requests and suppress logs
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // List of paths to silently ignore (no 404 logs)
  const ignoredPaths = [
    '/current-url',
    '/.identity',
    '/favicon.ico',
    '/.well-known',
    '/robots.txt',
    '/sitemap.xml',
  ];

  // Check if path should be ignored
  const shouldIgnore = ignoredPaths.some(ignored => pathname.startsWith(ignored));

  if (shouldIgnore) {
    // Return 404 silently without logging
    return new NextResponse(null, { status: 404 });
  }

  // Continue with normal processing
  return NextResponse.next();
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     */
    '/((?!api|_next/static|_next/image).*)',
  ],
};

