"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchArtists,
  fetchAlbums,
  fetchTracks,
  fetchDashboardStats,
  fetchTopArtists,
  playlistApi,
  userApi,
} from "./api";

export function useArtists() {
  return useQuery({
    queryKey: ["artists"],
    queryFn: fetchArtists,
  });
}

export function useAlbums() {
  return useQuery({
    queryKey: ["albums"],
    queryFn: fetchAlbums,
  });
}

export function useTracks() {
  return useQuery({
    queryKey: ["tracks"],
    queryFn: fetchTracks,
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

export function usePlaylists() {
  return useQuery({
    queryKey: ["playlists"],
    queryFn: playlistApi.getAll,
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
