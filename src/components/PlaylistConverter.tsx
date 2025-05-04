'use client';

import { useState } from 'react';
import Image from 'next/image';
import { SignInButton, SignOutButton, useAuth, useUser} from '@clerk/nextjs';
import { spotifyApi } from '@/lib/apiClient';
import { Playlist } from '@/types/spotify';

interface ConversionResult {
  youtubeImportUrl: string;
  trackCount: number;
}

// Response from the API
interface PlaylistApiResponse {
  playlists: {
    id: string;
    name: string;
    description: string;
    images: { url: string }[];
    imageUrl: string | null;
    tracks: { total: number };
    uri: string;
    external_urls: { spotify: string };
  }[];
  error?: string;
}

// Local interface for playlist data
interface PlaylistWithDetails {
  id: string;
  name: string;
  images: { url: string }[];
  imageUrl: string | null;
  tracks: { total: number };
}

export default function PlaylistConverter() {
  const { isSignedIn } = useAuth()
  const { user } = useUser()
  const [playlists, setPlaylists] = useState<PlaylistWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistWithDetails | null>(null);
  const [conversionResult, setConversionResult] = useState<ConversionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPlaylists = async () => {
    if (!isSignedIn) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/spotify/playlists');
      const data = await response.json() as PlaylistApiResponse;
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load playlists');
      }
      
      setPlaylists(data.playlists);
    } catch (err) {
      setError('Failed to load playlists');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const convertPlaylist = async () => {
    if (!selectedPlaylist) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await spotifyApi.convertPlaylistToYoutube(
        selectedPlaylist.id,
        selectedPlaylist.name
      );
      
      setConversionResult(result);
    } catch (err) {
      setError('Failed to convert playlist');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Convert Spotify to YouTube</h2>
      
      {!isSignedIn ? (
        <p className="text-center py-5">Please login to convert playlists</p>
      ) : (
        <>
          {playlists.length === 0 && !isLoading && (
            <button
              onClick={fetchPlaylists}
              className="w-full py-3 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              Load My Playlists
            </button>
          )}

          {isLoading && (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-500"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {playlists.length > 0 && !isLoading && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Select a playlist:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    className={`bg-gray-50 dark:bg-gray-700 rounded-lg p-4 cursor-pointer ${
                      selectedPlaylist?.id === playlist.id ? 'ring-2 ring-green-500' : ''
                    }`}
                    onClick={() => setSelectedPlaylist(playlist)}
                  >
                    <div className="flex items-center">
                      <div className="w-12 h-12 relative mr-3">
                        {(playlist.imageUrl || (playlist.images && playlist.images[0])) ? (
                          <Image
                            src={playlist.imageUrl || playlist.images[0].url}
                            alt={playlist.name}
                            fill
                            className="object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                            <svg className="h-6 w-6 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium truncate">{playlist.name}</h4>
                        <p className="text-sm text-gray-500">{playlist.tracks.total} tracks</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {selectedPlaylist && !conversionResult && (
                <button
                  onClick={convertPlaylist}
                  className="w-full mt-4 py-3 bg-green-500 text-white rounded-md hover:bg-green-600"
                  disabled={isLoading}
                >
                  Convert to YouTube
                </button>
              )}
            </div>
          )}

          {conversionResult && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-green-800">Success!</h3>
              <p className="mb-2">
                Converted {conversionResult.trackCount} tracks to YouTube format.
              </p>
              <a
                href={conversionResult.youtubeImportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center py-2 bg-red-600 text-white rounded-md hover:bg-red-700 mt-3"
              >
                Open YouTube Import Link
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
} 