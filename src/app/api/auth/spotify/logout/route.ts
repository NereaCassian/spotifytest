import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  // Get the cookie store
  const cookieStore = await cookies();
  
  // Clear all authentication cookies
  cookieStore.set('spotify_access_token', '', { maxAge: 0 });
  cookieStore.set('spotify_refresh_token', '', { maxAge: 0 });
  cookieStore.set('spotify_user', '', { maxAge: 0 });
  
  // Redirect to home page
  return NextResponse.json({ success: true });
} 