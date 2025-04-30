import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the path is protected
  const isProtectedPath = !pathname.startsWith('/auth') && 
                          !pathname.startsWith('/api/auth') &&
                          !pathname.startsWith('/_next') &&
                          !pathname.startsWith('/static');

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  // Get the token from the session
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  });

  // If there's no token and the path is protected, redirect to login
  if (!token && isProtectedPath) {
    const url = new URL('/auth/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // If there's a token and the user is trying to access auth pages, redirect to home
  if (token && pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
