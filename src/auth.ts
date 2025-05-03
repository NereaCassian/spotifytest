import NextAuth from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";

export const { 
  handlers, 
  auth, 
  signIn, 
  signOut 
} = NextAuth({
  providers: [SpotifyProvider({}),],
  
}); 