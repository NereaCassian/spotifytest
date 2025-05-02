'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';

interface TrackData {
  artist: string;
  title: string;
  album?: string;
}

interface PlaylistData {
  name: string;
  trackCount: number;
  tracks: TrackData[];
}

export default function YouTubeImportPage() {
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [playlistData, setPlaylistData] = useState<PlaylistData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    const fetchPlaylistData = async () => {
      try {
        setIsLoading(true);
        
        const response = await fetch(`/api/youtube-import/${id}`);
        const data = await response.json() as { 
          playlist?: PlaylistData; 
          error?: string 
        };
        
        if (data.error) throw new Error(data.error);
        
        setPlaylistData(data.playlist || null);
      } catch (err) {
        console.error('Failed to fetch playlist data:', err);
        setError('Failed to load playlist data. The link may be invalid or expired.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPlaylistData();
  }, [id]);

  const copyToClipboard = () => {
    if (!playlistData) return;
    
    // Format the playlist data for copying
    const formattedText = playlistData.tracks
      .map(track => `${track.artist} - ${track.title}`)
      .join('\n');
    
    navigator.clipboard.writeText(formattedText);
    setCopied(true);
    
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }

  if (error || !playlistData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[70vh]">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md max-w-md mx-auto text-center">
          <svg className="h-24 w-24 text-red-500 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <h2 className="text-2xl font-bold mb-4">Playlist Not Found</h2>
          <p className="mb-6 text-gray-600 dark:text-gray-300">
            {error || 'Unable to load playlist data. The link may be invalid or expired.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-red-600 to-red-800 p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">{playlistData.name}</h1>
          <p className="opacity-90">
            {playlistData.trackCount} tracks from Spotify, ready for YouTube Music
          </p>
        </div>
        
        <div className="p-6">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900 rounded-lg p-4 text-yellow-800 dark:text-yellow-300 mb-6">
            <h3 className="font-medium flex items-center mb-2">
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              How to import to YouTube Music
            </h3>
            <ol className="ml-6 mt-2 list-decimal text-sm">
              <li className="mb-1">Copy the full list of songs below</li>
              <li className="mb-1">Go to YouTube Music and create a new playlist</li>
              <li className="mb-1">Click "Add videos" and paste the tracks</li>
              <li>YouTube Music will automatically find and add matching songs</li>
            </ol>
          </div>

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Tracks</h2>
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center"
            >
              {copied ? (
                <>
                  <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                  </svg>
                  Copy All Tracks
                </>
              )}
            </button>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto">
            <ul className="divide-y divide-gray-200 dark:divide-gray-600">
              {playlistData.tracks.map((track, index) => (
                <li key={index} className="py-3 flex">
                  <span className="w-8 text-gray-500 flex-shrink-0">{index + 1}</span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{track.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{track.artist}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-900 p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="relative w-12 h-12 rounded-full overflow-hidden mr-4">
              <Image
                src="https://i.scdn.co/image/ab67706f00000003e8e28219724c2423afa4d320"
                alt="Spotify"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This playlist was exported from Spotify using Spotify Stats &amp; Converter
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 