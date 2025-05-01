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
  
  // Mock analytics data
  const response = NextResponse.json({
    data: [
      {
        date: new Date().toISOString().split('T')[0],
        views: 1000,
        clicks: 500,
        conversions: 100
      },
      {
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        views: 900,
        clicks: 450,
        conversions: 90
      },
      {
        date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
        views: 800,
        clicks: 400,
        conversions: 80
      }
    ],
    summary: {
      total_views: 2700,
      total_clicks: 1350,
      total_conversions: 270,
      conversion_rate: 10
    }
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
