// Reemplazamos la dependencia de spotify-web-api-node con una implementación basada en fetch
// import SpotifyWebApi from 'spotify-web-api-node';

// Definimos interfaces para los datos devueltos por Spotify
interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

interface SpotifyUserProfile {
  id: string;
  display_name: string;
  email?: string;
  images: { url: string; height: number; width: number }[];
  country?: string;
  product?: string;
  // Otros campos que puedas necesitar
}

interface SpotifyPagingObject<T> {
  href: string;
  items: T[];
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
}

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { id: string; name: string; uri: string }[];
  album: {
    id: string;
    name: string;
    images: { url: string; height: number; width: number }[];
    uri: string;
  };
  duration_ms: number;
  popularity: number;
  uri: string;
  // Otros campos que puedas necesitar
}

interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  images: { url: string; height: number; width: number }[];
  popularity: number;
  uri: string;
  // Otros campos que puedas necesitar
}

interface SpotifyPlaylistTrack {
  added_at: string;
  track: SpotifyTrack;
  // Otros campos que puedas necesitar
}

interface SpotifyPlayHistory {
  track: SpotifyTrack;
  played_at: string;
  context: {
    type: string;
    uri: string;
  };
}

// Definimos las mismas constantes y URLs de autenticación
const scopes = [
  'user-read-email',
  'user-read-private',
  'user-top-read',
  'user-read-recently-played',
  'user-read-currently-playing',
  'user-read-playback-state',
  'playlist-read-private',
  'playlist-read-collaborative',
].join(',');

const params = {
  scope: scopes,
};

const queryParamString = new URLSearchParams(params).toString();

export const LOGIN_URL = `https://accounts.spotify.com/authorize?${queryParamString}`;

// Variables para guardar credenciales
let accessToken: string | null = null;
let refreshToken: string | null = null;
let clientId: string | null = process.env.SPOTIFY_CLIENT_ID || null;
let clientSecret: string | null = process.env.SPOTIFY_CLIENT_SECRET || null;

// Función para establecer el token de acceso
export const setAccessToken = (token: string) => {
  accessToken = token;
};

// Función para establecer el token de actualización
export const setRefreshToken = (token: string) => {
  refreshToken = token;
};

// Edge-compatible base64 encoding function
const encodeBase64 = (str: string): string => {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  return btoa(String.fromCharCode(...new Uint8Array(data.buffer)));
};

// Implementación basada en fetch para refrescar el token de acceso
export const getAccessToken = async (refToken: string) => {
  try {
    const basicAuth = encodeBase64(`${clientId}:${clientSecret}`);
    
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refToken,
      }).toString(),
    });
    
    if (!response.ok) {
      throw new Error(`Error refreshing access token: ${response.status}`);
    }
    
    const data = await response.json() as SpotifyTokenResponse;
    return data.access_token;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return null;
  }
};

// Implementación para obtener el perfil del usuario
export const getUserProfile = async (token: string) => {
  try {
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Error getting user profile: ${response.status}`);
    }
    
    const data = await response.json() as SpotifyUserProfile;
    return { body: data };
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

// Implementación para obtener las pistas más escuchadas
export const getTopTracks = async (
  token: string, 
  timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term', 
  limit = 10
) => {
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Error getting top tracks: ${response.status}`);
    }
    
    const data = await response.json() as SpotifyPagingObject<SpotifyTrack>;
    return data.items;
  } catch (error) {
    console.error('Error getting top tracks:', error);
    throw error;
  }
};

// Implementación para obtener los artistas más escuchados
export const getTopArtists = async (
  token: string, 
  timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term', 
  limit = 10
) => {
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Error getting top artists: ${response.status}`);
    }
    
    const data = await response.json() as SpotifyPagingObject<SpotifyArtist>;
    return data.items;
  } catch (error) {
    console.error('Error getting top artists:', error);
    throw error;
  }
};

// Implementación para obtener las pistas reproducidas recientemente
export const getRecentlyPlayed = async (token: string, limit = 20) => {
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/me/player/recently-played?limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Error getting recently played tracks: ${response.status}`);
    }
    
    const data = await response.json() as SpotifyPagingObject<SpotifyPlayHistory>;
    return data.items;
  } catch (error) {
    console.error('Error getting recently played tracks:', error);
    throw error;
  }
};

// Implementación para obtener las listas de reproducción del usuario
export const getUserPlaylists = async (token: string, limit = 20) => {
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/me/playlists?limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Error getting user playlists: ${response.status}`);
    }
    
    const data = await response.json() as SpotifyPagingObject<any>;
    return data.items;
  } catch (error) {
    console.error('Error getting user playlists:', error);
    throw error;
  }
};

// Implementación para obtener las pistas de una lista de reproducción
export const getPlaylistTracks = async (token: string, playlistId: string) => {
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Error getting playlist tracks: ${response.status}`);
    }
    
    const data = await response.json() as SpotifyPagingObject<SpotifyPlaylistTrack>;
    return data.items;
  } catch (error) {
    console.error('Error getting playlist tracks:', error);
    throw error;
  }
};

// Implementación para obtener recomendaciones
export const getRecommendations = async (
  token: string,
  seedArtists: string[] = [],
  seedTracks: string[] = [],
  seedGenres: string[] = [],
  limit = 20
) => {
  try {
    const params = new URLSearchParams();
    if (seedArtists.length > 0) params.append('seed_artists', seedArtists.join(','));
    if (seedTracks.length > 0) params.append('seed_tracks', seedTracks.join(','));
    if (seedGenres.length > 0) params.append('seed_genres', seedGenres.join(','));
    params.append('limit', limit.toString());
    
    const response = await fetch(
      `https://api.spotify.com/v1/recommendations?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error(`Error getting recommendations: ${response.status}`);
    }
    
    const data = await response.json() as { tracks: SpotifyTrack[] };
    return data.tracks;
  } catch (error) {
    console.error('Error getting recommendations:', error);
    throw error;
  }
}; 