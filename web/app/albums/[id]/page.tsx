"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useAlbum,
  usePlaylists,
  useUser,
  useAddToLibrary,
  useRemoveFromLibrary,
  useAddTracksToPlaylist,
  useSyncAlbumTracks,
} from "@/lib/hooks";
import { useQuery } from "@tanstack/react-query";
import { fetchAlbumTracks, fetchArtistsByIds } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { ExternalLink, Heart, Plus, ArrowLeft, Calendar, Music, RefreshCw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { StatifyLoader } from "@/components/StatifyLoader";

export default function AlbumDetailPage() {
  const params = useParams();
  const albumId = params.id as string;

  const { data: album, isLoading: albumLoading } = useAlbum(albumId);
  const { data: tracks, isLoading: tracksLoading } = useQuery({
    queryKey: ["album-tracks", albumId],
    queryFn: () => fetchAlbumTracks(albumId),
    enabled: !!albumId,
  });

  // Charger uniquement les artistes nécessaires (album + tracks)
  const artistIds = album && tracks
    ? [...new Set([...album.artist_ids, ...tracks.flatMap(t => t.artist_ids)])]
    : [];

  const { data: artists, isLoading: artistsLoading } = useQuery({
    queryKey: ["artists-by-ids", artistIds],
    queryFn: () => fetchArtistsByIds(artistIds),
    enabled: !!album && !!tracks && artistIds.length > 0,
  });

  // Charger toutes les playlists (pour le dropdown d'ajout de tracks)
  // Acceptable pour la plupart des utilisateurs (<100 playlists)
  const { data: playlistsResult } = usePlaylists({ limit: 1000 });

  const playlists = playlistsResult?.data || [];

  // Get authenticated user
  const { user: currentUser } = useAuth();
  const { data: user } = useUser(currentUser?._id || "");

  const addToLibrary = useAddToLibrary();
  const removeFromLibrary = useRemoveFromLibrary();
  const addTracksToPlaylist = useAddTracksToPlaylist();
  const syncAlbumTracks = useSyncAlbumTracks();

  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>("");
  const [selectedTrackId, setSelectedTrackId] = useState<string>("");
  const [hasTriggeredSync, setHasTriggeredSync] = useState(false);

  const artistMap = artists ? new Map(artists.map((artist) => [artist._id, artist])) : new Map();

  // Auto-sync tracks from Spotify if not already synced
  useEffect(() => {
    if (album && !album.spotify_synced && !hasTriggeredSync && !syncAlbumTracks.isPending) {
      console.log('Triggering sync for album:', albumId, 'spotify_synced:', album.spotify_synced);
      syncAlbumTracks.mutate(albumId);
      setHasTriggeredSync(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [album?.spotify_synced, albumId, hasTriggeredSync]);

  // Tracks are already fetched and sorted for this album
  const albumTracks = tracks || [];

  console.log(`[AlbumPage] Album tracks fetched: ${albumTracks.length}`);

  const isLoading = albumLoading || artistsLoading || tracksLoading;

  function formatDuration(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  function getTotalDuration(): string {
    const totalMs = albumTracks.reduce((sum, track) => sum + track.duration_ms, 0);
    const totalMinutes = Math.floor(totalMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `${hours} hr ${minutes} min`;
    }
    return `${minutes} min`;
  }

  function isTrackLiked(trackId: string): boolean {
    return user?.liked_tracks?.includes(trackId) || false;
  }

  function isAlbumLiked(): boolean {
    return user?.liked_albums?.includes(albumId) || false;
  }

  function handleLikeToggle(trackId: string) {
    if (!currentUser) return;
    if (isTrackLiked(trackId)) {
      removeFromLibrary.mutate({ userId: currentUser._id, data: { track_id: trackId } });
    } else {
      addToLibrary.mutate({ userId: currentUser._id, data: { track_id: trackId } });
    }
  }

  function handleAlbumLikeToggle() {
    if (!currentUser) return;
    if (isAlbumLiked()) {
      removeFromLibrary.mutate({ userId: currentUser._id, data: { album_id: albumId } });
    } else {
      addToLibrary.mutate({ userId: currentUser._id, data: { album_id: albumId } });
    }
  }

  function handleOpenPlaylistDialog(trackId: string) {
    setSelectedTrackId(trackId);
    setPlaylistDialogOpen(true);
  }

  function handleAddToPlaylist() {
    if (selectedPlaylistId && selectedTrackId) {
      addTracksToPlaylist.mutate(
        { playlistId: selectedPlaylistId, trackIds: [selectedTrackId] },
        {
          onSuccess: () => {
            setPlaylistDialogOpen(false);
            setSelectedPlaylistId("");
            setSelectedTrackId("");
          },
        }
      );
    }
  }

  function handleAddAllToPlaylist() {
    if (selectedPlaylistId && albumTracks.length > 0) {
      const trackIds = albumTracks.map((track) => track._id);
      addTracksToPlaylist.mutate(
        { playlistId: selectedPlaylistId, trackIds },
        {
          onSuccess: () => {
            setPlaylistDialogOpen(false);
            setSelectedPlaylistId("");
          },
        }
      );
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center space-y-4">
          <StatifyLoader size="xl" className="mx-auto" />
          <p className="text-muted-foreground">Loading album...</p>
        </div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Card className="w-full max-w-md !bg-background/10">
          <CardHeader>
            <CardTitle>Album Not Found</CardTitle>
            <CardDescription>
              The album you&apos;re looking for doesn&apos;t exist.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/search">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Search
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const albumArtists = album.artist_ids.map((id) => artistMap.get(id)).filter(Boolean);
  const artistNames = albumArtists.map((artist) => artist?.name).join(", ") || "Unknown Artist";

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/search">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Search
        </Button>
      </Link>

      {/* Album Header */}
      <Card className="!bg-background/10">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Album Cover */}
            <div className="relative w-full md:w-64 aspect-square rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {album.images[0]?.url ? (
                <Image
                  src={album.images[0].url}
                  alt={album.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="h-full w-full bg-muted flex items-center justify-center">
                  <Music className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Album Info */}
            <div className="flex-1">
              <div className="mb-2">
                <Badge variant="secondary">{album.album_type}</Badge>
              </div>
              <h1 className="text-4xl font-bold mb-2">{album.name}</h1>
              <p className="text-xl text-muted-foreground mb-4">{artistNames}</p>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(album.release_date).getFullYear()}
                </div>
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4" />
                  {albumTracks.length} tracks
                </div>
                <div>{getTotalDuration()}</div>
                {album.label && <div>Label: {album.label}</div>}
              </div>

              {/* Genres */}
              {album.genres && album.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {album.genres.map((genre) => (
                    <Badge key={genre} variant="outline">
                      {genre}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 flex-wrap">
                <Button
                  variant={isAlbumLiked() ? "default" : "outline"}
                  onClick={handleAlbumLikeToggle}
                  className="gap-2"
                >
                  <Heart className={isAlbumLiked() ? "h-5 w-5 fill-current" : "h-5 w-5"} />
                  {isAlbumLiked() ? "Liked" : "Like Album"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedTrackId("");
                    setPlaylistDialogOpen(true);
                  }}
                  className="gap-2"
                >
                  <Plus className="h-5 w-5" />
                  Add All to Playlist
                </Button>
                <a
                  href={album.external_urls.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="gap-2">
                    Open in Spotify
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Track List */}
      <Card className="!bg-background/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tracks</CardTitle>
              <CardDescription>
                {albumTracks.length} track{albumTracks.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            {syncAlbumTracks.isPending && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Synchronisation des tracks en cours...
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">#</TableHead>
                <TableHead className="w-[300px]">Title</TableHead>
                <TableHead className="w-[200px]">Artist</TableHead>
                <TableHead className="w-[100px]">Duration</TableHead>
                <TableHead className="w-[120px]">Popularity</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {albumTracks.map((track) => {
                const trackArtists = track.artist_ids.map((id) => artistMap.get(id)).filter(Boolean);
                const trackArtistNames = trackArtists.map((artist) => artist?.name).join(", ") || "Unknown Artist";

                return (
                  <TableRow key={track._id}>
                    <TableCell className="text-muted-foreground">
                      {track.track_number}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium truncate" title={track.name}>
                          {track.name}
                        </span>
                        {track.explicit && (
                          <Badge variant="secondary" className="text-xs w-fit mt-1">
                            Explicit
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm block truncate" title={trackArtistNames}>
                        {trackArtistNames}
                      </span>
                    </TableCell>
                    <TableCell>{formatDuration(track.duration_ms)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{track.popularity}/100</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleLikeToggle(track._id)}
                          className={isTrackLiked(track._id) ? "text-red-500 hover:text-red-600" : ""}
                        >
                          <Heart className={isTrackLiked(track._id) ? "h-4 w-4 fill-current" : "h-4 w-4"} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleOpenPlaylistDialog(track._id)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
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
        </CardContent>
      </Card>

      {/* Add to Playlist Dialog */}
      <Dialog open={playlistDialogOpen} onOpenChange={setPlaylistDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Playlist</DialogTitle>
            <DialogDescription>
              {selectedTrackId
                ? "Select a playlist to add this track to."
                : "Select a playlist to add all album tracks to."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedPlaylistId} onValueChange={setSelectedPlaylistId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a playlist" />
              </SelectTrigger>
              <SelectContent>
                {playlists && playlists.length > 0 ? (
                  playlists.map((playlist) => (
                    <SelectItem key={playlist._id} value={playlist._id}>
                      {playlist.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-playlists" disabled>
                    No playlists available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlaylistDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={selectedTrackId ? handleAddToPlaylist : handleAddAllToPlaylist}
              disabled={!selectedPlaylistId || addTracksToPlaylist.isPending}
            >
              {addTracksToPlaylist.isPending
                ? "Adding..."
                : selectedTrackId
                ? "Add Track"
                : "Add All Tracks"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
