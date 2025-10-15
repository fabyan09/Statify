import { Artist, Album, Track } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Cache for 5 minutes (300 seconds)
const CACHE_REVALIDATE = 300;

export async function fetchArtists(): Promise<Artist[]> {
  const response = await fetch(`${API_BASE_URL}/artists`, {
    next: { revalidate: CACHE_REVALIDATE },
  });
  if (!response.ok) throw new Error("Failed to fetch artists");
  return response.json();
}

export async function fetchAlbums(): Promise<Album[]> {
  const response = await fetch(`${API_BASE_URL}/albums`, {
    next: { revalidate: CACHE_REVALIDATE },
  });
  if (!response.ok) throw new Error("Failed to fetch albums");
  return response.json();
}

export async function fetchTracks(): Promise<Track[]> {
  const response = await fetch(`${API_BASE_URL}/tracks`, {
    next: { revalidate: CACHE_REVALIDATE },
  });
  if (!response.ok) throw new Error("Failed to fetch tracks");
  return response.json();
}

// Stats endpoints (aggregated data)
export interface DashboardStats {
  totalArtists: number;
  totalAlbums: number;
  totalTracks: number;
  avgPopularity: number;
  uniqueLabels: number;
  totalFollowers: number;
  avgTracksPerAlbum: string;
  albumTypes: Record<string, number>;
}

export interface TopArtist {
  _id: string;
  name: string;
  popularity: number;
  followers: number;
  images: Array<{ url: string; height: number; width: number }>;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await fetch(`${API_BASE_URL}/stats/dashboard`, {
    next: { revalidate: CACHE_REVALIDATE },
  });
  if (!response.ok) throw new Error("Failed to fetch dashboard stats");
  return response.json();
}

export async function fetchTopArtists(limit = 10): Promise<TopArtist[]> {
  const response = await fetch(
    `${API_BASE_URL}/stats/artists/top?limit=${limit}`,
    {
      next: { revalidate: CACHE_REVALIDATE },
    }
  );
  if (!response.ok) throw new Error("Failed to fetch top artists");
  return response.json();
}
