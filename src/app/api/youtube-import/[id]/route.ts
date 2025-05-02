import { NextRequest, NextResponse } from "next/server";
import { CloudflareKV, getPlaylistConversion } from "@/lib/cloudflare";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: "Playlist ID is required" },
        { status: 400 }
      );
    }
    
    // In a real app, you'd look up the playlist in your database or KV store
    // For now, we're using a simple implementation
    // Try to get the playlist from Cloudflare KV if available
    let playlist = null;
    
    if (process.env.CF_PAGES) {
      const env = (process.env as any).CF as CloudflareKV;
      if (env?.SPOTIFY_PLAYLISTS) {
        // Here we would ideally query by the conversion ID, but for simplicity
        // we'll scan for the playlist with the matching YouTube URL
        const { keys } = await env.SPOTIFY_PLAYLISTS.list();
        
        for (const key of keys) {
          const data = await env.SPOTIFY_PLAYLISTS.get(key.name);
          if (data) {
            const conversion = JSON.parse(data);
            if (conversion.youtubeUrl?.includes(id)) {
              playlist = {
                name: conversion.name,
                trackCount: conversion.tracks.length,
                tracks: conversion.tracks.map((track: any) => ({
                  artist: track.artist,
                  title: track.title,
                  album: track.album,
                })),
              };
              break;
            }
          }
        }
      }
    }
    
    // If not found in KV, use a fallback demo playlist for development
    if (!playlist) {
      // For demo/development purposes, return a mock playlist
      playlist = {
        name: "Demo Playlist",
        trackCount: 5,
        tracks: [
          { artist: "The Beatles", title: "Hey Jude", album: "The Beatles 1" },
          { artist: "Queen", title: "Bohemian Rhapsody", album: "A Night at the Opera" },
          { artist: "Led Zeppelin", title: "Stairway to Heaven", album: "Led Zeppelin IV" },
          { artist: "Pink Floyd", title: "Wish You Were Here", album: "Wish You Were Here" },
          { artist: "The Rolling Stones", title: "Paint It Black", album: "Aftermath" },
        ],
      };
    }
    
    return NextResponse.json({ playlist });
  } catch (error) {
    console.error("Error fetching YouTube import data:", error);
    return NextResponse.json(
      { error: "Failed to retrieve playlist data" },
      { status: 500 }
    );
  }
} 