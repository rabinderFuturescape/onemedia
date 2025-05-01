import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { corsHeaders, handleCors } from '../../cors';

export async function GET(request: NextRequest) {
  // Handle CORS preflight requests
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;
  
  const cookieStore = cookies();
  const authCookie = cookieStore.get('auth');
  
  // Create session response based on auth cookie
  const sessionData = authCookie 
    ? {
        user: {
          id: '1',
          name: 'Admin User',
          email: 'admin@example.com',
          image: null,
          roles: ['admin'],
          tenants: ['default'],
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }
    : null;
  
  const response = NextResponse.json({ 
    user: sessionData?.user || null,
    expires: sessionData?.expires || null,
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
