import { getUserPlaylists } from "@/lib/spotify";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const playlists = await getUserPlaylists(session.accessToken);
    
    return NextResponse.json({
      playlists: playlists.map((playlist: any) => ({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        images: playlist.images,
        tracks: playlist.tracks,
        uri: playlist.uri,
        external_urls: playlist.external_urls,
      })),
    });
  } catch (error) {
    console.error("Error fetching playlists:", error);
    return NextResponse.json(
      { error: "Failed to fetch playlists" },
      { status: 500 }
    );
  }
} 