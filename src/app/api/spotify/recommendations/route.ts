import { getTopArtists, getTopTracks } from "@/lib/spotify";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidateTag } from "next/cache";

// Initialize Google Generative AI with API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

interface SpotifySearchResponse<T> {
  artists?: { items: T[] };
  albums?: { items: T[] };
  tracks?: { items: T[] };
}

// Función para buscar detalles de artistas en Spotify
async function searchSpotifyArtists(accessToken: string, artistNames: string[]) {
  const artistDetails = [];
  
  for (const name of artistNames) {
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=artist&limit=1`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          next: { tags: ['spotifyArtists'] }
        }
      );
      
      const data = await response.json() as SpotifySearchResponse<{
        name: string;
        id: string;
        genres: string[];
        popularity: number;
        images?: { url: string }[];
        external_urls: { spotify: string };
      }>;
      
      if (data.artists && data.artists.items.length > 0) {
        const artist = data.artists.items[0];
        artistDetails.push({
          name: artist.name,
          id: artist.id,
          genres: artist.genres,
          popularity: artist.popularity,
          imageUrl: artist.images?.[0]?.url || null,
          spotifyUrl: artist.external_urls.spotify
        });
      } else {
        // Artista no encontrado, devolver solo el nombre
        artistDetails.push({ name, notFound: true });
      }
    } catch (error) {
      console.error(`Error buscando artista ${name}:`, error);
      artistDetails.push({ name, error: true });
    }
  }
  
  return artistDetails;
}

// Función para buscar detalles de álbumes en Spotify
async function searchSpotifyAlbums(accessToken: string, albumNames: string[]) {
  const albumDetails = [];
  
  for (const name of albumNames) {
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=album&limit=1`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          next: { tags: ['spotifyAlbums'] }
        }
      );
      
      const data = await response.json() as SpotifySearchResponse<{
        name: string;
        id: string;
        artists: { name: string }[];
        release_date: string;
        images?: { url: string }[];
        external_urls: { spotify: string };
        total_tracks: number;
      }>;
      
      if (data.albums && data.albums.items.length > 0) {
        const album = data.albums.items[0];
        albumDetails.push({
          name: album.name,
          id: album.id,
          artist: album.artists.map((a) => a.name).join(', '),
          releaseDate: album.release_date,
          imageUrl: album.images?.[0]?.url || null,
          spotifyUrl: album.external_urls.spotify,
          totalTracks: album.total_tracks
        });
      } else {
        // Álbum no encontrado, devolver solo el nombre
        albumDetails.push({ name, notFound: true });
      }
    } catch (error) {
      console.error(`Error buscando álbum ${name}:`, error);
      albumDetails.push({ name, error: true });
    }
  }
  
  return albumDetails;
}

// Función para buscar detalles de canciones en Spotify
async function searchSpotifyTracks(accessToken: string, trackNames: {name: string, artist?: string}[]) {
  const trackDetails = [];
  
  for (const track of trackNames) {
    try {
      let query = track.name;
      if (track.artist) {
        query += ` artist:${track.artist}`;
      }
      
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          next: { tags: ['spotifyTracks'] }
        }
      );
      
      const data = await response.json() as SpotifySearchResponse<{
        name: string;
        id: string;
        artists: { name: string }[];
        album: { name: string; images?: { url: string }[] };
        popularity: number;
        duration_ms: number;
        preview_url: string | null;
        external_urls: { spotify: string };
      }>;
      
      if (data.tracks && data.tracks.items.length > 0) {
        const trackInfo = data.tracks.items[0];
        trackDetails.push({
          name: trackInfo.name,
          id: trackInfo.id,
          artist: trackInfo.artists.map((a) => a.name).join(', '),
          album: trackInfo.album.name,
          popularity: trackInfo.popularity,
          duration: trackInfo.duration_ms,
          previewUrl: trackInfo.preview_url,
          spotifyUrl: trackInfo.external_urls.spotify,
          imageUrl: trackInfo.album.images?.[0]?.url || null
        });
      } else {
        // Canción no encontrada, devolver solo el nombre
        trackDetails.push({ name: track.name, artist: track.artist, notFound: true });
      }
    } catch (error) {
      console.error(`Error buscando canción ${track.name}:`, error);
      trackDetails.push({ name: track.name, artist: track.artist, error: true });
    }
  }
  
  return trackDetails;
}

// Función para eliminar código Markdown y extraer solo el JSON
function extractJsonFromMarkdown(text: string): string {
  // Eliminar bloques de código Markdown ```json y ```
  if (text.includes('```')) {
    // Si el texto contiene bloques de código, intentamos extraer solo el contenido
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch && jsonMatch[1]) {
      return jsonMatch[1].trim();
    }
  }
  
  // Si no hay bloques de código o no pudimos extraerlos, devolvemos el texto original limpiado
  return text.replace(/```json|```/g, '').trim();
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const url = new URL(request.url);
    const regenerate = url.searchParams.get('regenerate') === 'true';
    
    // Si se solicita regeneración, invalidamos las etiquetas de caché
    if (regenerate) {
      revalidateTag('userRecommendations');
      revalidateTag('spotifyArtists');
      revalidateTag('spotifyAlbums');
      revalidateTag('spotifyTracks');
    }

    // Get user's top tracks and artists to understand their preferences
    const [topTracks, topArtists] = await Promise.all([
      getTopTracks(session.accessToken, "medium_term", 5),
      getTopArtists(session.accessToken, "medium_term", 5),
    ]);

    // Extract genres from top artists
    const allGenres = topArtists.flatMap((artist: any) => artist.genres || []);
    const uniqueGenres = [...new Set(allGenres)].slice(0, 3) as string[];

    // Format user's music taste information for Gemini
    const userTasteInfo = {
      topArtists: topArtists.slice(0, 5).map((artist: any) => ({
        name: artist.name,
        genres: artist.genres,
        popularity: artist.popularity
      })),
      topTracks: topTracks.slice(0, 5).map((track: any) => ({
        name: track.name,
        artist: track.artists.map((a: any) => a.name).join(", "),
        popularity: track.popularity
      }))
    };

    // Verificar si ya tenemos recomendaciones almacenadas en caché
    const cacheKey = `user-${session.user?.email || session.user?.name || 'anonymous'}-recommendations`;
    const getCachedResults = async () => {
      // Use el fetch con caché para almacenar los resultados
      const geminiResponse = await fetch(`${url.origin}/api/spotify/recommendations-cache/${cacheKey}`, {
        next: { tags: ['userRecommendations'] }
      });
      
      if (geminiResponse.ok) {
        return geminiResponse.json();
      }
      return null;
    };
    
    // Solo obtenemos nuevas recomendaciones si regenerate=true o no hay caché existente
    let aiInsights;
    if (regenerate) {
      // Use Gemini to analyze preferences and provide AI-based recommendations
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      const prompt = `
        As a music expert AI, analyze this user's listening preferences:
        
        Top Artists: ${JSON.stringify(userTasteInfo.topArtists)}
        Top Tracks: ${JSON.stringify(userTasteInfo.topTracks)}
        
        Based on this data:
        1. What musical patterns do you notice in their taste?
        2. Recommend 5 specific tracks they might enjoy
        3. Recommend 5 specific artists they might enjoy that aren't in their top artists
        4. Recommend 5 specific albums they might enjoy
        5. Suggest 3-5 genres they might like to explore
        
        Return your response as a clean JSON object with these fields only:
        {
          "patterns": ["pattern1", "pattern2", ...],
          "recommendedTracks": [{"name": "track name", "artist": "artist name"}, ...],
          "recommendedArtists": ["artist1", "artist2", ...],
          "recommendedAlbums": ["album1", "album2", ...],
          "recommendedGenres": ["genre1", "genre2", ...]
        }
        
        IMPORTANT: Return ONLY the JSON with no explanations, no backticks, and no markdown formatting.
        Just the raw JSON data.
      `;
      
      const geminiResult = await model.generateContent(prompt);
      const geminiResponse = await geminiResult.response.text();
      console.log("Raw Gemini response:", geminiResponse.substring(0, 200) + "...");
      
      // Parse Gemini's response
      try {
        // Limpiamos la respuesta de Markdown antes de parsear
        const cleanedResponse = extractJsonFromMarkdown(geminiResponse);
        console.log("Cleaned response:", cleanedResponse.substring(0, 200) + "...");
        
        aiInsights = JSON.parse(cleanedResponse);
        
        // Asegurarse de que todas las propiedades existan
        aiInsights.patterns = aiInsights.patterns || [];
        aiInsights.recommendedTracks = aiInsights.recommendedTracks || [];
        aiInsights.recommendedArtists = aiInsights.recommendedArtists || [];
        aiInsights.recommendedAlbums = aiInsights.recommendedAlbums || [];
        aiInsights.recommendedGenres = aiInsights.recommendedGenres || [];
      } catch (error) {
        console.error("Failed to parse Gemini response:", error);
        console.log("Raw response:", geminiResponse);
        
        // Crear un objeto fallback si falla el parsing
        aiInsights = {
          patterns: ["Based on your listening history"],
          recommendedTracks: [],
          recommendedArtists: [],
          recommendedAlbums: [],
          recommendedGenres: []
        };
      }
    } else {
      // Intentar obtener resultados en caché
      const cachedResults = await getCachedResults();
      if (cachedResults) {
        return NextResponse.json(cachedResults);
      }
      
      // Si no hay caché, generamos nuevas recomendaciones
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      const prompt = `
        As a music expert AI, analyze this user's listening preferences:
        
        Top Artists: ${JSON.stringify(userTasteInfo.topArtists)}
        Top Tracks: ${JSON.stringify(userTasteInfo.topTracks)}
        
        Based on this data:
        1. What musical patterns do you notice in their taste?
        2. Recommend 5 specific tracks they might enjoy
        3. Recommend 5 specific artists they might enjoy that aren't in their top artists
        4. Recommend 5 specific albums they might enjoy
        5. Suggest 3-5 genres they might like to explore
        
        Return your response as a clean JSON object with these fields only:
        {
          "patterns": ["pattern1", "pattern2", ...],
          "recommendedTracks": [{"name": "track name", "artist": "artist name"}, ...],
          "recommendedArtists": ["artist1", "artist2", ...],
          "recommendedAlbums": ["album1", "album2", ...],
          "recommendedGenres": ["genre1", "genre2", ...]
        }
        
        IMPORTANT: Return ONLY the JSON with no explanations, no backticks, and no markdown formatting.
        Just the raw JSON data.
      `;
      
      const geminiResult = await model.generateContent(prompt);
      const geminiResponse = await geminiResult.response.text();
      
      try {
        // Limpiamos la respuesta de Markdown antes de parsear
        const cleanedResponse = extractJsonFromMarkdown(geminiResponse);
        
        aiInsights = JSON.parse(cleanedResponse);
        
        // Asegurarse de que todas las propiedades existan
        aiInsights.patterns = aiInsights.patterns || [];
        aiInsights.recommendedTracks = aiInsights.recommendedTracks || [];
        aiInsights.recommendedArtists = aiInsights.recommendedArtists || [];
        aiInsights.recommendedAlbums = aiInsights.recommendedAlbums || [];
        aiInsights.recommendedGenres = aiInsights.recommendedGenres || [];
      } catch (error) {
        console.error("Failed to parse Gemini response:", error);
        
        // Crear un objeto fallback si falla el parsing
        aiInsights = {
          patterns: ["Based on your listening history"],
          recommendedTracks: [],
          recommendedArtists: [],
          recommendedAlbums: [],
          recommendedGenres: []
        };
      }
    }
    
    // Obtener información detallada de Spotify para las recomendaciones
    const [enrichedArtists, enrichedAlbums, enrichedTracks] = await Promise.all([
      searchSpotifyArtists(session.accessToken, aiInsights.recommendedArtists),
      searchSpotifyAlbums(session.accessToken, aiInsights.recommendedAlbums),
      searchSpotifyTracks(session.accessToken, aiInsights.recommendedTracks)
    ]);
    
    const results = {
      patterns: aiInsights.patterns,
      recommendedArtists: enrichedArtists,
      recommendedAlbums: enrichedAlbums, 
      recommendedTracks: enrichedTracks,
      recommendedGenres: aiInsights.recommendedGenres,
      userTaste: {
        topArtists: userTasteInfo.topArtists.map((artist: any) => artist.name),
        topTracks: userTasteInfo.topTracks.map((track: any) => `${track.name} by ${track.artist}`),
        genres: uniqueGenres,
      }
    };
    
    // Guardar resultados en caché
    try {
      await fetch(`${url.origin}/api/spotify/recommendations-cache/${cacheKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(results),
      });
    } catch (error) {
      console.error("Error al guardar en caché:", error);
    }
    
    return NextResponse.json(results);
  } catch (error) {
    console.error("Error generating AI recommendations:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
} 