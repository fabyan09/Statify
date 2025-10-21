"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchArtists,
  fetchAlbums,
  fetchTracks,
  fetchDashboardStats,
  fetchTopArtists,
  PaginationParams,
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
