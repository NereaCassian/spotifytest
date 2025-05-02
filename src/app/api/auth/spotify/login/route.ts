import { NextRequest, NextResponse } from 'next/server';
import { LOGIN_URL } from '@/lib/spotify';

export async function GET(request: NextRequest) {
  // Get the current URL to use as the callback URI
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const host = request.headers.get('host') || '';
  const redirectUri = `${protocol}://${host}/api/auth/spotify`;
  
  // Construct the authorization URL with the callback URI
  const baseUrl = LOGIN_URL;
  const authUrl = new URL(baseUrl);
  authUrl.searchParams.append('redirect_uri', redirectUri);
  authUrl.searchParams.append('client_id', process.env.SPOTIFY_CLIENT_ID || '');
  authUrl.searchParams.append('response_type', 'code');
  
  // Redirect to Spotify authorization page
  return NextResponse.redirect(authUrl.toString());
} 