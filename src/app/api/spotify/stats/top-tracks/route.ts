import { getTopTracks } from "@/lib/spotify";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get("time_range") || "medium_term";
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const validTimeRange = timeRange === 'short_term' || timeRange === 'medium_term' || timeRange === 'long_term' 
      ? timeRange 
      : 'medium_term';

    const topTracks = await getTopTracks(session.accessToken, validTimeRange, limit);
    
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