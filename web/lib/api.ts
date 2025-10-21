import { Artist, Album, Track } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Cache for 5 minutes (300 seconds)
const CACHE_REVALIDATE = 300;

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

function buildPaginationQuery(params?: PaginationParams): string {
  if (!params) return '';
  const query = new URLSearchParams();
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());
  return query.toString() ? `?${query.toString()}` : '';
}

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

export async function fetchTracks(params?: PaginationParams): Promise<PaginatedResult<Track>> {
  const query = buildPaginationQuery(params);
  const response = await fetch(`${API_BASE_URL}/tracks${query}`, {
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
  external_urls: {
    spotify: string;
  };
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

// User API
export interface User {
  _id: string;
  username: string;
  liked_tracks: string[];
  liked_albums: string[];
  favorite_artists: string[];
  createdAt?: string;
  updatedAt?: string;
}

export const userApi = {
  getAll: async (): Promise<User[]> => {
    const res = await fetch(`${API_BASE_URL}/users`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  getById: async (id: string): Promise<User> => {
    const res = await fetch(`${API_BASE_URL}/users/${id}`);
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  },

  getLibrary: async (id: string) => {
    const res = await fetch(`${API_BASE_URL}/users/${id}/library`);
    if (!res.ok) throw new Error('Failed to fetch library');
    return res.json();
  },

  addToLibrary: async (userId: string, data: { track_id?: string; album_id?: string; artist_id?: string }) => {
    const res = await fetch(`${API_BASE_URL}/users/${userId}/library/add`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add to library');
    return res.json();
  },

  removeFromLibrary: async (userId: string, data: { track_id?: string; album_id?: string; artist_id?: string }) => {
    const res = await fetch(`${API_BASE_URL}/users/${userId}/library/remove`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to remove from library');
    return res.json();
  },

  create: async (data: { username: string; password: string }) => {
    const res = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create user');
    return res.json();
  },
};

// Playlist API
export interface Playlist {
  _id: string;
  name: string;
  description: string;
  tracks: string[];
  owner_id: string;
  collaborators: string[];
  isPublic: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const playlistApi = {
  getAll: async (params?: PaginationParams): Promise<PaginatedResult<Playlist>> => {
    const query = buildPaginationQuery(params);
    const res = await fetch(`${API_BASE_URL}/playlists${query}`);
    if (!res.ok) throw new Error('Failed to fetch playlists');
    return res.json();
  },

  getById: async (id: string): Promise<Playlist> => {
    const res = await fetch(`${API_BASE_URL}/playlists/${id}`);
    if (!res.ok) throw new Error('Failed to fetch playlist');
    return res.json();
  },

  getByUser: async (userId: string, params?: PaginationParams): Promise<PaginatedResult<Playlist>> => {
    const query = buildPaginationQuery(params);
    const res = await fetch(`${API_BASE_URL}/playlists/user/${userId}${query}`);
    if (!res.ok) throw new Error('Failed to fetch user playlists');
    return res.json();
  },

  getPublic: async (params?: PaginationParams): Promise<PaginatedResult<Playlist>> => {
    const query = buildPaginationQuery(params);
    const res = await fetch(`${API_BASE_URL}/playlists/public${query}`);
    if (!res.ok) throw new Error('Failed to fetch public playlists');
    return res.json();
  },

  create: async (data: { name: string; description?: string; owner_id: string; isPublic?: boolean }) => {
    const res = await fetch(`${API_BASE_URL}/playlists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create playlist');
    return res.json();
  },

  update: async (id: string, data: Partial<Playlist>) => {
    const res = await fetch(`${API_BASE_URL}/playlists/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update playlist');
    return res.json();
  },

  delete: async (id: string) => {
    const res = await fetch(`${API_BASE_URL}/playlists/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete playlist');
  },

  addTracks: async (id: string, track_ids: string[]) => {
    const res = await fetch(`${API_BASE_URL}/playlists/${id}/tracks/add`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ track_ids }),
    });
    if (!res.ok) throw new Error('Failed to add tracks');
    return res.json();
  },

  removeTracks: async (id: string, track_ids: string[]) => {
    const res = await fetch(`${API_BASE_URL}/playlists/${id}/tracks/remove`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ track_ids }),
    });
    if (!res.ok) throw new Error('Failed to remove tracks');
    return res.json();
  },

  addCollaborator: async (id: string, user_id: string) => {
    const res = await fetch(`${API_BASE_URL}/playlists/${id}/collaborators/add`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id }),
    });
    if (!res.ok) throw new Error('Failed to add collaborator');
    return res.json();
  },

  removeCollaborator: async (id: string, user_id: string) => {
    const res = await fetch(`${API_BASE_URL}/playlists/${id}/collaborators/remove`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id }),
    });
    if (!res.ok) throw new Error('Failed to remove collaborator');
    return res.json();
  },
};
