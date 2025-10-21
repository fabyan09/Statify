"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchArtists,
  fetchAlbums,
  fetchTracks,
  fetchDashboardStats,
  fetchTopArtists,
  PaginationParams,
  playlistApi,
  userApi,
} from "./api";

export function useArtists() {
  return useQuery({
    queryKey: ["artists"],
    queryFn: fetchArtists,
  });
}

export function useArtist(artistId: string) {
  return useQuery({
    queryKey: ["artist", artistId],
    queryFn: async () => {
      const artists = await fetchArtists();
      return artists.find((a) => a._id === artistId);
    },
    enabled: !!artistId,
  });
}

export function useAlbums() {
  return useQuery({
    queryKey: ["albums"],
    queryFn: fetchAlbums,
  });
}

export function useAlbum(albumId: string) {
  return useQuery({
    queryKey: ["album", albumId],
    queryFn: async () => {
      const albums = await fetchAlbums();
      return albums.find((a) => a._id === albumId);
    },
    enabled: !!albumId,
  });
}

export function useTracks(params?: PaginationParams) {
  return useQuery({
    queryKey: ["tracks", params?.page, params?.limit],
    queryFn: () => fetchTracks(params),
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
  });
}

export function useTopArtists(limit = 10) {
  return useQuery({
    queryKey: ["top-artists", limit],
    queryFn: () => fetchTopArtists(limit),
  });
}

export function usePlaylists(params?: PaginationParams) {
  return useQuery({
    queryKey: ["playlists", params?.page, params?.limit],
    queryFn: () => playlistApi.getAll(params),
  });
}

export function useUser(userId: string) {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: () => userApi.getById(userId),
    enabled: !!userId,
  });
}

export function useAddToLibrary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: { track_id?: string; album_id?: string; artist_id?: string } }) =>
      userApi.addToLibrary(userId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user", variables.userId] });
    },
  });
}

export function useRemoveFromLibrary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: { track_id?: string; album_id?: string; artist_id?: string } }) =>
      userApi.removeFromLibrary(userId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user", variables.userId] });
    },
  });
}

export function useAddTracksToPlaylist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ playlistId, trackIds }: { playlistId: string; trackIds: string[] }) =>
      playlistApi.addTracks(playlistId, trackIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
    },
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: userApi.getAll,
  });
}

export function usePublicPlaylists(params?: PaginationParams) {
  return useQuery({
    queryKey: ["public-playlists", params?.page, params?.limit],
    queryFn: () => playlistApi.getPublic(params),
  });
}

export function useAddCollaborator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ playlistId, userId }: { playlistId: string; userId: string }) =>
      playlistApi.addCollaborator(playlistId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
      queryClient.invalidateQueries({ queryKey: ["public-playlists"] });
    },
  });
}

export function useUserLibrary(userId: string) {
  return useQuery({
    queryKey: ["user-library", userId],
    queryFn: () => userApi.getLibrary(userId),
    enabled: !!userId,
  });
}

export function useUserPlaylists(userId: string) {
  return useQuery({
    queryKey: ["user-playlists", userId],
    queryFn: () => playlistApi.getByUser(userId),
    enabled: !!userId,
  });
}
