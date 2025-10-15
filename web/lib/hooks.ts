"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchArtists,
  fetchAlbums,
  fetchTracks,
  fetchDashboardStats,
  fetchTopArtists,
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
