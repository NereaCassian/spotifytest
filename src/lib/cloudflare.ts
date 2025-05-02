// Cloudflare KV storage utility functions
// This interfaces with Cloudflare KV for storing user data and playlists

export interface CloudflareKV {
  SPOTIFY_USERS: KVNamespace;
  SPOTIFY_PLAYLISTS: KVNamespace;
}

export interface SpotifyUserData {
  userId: string;
  refreshToken: string;
  name: string;
  email: string;
  imageUrl?: string;
  lastLogin: number;
}

export interface PlaylistConversion {
  spotifyPlaylistId: string;
  userId: string;
  name: string;
  tracks: Array<{
    artist: string;
    title: string;
    album?: string;
    spotifyUri: string;
  }>;
  conversionDate: number;
  youtubeUrl?: string;
}

// Save user data to KV
export async function saveUserData(
  env: CloudflareKV,
  userData: SpotifyUserData
): Promise<void> {
  await env.SPOTIFY_USERS.put(userData.userId, JSON.stringify(userData));
}

// Get user data from KV
export async function getUserData(
  env: CloudflareKV,
  userId: string
): Promise<SpotifyUserData | null> {
  const data = await env.SPOTIFY_USERS.get(userId);
  if (!data) return null;
  return JSON.parse(data) as SpotifyUserData;
}

// Save a playlist conversion to KV
export async function savePlaylistConversion(
  env: CloudflareKV,
  conversion: PlaylistConversion
): Promise<void> {
  const key = `${conversion.userId}:${conversion.spotifyPlaylistId}`;
  await env.SPOTIFY_PLAYLISTS.put(key, JSON.stringify(conversion));
}

// Get a playlist conversion from KV
export async function getPlaylistConversion(
  env: CloudflareKV,
  userId: string,
  spotifyPlaylistId: string
): Promise<PlaylistConversion | null> {
  const key = `${userId}:${spotifyPlaylistId}`;
  const data = await env.SPOTIFY_PLAYLISTS.get(key);
  if (!data) return null;
  return JSON.parse(data) as PlaylistConversion;
}

// Get all playlist conversions for a user
export async function getUserPlaylistConversions(
  env: CloudflareKV,
  userId: string
): Promise<PlaylistConversion[]> {
  const prefix = `${userId}:`;
  const { keys } = await env.SPOTIFY_PLAYLISTS.list({ prefix });
  const conversions: PlaylistConversion[] = [];
  
  for (const key of keys) {
    const data = await env.SPOTIFY_PLAYLISTS.get(key.name);
    if (data) {
      conversions.push(JSON.parse(data) as PlaylistConversion);
    }
  }
  
  return conversions;
}

// Update a playlist conversion with YouTube URL
export async function updatePlaylistWithYouTubeUrl(
  env: CloudflareKV,
  userId: string,
  spotifyPlaylistId: string,
  youtubeUrl: string
): Promise<void> {
  const conversion = await getPlaylistConversion(env, userId, spotifyPlaylistId);
  if (!conversion) throw new Error('Playlist conversion not found');
  
  conversion.youtubeUrl = youtubeUrl;
  await savePlaylistConversion(env, conversion);
} 