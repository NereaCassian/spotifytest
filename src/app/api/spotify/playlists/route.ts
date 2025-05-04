import { getSpotifyToken, getUserPlaylists } from "@/lib/spotify";
import { NextRequest, NextResponse } from "next/server";
import { auth } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return new Response('Unauthorized', { status: 401 })
    }
    const token = await getSpotifyToken(userId);
    
    const playlists = await getUserPlaylists(token);
    
    return NextResponse.json({
      playlists: playlists.map((playlist: any) => ({
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        images: playlist.images,
        imageUrl: playlist.images?.[0]?.url || null,
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