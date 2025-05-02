import NextAuth from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";
import { LOGIN_URL } from "@/lib/spotify";
import { CloudflareKV, saveUserData } from "@/lib/cloudflare";
import { refreshAccessToken } from "@/lib/edge-auth";

export const { 
  handlers, 
  auth, 
  signIn, 
  signOut 
} = NextAuth({
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      authorization: LOGIN_URL,
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, account, user }) {
      // Initial sign in
      if (account && user) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = account.expires_at ? account.expires_at * 1000 : 0;
        token.user = user;
        
        // Save user data to Cloudflare KV if available
        if (process.env.CF_PAGES) {
          const env = (process.env as any).CF as CloudflareKV;
          if (env?.SPOTIFY_USERS) {
            await saveUserData(env, {
              userId: user.id || '',
              refreshToken: account.refresh_token as string,
              name: user.name as string,
              email: user.email as string,
              imageUrl: user.image as string,
              lastLogin: Date.now(),
            });
          }
        }
        
        return token;
      }

      // Return previous token if the access token has not expired yet
      if (token.accessTokenExpires && Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Access token has expired, try to update it
      if (token.refreshToken) {
        try {
          const refreshedToken = await refreshAccessToken(
            token.refreshToken as string,
            process.env.SPOTIFY_CLIENT_ID as string,
            process.env.SPOTIFY_CLIENT_SECRET as string
          );
          
          token.accessToken = refreshedToken.access_token;
          token.accessTokenExpires = Date.now() + refreshedToken.expires_in * 1000;
          
          // Update the refresh token if a new one is returned
          if (refreshedToken.refresh_token) {
            token.refreshToken = refreshedToken.refresh_token;
          }
        } catch (error) {
          console.error("Error refreshing access token", error);
          token.error = "RefreshAccessTokenError";
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = token.user as any;
        session.accessToken = token.accessToken as string;
        session.error = token.error as string;
      }
      
      return session;
    },
  },
}); 