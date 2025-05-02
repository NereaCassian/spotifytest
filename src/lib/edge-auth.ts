// This file provides utilities to make NextAuth work better in Cloudflare edge environments

// Define interface for token response
export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

/**
 * Replaces Node.js-specific functionality with edge-compatible alternatives
 */
export const edgeCompatibleFetch = async (url: string, options: RequestInit) => {
  // Use native fetch API which is available in edge environments
  return fetch(url, {
    ...options,
    cache: 'no-store',
  });
};

/**
 * Helper function to encode credentials for Basic Auth
 * Works without Node.js Buffer in edge environments
 */
export const encodeBasicAuth = (clientId: string, clientSecret: string) => {
  // Use TextEncoder which is available in edge environments
  const encoder = new TextEncoder();
  const data = encoder.encode(`${clientId}:${clientSecret}`);
  
  // Base64 encode the binary data
  return btoa(String.fromCharCode(...new Uint8Array(data.buffer)));
};

/**
 * Edge-compatible token exchange function
 */
export const exchangeCodeForToken = async (
  code: string,
  redirectUri: string,
  clientId: string,
  clientSecret: string
): Promise<TokenResponse> => {
  const basicAuth = encodeBasicAuth(clientId, clientSecret);
  
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }).toString(),
  });
  
  if (!response.ok) {
    throw new Error(`Error exchanging code for token: ${response.status}`);
  }
  
  return response.json();
};

/**
 * Edge-compatible token refresh function
 */
export const refreshAccessToken = async (
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<TokenResponse> => {
  const basicAuth = encodeBasicAuth(clientId, clientSecret);
  
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }).toString(),
  });
  
  if (!response.ok) {
    throw new Error(`Error refreshing token: ${response.status}`);
  }
  
  return response.json();
}; 