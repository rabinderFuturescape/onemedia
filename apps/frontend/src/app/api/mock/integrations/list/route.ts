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

  // Mock integrations data
  const response = NextResponse.json([
    {
      id: '1',
      name: 'GitHub',
      identifier: 'github',
      type: 'SOCIAL',
      display: 'GitHub',
      picture: '/icons/platforms/github.png',
      inBetweenSteps: false,
      changeProfilePicture: false,
      additionalSettings: '{}',
      changeNickName: false,
      time: [{ time: 540 }, { time: 720 }, { time: 900 }], // 9:00, 12:00, 15:00
      disabled: false
    },
    {
      id: '2',
      name: 'Twitter',
      identifier: 'twitter',
      type: 'SOCIAL',
      display: 'Twitter',
      picture: '/icons/platforms/twitter.png',
      inBetweenSteps: false,
      changeProfilePicture: false,
      additionalSettings: '{}',
      changeNickName: false,
      time: [{ time: 480 }, { time: 660 }, { time: 840 }], // 8:00, 11:00, 14:00
      disabled: false
    },
    {
      id: '3',
      name: 'LinkedIn',
      identifier: 'linkedin',
      type: 'SOCIAL',
      display: 'LinkedIn',
      picture: '/icons/platforms/linkedin.png',
      inBetweenSteps: false,
      changeProfilePicture: false,
      additionalSettings: '{}',
      changeNickName: false,
      time: [{ time: 600 }, { time: 780 }, { time: 960 }], // 10:00, 13:00, 16:00
      disabled: false
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
