import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function GET(req: NextRequest) {
  try {
    // Get the token from the session
    const token = await getToken({ 
      req,
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // This would typically fetch data from your backend API
    // Here we're just returning the user data from the token
    return NextResponse.json({
      id: token.sub,
      name: token.name,
      email: token.email,
      tenant_id: token.tenant_id,
      roles: token.roles,
      // Add additional user data here
      subscription: {
        status: 'active',
        plan: 'premium',
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      stats: {
        logins: 42,
        lastLogin: new Date().toISOString(),
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      }
    });
  } catch (error) {
    console.error('Error in profile API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
