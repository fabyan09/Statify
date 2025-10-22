import { Artist, Album, Track, SearchTrack, SearchAlbum, SearchArtist, SearchPlaylist, SearchUser } from "./types";

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
    cache: 'no-store', // Pas de cache Next.js, React Query gère le cache
  });
  if (!response.ok) throw new Error("Failed to fetch albums");
  return response.json();
}

export async function fetchAlbum(id: string): Promise<Album> {
  const response = await fetch(`${API_BASE_URL}/albums/${id}`, {
    cache: 'no-store',
  });
  if (!response.ok) throw new Error("Failed to fetch album");
  return response.json();
}

export async function syncAlbumTracks(albumId: string): Promise<{ message: string; album: Album; syncedTracks: number }> {
  const response = await fetch(`${API_BASE_URL}/albums/${albumId}/sync-tracks`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error("Failed to sync album tracks");
  return response.json();
}

export async function syncArtistAlbums(artistId: string): Promise<{ message: string; artist: Artist; syncedAlbums: number; syncedTracks: number }> {
  const response = await fetch(`${API_BASE_URL}/artists/${artistId}/sync-albums`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error("Failed to sync artist albums");
  return response.json();
}

export async function fetchAlbumTracks(albumId: string): Promise<Track[]> {
  const response = await fetch(`${API_BASE_URL}/albums/${albumId}/tracks`, {
    cache: 'no-store',
  });
  if (!response.ok) throw new Error("Failed to fetch album tracks");
  return response.json();
}

export async function fetchArtistTracks(artistId: string): Promise<Track[]> {
  const response = await fetch(`${API_BASE_URL}/artists/${artistId}/tracks`, {
    cache: 'no-store',
  });
  if (!response.ok) throw new Error("Failed to fetch artist tracks");
  return response.json();
}

export async function fetchTracks(params?: PaginationParams): Promise<PaginatedResult<Track>> {
  const query = buildPaginationQuery(params);
  const response = await fetch(`${API_BASE_URL}/tracks${query}`, {
    cache: 'no-store', // Pas de cache Next.js, React Query gère le cache
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

// Search API
type SearchResultType = SearchTrack | SearchAlbum | SearchArtist | SearchPlaylist | SearchUser;

// Function overloads for type-safe search
export async function search(
  query: string,
  type: 'tracks',
  params?: PaginationParams
): Promise<PaginatedResult<SearchTrack>>;
export async function search(
  query: string,
  type: 'albums',
  params?: PaginationParams
): Promise<PaginatedResult<SearchAlbum>>;
export async function search(
  query: string,
  type: 'artists',
  params?: PaginationParams
): Promise<PaginatedResult<SearchArtist>>;
export async function search(
  query: string,
  type: 'playlists',
  params?: PaginationParams
): Promise<PaginatedResult<SearchPlaylist>>;
export async function search(
  query: string,
  type: 'users',
  params?: PaginationParams
): Promise<PaginatedResult<SearchUser>>;
export async function search(
  query: string,
  type: 'tracks' | 'albums' | 'artists' | 'playlists' | 'users',
  params?: PaginationParams
): Promise<PaginatedResult<SearchResultType>> {
  const searchParams = new URLSearchParams();
  searchParams.set('q', query);
  searchParams.set('type', type);
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());

  const response = await fetch(`${API_BASE_URL}/search?${searchParams.toString()}`, {
    cache: 'no-store',
  });
  if (!response.ok) throw new Error("Failed to search");
  return response.json();
}

// Artist API
export async function fetchArtistAlbums(artistId: string): Promise<Album[]> {
  const response = await fetch(`${API_BASE_URL}/artists/${artistId}/albums`, {
    cache: 'no-store',
  });
  if (!response.ok) throw new Error("Failed to fetch artist albums");
  return response.json();
}

// Playlist API
export async function fetchPlaylistTracks(playlistId: string): Promise<Track[]> {
  const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}/tracks`, {
    cache: 'no-store',
  });
  if (!response.ok) throw new Error("Failed to fetch playlist tracks");
  return response.json();
}

// Stats API
export interface CohortData {
  period: string;
  releases: number;
  avgPopularity: number;
  singles: number;
  albums: number;
  compilations: number;
}

export async function fetchReleaseCohorts(granularity: 'year' | 'month' = 'year'): Promise<CohortData[]> {
  const response = await fetch(`${API_BASE_URL}/stats/release-cohorts?granularity=${granularity}`, {
    cache: 'no-store',
  });
  if (!response.ok) throw new Error("Failed to fetch release cohorts");
  return response.json();
}

export interface LabelStats {
  label: string;
  albumCount: number;
  trackCount: number;
  avgPopularity: number;
  singles: number;
  albums: number;
  compilations: number;
}

export async function fetchLabelStats(): Promise<LabelStats[]> {
  const response = await fetch(`${API_BASE_URL}/stats/labels`, {
    cache: 'no-store',
  });
  if (!response.ok) throw new Error("Failed to fetch label stats");
  return response.json();
}

export interface Collaboration {
  artist1: string;
  artist2: string;
  count: number;
}

export async function fetchCollaborations(): Promise<Collaboration[]> {
  const response = await fetch(`${API_BASE_URL}/stats/collaborations`, {
    cache: 'no-store',
  });
  if (!response.ok) throw new Error("Failed to fetch collaborations");
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
  getAll: async (params?: PaginationParams): Promise<PaginatedResult<User>> => {
    const query = buildPaginationQuery(params);
    const res = await fetch(`${API_BASE_URL}/users${query}`);
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

  getLikedTracks: async (id: string): Promise<Track[]> => {
    const res = await fetch(`${API_BASE_URL}/users/${id}/library/tracks`);
    if (!res.ok) throw new Error('Failed to fetch liked tracks');
    return res.json();
  },

  getLikedAlbums: async (id: string): Promise<Album[]> => {
    const res = await fetch(`${API_BASE_URL}/users/${id}/library/albums`);
    if (!res.ok) throw new Error('Failed to fetch liked albums');
    return res.json();
  },

  getFavoriteArtists: async (id: string): Promise<Artist[]> => {
    const res = await fetch(`${API_BASE_URL}/users/${id}/library/artists`);
    if (!res.ok) throw new Error('Failed to fetch favorite artists');
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

  login: async (data: { username: string; password: string }): Promise<User> => {
    const res = await fetch(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.text();
      throw new Error(error || 'Invalid username or password');
    }
    return res.json();
  },
};

// Recommendations API
export interface RecommendationSection {
  title: string;
  description: string;
  icon: string;
  type: 'artist' | 'album' | 'track';
  items: (Artist | Album | Track)[];
}

export interface RecommendationsResponse {
  sections: RecommendationSection[];
}

export async function fetchRecommendations(userId: string): Promise<RecommendationsResponse> {
  const response = await fetch(`${API_BASE_URL}/recommendations/${userId}`, {
    cache: 'no-store',
  });
  if (!response.ok) throw new Error("Failed to fetch recommendations");
  return response.json();
}

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
