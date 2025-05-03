'use server';

import { signIn, signOut } from "@/auth"


export async function signInToSpotify() {
  await signIn("spotify", { redirectTo: "/profile" })
}

export async function signOutToSpotify() {
  await signOut()
}
