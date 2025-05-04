import { getTopArtists, getSpotifyToken } from "@/lib/spotify";
import { NextRequest, NextResponse } from "next/server";
import { auth } from '@clerk/nextjs/server'
export async function GET(request: NextRequest) {
  try {
    const { userId} = await auth()
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }
    const token = await getSpotifyToken(userId);
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get("time_range") || "medium_term";
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const validTimeRange = timeRange === 'short_term' || timeRange === 'medium_term' || timeRange === 'long_term' 
      ? timeRange 
      : 'medium_term';

    const topArtists = await getTopArtists(token, validTimeRange, limit);
    
    return NextResponse.json({
      artists: topArtists.map((artist: any) => ({
        id: artist.id,
        name: artist.name,
        genres: artist.genres,
        popularity: artist.popularity,
        imageUrl: artist.images?.[0]?.url || null,
      })),
    });
  } catch (error) {
    console.error("Error fetching top artists:", error);
    return NextResponse.json(
      { error: "Failed to fetch top artists" },
      { status: 500 }
    );
  }
} 