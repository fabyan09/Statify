"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTracks, useAlbums, useArtists } from "@/lib/hooks";
import { ExternalLink, Search, ArrowUpDown } from "lucide-react";
import Image from "next/image";

type SortField = "name" | "artist" | "album" | "duration_ms" | "popularity";
type SortDirection = "asc" | "desc";

export default function TrackExplorerPage() {
  const { data: tracks, isLoading: tracksLoading, error: tracksError } = useTracks();
  const { data: albums, isLoading: albumsLoading, error: albumsError } = useAlbums();
  const { data: artists, isLoading: artistsLoading, error: artistsError } = useArtists();

  const isLoading = tracksLoading || albumsLoading || artistsLoading;
  const error = tracksError || albumsError || artistsError;

  const [searchTerm, setSearchTerm] = useState("");
  const [explicitFilter, setExplicitFilter] = useState<string>("all");
  const [durationFilter, setDurationFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("popularity");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Create album and artist lookups
  const albumMap = albums ? new Map(albums.map((album) => [album._id, album])) : new Map();
  const artistMap = artists ? new Map(artists.map((artist) => [artist._id, artist])) : new Map();

  // Filter and sort tracks
  const filteredAndSortedTracks = (tracks || [])
    .filter((track) => {
      const matchesSearch =
        track.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        albumMap.get(track.album_id)?.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesExplicit =
        explicitFilter === "all" ||
        (explicitFilter === "explicit" && track.explicit) ||
        (explicitFilter === "clean" && !track.explicit);

      const matchesDuration =
        durationFilter === "all" ||
        (durationFilter === "short" && track.duration_ms < 180000) ||
        (durationFilter === "medium" && track.duration_ms >= 180000 && track.duration_ms < 300000) ||
        (durationFilter === "long" && track.duration_ms >= 300000);

      return matchesSearch && matchesExplicit && matchesDuration;
    })
    .sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      if (sortField === "artist") {
        // Get the first artist name for sorting
        const aArtistName = a.artist_ids[0] ? artistMap.get(a.artist_ids[0])?.name || "" : "";
        const bArtistName = b.artist_ids[0] ? artistMap.get(b.artist_ids[0])?.name || "" : "";
        aValue = aArtistName;
        bValue = bArtistName;
      } else if (sortField === "album") {
        aValue = albumMap.get(a.album_id)?.name || "";
        bValue = albumMap.get(b.album_id)?.name || "";
      } else {
        aValue = a[sortField];
        bValue = b[sortField];
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  }

  function formatDuration(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error Loading Data</CardTitle>
            <CardDescription>
              Failed to fetch data from the API. Make sure the API server is running.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !tracks || !albums || !artists) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading tracks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Track Explorer</h1>
        <p className="text-muted-foreground">
          Browse and filter through {tracks.length} tracks
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Refine your track search</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by track or album name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={explicitFilter} onValueChange={setExplicitFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Explicit filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tracks</SelectItem>
              <SelectItem value="explicit">Explicit only</SelectItem>
              <SelectItem value="clean">Clean only</SelectItem>
            </SelectContent>
          </Select>

          <Select value={durationFilter} onValueChange={setDurationFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Duration" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All durations</SelectItem>
              <SelectItem value="short">&lt; 3 minutes</SelectItem>
              <SelectItem value="medium">3-5 minutes</SelectItem>
              <SelectItem value="long">&gt; 5 minutes</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>
            Tracks ({filteredAndSortedTracks.length.toLocaleString()})
          </CardTitle>
          <CardDescription>
            {filteredAndSortedTracks.length === tracks.length
              ? "Showing all tracks"
              : `Showing ${filteredAndSortedTracks.length} of ${tracks.length} tracks`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]"></TableHead>
                <TableHead className="w-[250px]">
                  <button
                    className="flex items-center gap-1 hover:text-primary"
                    onClick={() => handleSort("name")}
                  >
                    Track
                    {sortField === "name" && <ArrowUpDown className="h-4 w-4" />}
                  </button>
                </TableHead>
                <TableHead className="w-[200px]">
                  <button
                    className="flex items-center gap-1 hover:text-primary"
                    onClick={() => handleSort("artist")}
                  >
                    Artist
                    {sortField === "artist" && <ArrowUpDown className="h-4 w-4" />}
                  </button>
                </TableHead>
                <TableHead className="w-[200px]">
                  <button
                    className="flex items-center gap-1 hover:text-primary"
                    onClick={() => handleSort("album")}
                  >
                    Album
                    {sortField === "album" && <ArrowUpDown className="h-4 w-4" />}
                  </button>
                </TableHead>
                <TableHead className="w-[100px]">
                  <button
                    className="flex items-center gap-1 hover:text-primary"
                    onClick={() => handleSort("duration_ms")}
                  >
                    Duration
                    {sortField === "duration_ms" && <ArrowUpDown className="h-4 w-4" />}
                  </button>
                </TableHead>
                <TableHead className="w-[120px]">
                  <button
                    className="flex items-center gap-1 hover:text-primary"
                    onClick={() => handleSort("popularity")}
                  >
                    Popularity
                    {sortField === "popularity" && <ArrowUpDown className="h-4 w-4" />}
                  </button>
                </TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedTracks.slice(0, 100).map((track) => {
                const album = albumMap.get(track.album_id);
                const trackArtists = track.artist_ids.map((id) => artistMap.get(id)).filter(Boolean);
                const artistNames = trackArtists.map((artist) => artist?.name).join(", ") || "Unknown Artist";
                const albumName = album?.name || "Unknown Album";
                return (
                  <TableRow key={track._id}>
                    <TableCell className="w-[60px]">
                      <div className="relative h-10 w-10 rounded overflow-hidden bg-muted">
                        {album?.images[0]?.url ? (
                          <Image
                            src={album.images[0].url}
                            alt={album.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-muted" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="w-[250px]">
                      <div className="flex flex-col">
                        <span
                          className="font-medium truncate block"
                          title={track.name}
                        >
                          {track.name}
                        </span>
                        <div className="flex gap-1 mt-1">
                          {track.explicit && (
                            <Badge variant="secondary" className="text-xs">
                              Explicit
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="w-[200px]">
                      <span
                        className="text-sm block truncate"
                        title={artistNames}
                      >
                        {artistNames}
                      </span>
                    </TableCell>
                    <TableCell className="w-[200px]">
                      <span
                        className="text-sm text-muted-foreground block truncate"
                        title={albumName}
                      >
                        {albumName}
                      </span>
                    </TableCell>
                    <TableCell className="w-[100px]">{formatDuration(track.duration_ms)}</TableCell>
                    <TableCell className="w-[120px]">
                      <Badge variant="outline">{track.popularity}/100</Badge>
                    </TableCell>
                    <TableCell className="w-[100px]">
                      <a
                        href={track.external_urls.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
                      >
                        Spotify
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {filteredAndSortedTracks.length > 100 && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              Showing first 100 results. Use filters to narrow down your search.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
