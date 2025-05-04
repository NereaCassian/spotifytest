'use client';

import PlaylistConverter from '@/components/PlaylistConverter';
import { useAuth, useUser} from '@clerk/nextjs';

export default function PlaylistsPage() {
  const { isSignedIn, isLoaded } = useAuth()
  const { user } = useUser()

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold mb-4">Spotify to YouTube Converter</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Convert your Spotify playlists to YouTube format and share them with friends. 
          This tool lets you create shareable links that anyone can use to import your playlists into YouTube Music.
        </p>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900 rounded-lg p-4 text-yellow-800 dark:text-yellow-300">
          <h3 className="font-medium flex items-center">
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            How it works
          </h3>
          <ol className="ml-6 mt-2 list-decimal text-sm">
            <li className="mb-1">Select a playlist from your Spotify library</li>
            <li className="mb-1">We'll convert the tracks and generate a special link</li>
            <li className="mb-1">Share this link with anyone who wants to import your playlist to YouTube</li>
            <li>When they open the link, they'll see instructions for importing to YouTube</li>
          </ol>
        </div>
      </div>
      
      <PlaylistConverter />
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Frequently Asked Questions</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg">Do I need a YouTube Music subscription?</h3>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              No, anyone can import playlists to YouTube. However, some features like background playback may require a premium subscription.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg">Will all my songs be found on YouTube?</h3>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Most popular songs will be matched correctly, but some obscure tracks or remixes might not have exact matches on YouTube.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg">How long do the conversion links last?</h3>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              The links are permanent unless you delete them from your account. You can share them as many times as you want.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 