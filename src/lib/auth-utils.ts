// Helper functions for working with custom Spotify authentication

/**
 * Check if the user is authenticated by checking for Spotify cookies
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/auth/spotify/session', { 
      credentials: 'include',
      cache: 'no-store'
    });
    if (!response.ok) return false;
    const data = await response.json() as { authenticated: boolean };
    return data.authenticated;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

/**
 * Get the current user's profile
 */
export const getCurrentUser = async () => {
  try {
    const response = await fetch('/api/auth/spotify/session', { 
      credentials: 'include',
      cache: 'no-store'
    });
    if (!response.ok) return null;
    const data = await response.json() as { user: any };
    return data.user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Refresh the access token
 */
export const refreshToken = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/auth/spotify/refresh', { credentials: 'include' });
    return response.ok;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
};

/**
 * Logout the user
 */
export const logoutUser = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/auth/spotify/logout', { credentials: 'include' });
    return response.ok;
  } catch (error) {
    console.error('Error logging out:', error);
    return false;
  }
}; 