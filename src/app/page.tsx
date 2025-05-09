import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center space-y-10 py-10">
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-gray-900 dark:text-white">
          Your Spotify, <span className="text-green-500">Reimagined</span>
        </h1>
        
        <p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-300">
          Discover your listening habits, and get AI-powered music recommendations based on your taste.
        </p>
        
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/profile" 
            className="px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
          >
            View Your Profile
          </Link>
          <Link 
            href="/playlists" 
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Convert Playlists
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
            <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">View Your Stats</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Discover your top artists, tracks, and listening habits with beautiful visualizations.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
            <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Convert Playlists</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Easily convert your Spotify playlists to YouTube format and share with friends.
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
            <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zm1-11h-2v3H8v2h3v3h2v-3h3v-2h-3V8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">AI Recommendations</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Get personalized music recommendations based on your listening history.
          </p>
        </div>
      </div>
      
      <div className="relative w-full max-w-4xl h-64 sm:h-80 mt-10 rounded-lg overflow-hidden shadow-xl">
        <Image
          src="https://i.scdn.co/image/ab67706f00000003e8e28219724c2423afa4d320"
          alt="Music visualization"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
          <div className="text-white">
            <h3 className="text-2xl font-bold">Ready to discover more?</h3>
            <p className="mt-2">Login with your Spotify account to get started</p>
          </div>
        </div>
      </div>
    </div>
  );
}
