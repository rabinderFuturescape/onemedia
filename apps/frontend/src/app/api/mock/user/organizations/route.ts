import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { corsHeaders, handleCors } from '../../../cors';

export async function GET(request: NextRequest) {
  // Handle CORS preflight requests
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  const cookieStore = cookies();
  const authCookie = cookieStore.get('auth');

  if (!authCookie) {
    const errorResponse = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Add CORS headers to the response
    Object.entries(corsHeaders(request)).forEach(([key, value]) => {
      errorResponse.headers.set(key, value);
    });

    return errorResponse;
  }

  // Mock organizations data
  const response = NextResponse.json([
    {
      id: '1',
      name: 'Default Organization',
      role: 'ADMIN',
      isDefault: true
    }
  ]);

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
