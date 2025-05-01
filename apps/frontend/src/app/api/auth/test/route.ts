import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { corsHeaders, handleCors } from '../../cors';

export async function GET(request: NextRequest) {
  // Handle CORS preflight requests
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  const cookieStore = cookies();
  const authCookie = cookieStore.get('auth');

  const response = NextResponse.json({
    authenticated: !!authCookie,
    authCookie: authCookie ? authCookie.value : null,
    allCookies: cookieStore.getAll().map(c => ({ name: c.name, value: c.value })),
    headers: Object.fromEntries(request.headers),
  });

  // Add CORS headers to the response
  Object.entries(corsHeaders(request)).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return handleCors(request);
}
