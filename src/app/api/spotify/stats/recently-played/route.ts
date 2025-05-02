import { getRecentlyPlayed } from "@/lib/spotify";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const recentTracks = await getRecentlyPlayed(session.accessToken, limit);
    
    return NextResponse.json({
      tracks: recentTracks.map((item: any) => ({
        id: item.track.id,
        name: item.track.name,
        artist: item.track.artists.map((artist: any) => artist.name).join(", "),
        album: item.track.album.name,
        playedAt: item.played_at,
        duration: item.track.duration_ms,
        spotifyUrl: item.track.external_urls.spotify,
        imageUrl: item.track.album.images?.[0]?.url || null,
      })),
    });
  } catch (error) {
    console.error("Error fetching recently played tracks:", error);
    return NextResponse.json(
      { error: "Failed to fetch recently played tracks" },
      { status: 500 }
    );
  }
} 