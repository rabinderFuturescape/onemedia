import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { corsHeaders, handleCors } from '../../cors';

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
  
  // Mock launches data
  const response = NextResponse.json({
    launches: [
      {
        id: '1',
        name: 'Product Launch 1',
        status: 'ACTIVE',
        date: new Date().toISOString(),
        metrics: {
          views: 1000,
          clicks: 500,
          conversions: 100
        }
      },
      {
        id: '2',
        name: 'Product Launch 2',
        status: 'SCHEDULED',
        date: new Date(Date.now() + 86400000).toISOString(),
        metrics: {
          views: 0,
          clicks: 0,
          conversions: 0
        }
      },
      {
        id: '3',
        name: 'Product Launch 3',
        status: 'COMPLETED',
        date: new Date(Date.now() - 86400000).toISOString(),
        metrics: {
          views: 2000,
          clicks: 1000,
          conversions: 200
        }
      }
    ]
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
