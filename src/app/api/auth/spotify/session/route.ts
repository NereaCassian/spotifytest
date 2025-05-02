import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('spotify_access_token')?.value;
  const userCookie = cookieStore.get('spotify_user')?.value;
  
  if (!accessToken || !userCookie) {
    return NextResponse.json({ 
      authenticated: false,
      user: null 
    });
  }
  
  try {
    // Parse user data from cookie
    const userData = JSON.parse(userCookie);
    
    return NextResponse.json({
      authenticated: true,
      user: userData
    });
  } catch (error) {
    console.error('Error getting session:', error);
    return NextResponse.json({ 
      authenticated: false,
      user: null
    });
  }
} 