import { NextRequest, NextResponse } from 'next/server';
import { refreshAccessToken } from '@/lib/edge-auth';
import { cookies } from 'next/headers';

// Route to refresh the access token
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('spotify_refresh_token')?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: 'No refresh token available' }, { status: 401 });
  }

  try {
    const tokenResponse = await refreshAccessToken(
      refreshToken,
      process.env.SPOTIFY_CLIENT_ID as string,
      process.env.SPOTIFY_CLIENT_SECRET as string
    );

    // Update the access token cookie
    cookieStore.set('spotify_access_token', tokenResponse.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: tokenResponse.expires_in,
      path: '/'
    });

    // If a new refresh token was provided, update it
    if (tokenResponse.refresh_token) {
      cookieStore.set('spotify_refresh_token', tokenResponse.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/'
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error refreshing token:', error);
    return NextResponse.json({ error: 'Failed to refresh token' }, { status: 500 });
  }
} 