import { getPlaylistTracks } from "@/lib/spotify";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth";
import { CloudflareKV, savePlaylistConversion } from "@/lib/cloudflare";

interface PlaylistRequestBody {
  spotifyPlaylistId: string;
  playlistName?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { spotifyPlaylistId, playlistName } = await request.json() as PlaylistRequestBody;
    
    if (!spotifyPlaylistId) {
      return NextResponse.json(
        { error: "Playlist ID is required" },
        { status: 400 }
      );
    }

    // Get tracks from the Spotify playlist
    const playlistTracks = await getPlaylistTracks(session.accessToken, spotifyPlaylistId);

    // Format the data for storage and YouTube conversion
    const tracks = playlistTracks
      .filter(item => item.track !== null)
      .map((item) => {
        // TypeScript no detecta correctamente el filtrado previo, así que usamos non-null assertion
        const track = item.track!;
        return {
          artist: track.artists.map(artist => artist.name).join(", "),
          title: track.name,
          album: track.album.name,
          spotifyUri: track.uri,
        };
      });

    // Generate a unique URL for YouTube conversion
    const conversionId = generateUniqueId();
    const youtubeImportUrl = `${request.nextUrl.origin}/youtube-import/${conversionId}`;

    // Store playlist data in Cloudflare KV
    if (process.env.CF_PAGES && session.user?.id) {
      const env = (process.env as any).CF as CloudflareKV;
      if (env?.SPOTIFY_PLAYLISTS) {
        await savePlaylistConversion(env, {
          spotifyPlaylistId,
          userId: session.user.id,
          name: playlistName || "Converted Playlist",
          tracks,
          conversionDate: Date.now(),
          youtubeUrl: youtubeImportUrl,
        });
      }
    }

    // Format the data for YouTube Music import
    const youtubeData = {
      title: playlistName || "Spotify Playlist",
      tracks: tracks.map(track => ({
        artist: track.artist,
        title: track.title,
        album: track.album,
      })),
    };

    return NextResponse.json({
      success: true,
      youtubeImportUrl,
      youtubeData,
      trackCount: tracks.length,
    });
  } catch (error) {
    console.error("Error converting playlist:", error);
    return NextResponse.json(
      { error: "Failed to convert playlist" },
      { status: 500 }
    );
  }
}

// Helper function to generate a unique ID for the conversion
function generateUniqueId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
} 