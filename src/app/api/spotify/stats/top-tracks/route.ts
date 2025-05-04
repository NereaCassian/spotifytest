import { getTopTracks, getSpotifyToken } from "@/lib/spotify";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";


export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
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

    const topTracks = await getTopTracks(token, validTimeRange, limit);
    
    return NextResponse.json({
      tracks: topTracks.map((track: any) => ({
        id: track.id,
        name: track.name,
        artist: track.artists.map((artist: any) => artist.name).join(", "),
        album: track.album.name,
        popularity: track.popularity,
        duration: track.duration_ms,
        previewUrl: track.preview_url,
        spotifyUrl: track.external_urls.spotify,
        imageUrl: track.album.images?.[0]?.url || null,
      })),
    });
  } catch (error) {
    console.error("Error fetching top tracks:", error);
    return NextResponse.json(
      { error: "Failed to fetch top tracks" },
      { status: 500 }
    );
  }
} 