import { Artist, Album, Track } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export async function fetchArtists(): Promise<Artist[]> {
  const response = await fetch(`${API_BASE_URL}/artists`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to fetch artists");
  return response.json();
}

export async function fetchAlbums(): Promise<Album[]> {
  const response = await fetch(`${API_BASE_URL}/albums`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to fetch albums");
  return response.json();
}

export async function fetchTracks(): Promise<Track[]> {
  const response = await fetch(`${API_BASE_URL}/tracks`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Failed to fetch tracks");
  return response.json();
}
