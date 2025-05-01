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

  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const display = searchParams.get('display') || 'week';
  const day = searchParams.get('day') || '1';
  const week = searchParams.get('week') || '1';
  const month = searchParams.get('month') || '1';
  const year = searchParams.get('year') || '2025';

  // Mock posts data
  const response = NextResponse.json({
    posts: [
      {
        id: '1',
        content: 'This is a mock post for GitHub',
        publishDate: `${year}-${month.padStart(2, '0')}-15T09:00:00Z`,
        state: 'PUBLISHED',
        integration: {
          id: '1',
          name: 'GitHub',
          providerIdentifier: 'github',
          picture: '/icons/platforms/github.png'
        },
        tags: [
          {
            tag: {
              id: '1',
              name: 'Feature',
              color: '#4CAF50'
            }
          }
        ]
      },
      {
        id: '2',
        content: 'This is a mock post for Twitter',
        publishDate: `${year}-${month.padStart(2, '0')}-16T08:00:00Z`,
        state: 'DRAFT',
        integration: {
          id: '2',
          name: 'Twitter',
          providerIdentifier: 'twitter',
          picture: '/icons/platforms/twitter.png'
        },
        tags: [
          {
            tag: {
              id: '2',
              name: 'Announcement',
              color: '#2196F3'
            }
          }
        ]
      },
      {
        id: '3',
        content: 'This is a mock post for LinkedIn',
        publishDate: `${year}-${month.padStart(2, '0')}-17T10:00:00Z`,
        state: 'PUBLISHED',
        integration: {
          id: '3',
          name: 'LinkedIn',
          providerIdentifier: 'linkedin',
          picture: '/icons/platforms/linkedin.png'
        },
        tags: [
          {
            tag: {
              id: '3',
              name: 'News',
              color: '#FF9800'
            }
          }
        ]
      }
    ],
    comments: []
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
