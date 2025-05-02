import { NextAuthOptions } from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";
import { LOGIN_URL } from "@/lib/spotify";
import { CloudflareKV, saveUserData } from "@/lib/cloudflare";

export const authOptions: NextAuthOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID as string,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET as string,
      authorization: LOGIN_URL,
    }),
  ],
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
              userId: user.id,
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
      // For this API route, we'll need to implement token refresh in the client
      // since we're using the Edge runtime
      return token;
    },
    async session({ session, token }) {
      session.user = token.user as any;
      session.accessToken = token.accessToken as string;
      session.error = token.error as string;
      
      return session;
    },
  },
}; 