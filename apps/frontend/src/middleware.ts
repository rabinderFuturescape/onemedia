import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const nextUrl = request.nextUrl;

  // Get the token from the session
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // Log the request for debugging
  console.log(`Middleware processing: ${nextUrl.pathname}, Auth: ${!!token}`);

  // Handle static assets and API routes
  if (
    nextUrl.pathname.startsWith('/uploads/') ||
    nextUrl.pathname.startsWith('/p/') ||
    nextUrl.pathname.startsWith('/icons/') ||
    nextUrl.pathname.startsWith('/_next/') ||
    nextUrl.pathname.startsWith('/api/') ||
    nextUrl.pathname.startsWith('/test-auth')
  ) {
    return NextResponse.next();
  }

  // Redirect root to dashboard
  if (nextUrl.pathname === '/') {
    return NextResponse.redirect(
      new URL(!!process.env.IS_GENERAL ? '/launches' : '/analytics', nextUrl)
    );
  }

  // Protect routes that require authentication
  const protectedRoutes = ['/launches', '/analytics', '/dashboard', '/settings'];
  const isProtectedRoute = protectedRoutes.some(route =>
    nextUrl.pathname === route || nextUrl.pathname.startsWith(`${route}/`)
  );

  // If it's a protected route and no token, redirect to login
  if (isProtectedRoute && !token) {
    console.log(`Protected route access denied: ${nextUrl.pathname}`);
    return NextResponse.redirect(new URL('/auth/login', nextUrl.origin));
  }

  // If the url is /auth and the token exists, redirect to /
  if (nextUrl.pathname.startsWith('/auth') && token && nextUrl.pathname !== '/auth/logout') {
    return NextResponse.redirect(new URL('/', nextUrl.origin));
  }

  // Forward API requests to the real backend
  const backendPrefixes = ['/user/', '/integrations/', '/analytics/', '/messages/', '/billing/', '/posts'];
  const isBackendRequest = backendPrefixes.some(prefix => nextUrl.pathname.startsWith(prefix));

  if (isBackendRequest) {
    console.log(`Forwarding API request: ${nextUrl.pathname} to backend`);

    // Add the authorization header if we have a token
    const headers = new Headers(request.headers);
    if (token?.accessToken) {
      headers.set('Authorization', `Bearer ${token.accessToken}`);
    }

    return NextResponse.rewrite(
      new URL(`${process.env.BACKEND_URL}${nextUrl.pathname}`, nextUrl.origin),
      { headers }
    );
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)',
};
