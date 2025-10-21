"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useArtist,
  useAlbums,
  useTracks,
  usePlaylists,
  useUser,
  useAddToLibrary,
  useRemoveFromLibrary,
  useAddTracksToPlaylist,
  useSyncArtistAlbums,
} from "@/lib/hooks";
import { useAuth } from "@/contexts/auth-context";
import { ExternalLink, Heart, Plus, ArrowLeft, Users, Music, Disc, RefreshCw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function ArtistDetailPage() {
  const params = useParams();
  const artistId = params.id as string;

  const { data: artist, isLoading: artistLoading } = useArtist(artistId);
  const { data: albums, isLoading: albumsLoading } = useAlbums();
  const { data: tracksResult, isLoading: tracksLoading } = useTracks({ limit: 1000 });
  const { data: playlistsResult } = usePlaylists({ limit: 1000 });

  const tracks = tracksResult?.data || [];
  const playlists = playlistsResult?.data || [];

  // Get authenticated user
  const { user: currentUser } = useAuth();
  const { data: user } = useUser(currentUser?._id || "");

  const addToLibrary = useAddToLibrary();
  const removeFromLibrary = useRemoveFromLibrary();
  const addTracksToPlaylist = useAddTracksToPlaylist();
  const syncArtistAlbums = useSyncArtistAlbums();

  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>("");
  const [selectedTrackId, setSelectedTrackId] = useState<string>("");
  const [hasTriggeredSync, setHasTriggeredSync] = useState(false);

  const albumMap = albums ? new Map(albums.map((album) => [album._id, album])) : new Map();

  // Auto-sync albums and tracks from Spotify if not already synced
  useEffect(() => {
    // Conditions très strictes pour éviter les appels multiples
    if (
      artist &&
      artist.spotify_synced === false &&
      !hasTriggeredSync &&
      !syncArtistAlbums.isPending &&
      !syncArtistAlbums.isSuccess
    ) {
      console.log('[FRONTEND] Triggering sync for artist:', artistId, 'spotify_synced:', artist.spotify_synced);
      setHasTriggeredSync(true); // Marquer AVANT l'appel
      syncArtistAlbums.mutate(artistId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artist?.spotify_synced, artistId, hasTriggeredSync]);

  // Filter albums and tracks for this artist
  const artistAlbums = (albums || [])
    .filter((album) => album.artist_ids.includes(artistId))
    .sort((a, b) => b.release_date.localeCompare(a.release_date)); // Most recent first

  const artistTracks = (tracks || [])
    .filter((track) => track.artist_ids.includes(artistId))
    .sort((a, b) => b.popularity - a.popularity); // Most popular first

  const isLoading = artistLoading || albumsLoading || tracksLoading;

  function formatDuration(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  function isTrackLiked(trackId: string): boolean {
    return user?.liked_tracks?.includes(trackId) || false;
  }

  function isAlbumLiked(albumId: string): boolean {
    return user?.liked_albums?.includes(albumId) || false;
  }

  function isArtistLiked(): boolean {
    return user?.favorite_artists?.includes(artistId) || false;
  }

  function handleLikeToggle(trackId: string) {
    if (!currentUser) return;
    if (isTrackLiked(trackId)) {
      removeFromLibrary.mutate({ userId: currentUser._id, data: { track_id: trackId } });
    } else {
      addToLibrary.mutate({ userId: currentUser._id, data: { track_id: trackId } });
    }
  }

  function handleAlbumLikeToggle(albumId: string) {
    if (!currentUser) return;
    if (isAlbumLiked(albumId)) {
      removeFromLibrary.mutate({ userId: currentUser._id, data: { album_id: albumId } });
    } else {
      addToLibrary.mutate({ userId: currentUser._id, data: { album_id: albumId } });
    }
  }

  function handleArtistLikeToggle() {
    if (!currentUser) return;
    if (isArtistLiked()) {
      removeFromLibrary.mutate({ userId: currentUser._id, data: { artist_id: artistId } });
    } else {
      addToLibrary.mutate({ userId: currentUser._id, data: { artist_id: artistId } });
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading artist...</p>
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Card className="w-full max-w-md !bg-background/10">
          <CardHeader>
            <CardTitle>Artist Not Found</CardTitle>
            <CardDescription>
              The artist you&apos;re looking for doesn&apos;t exist.
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

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/search">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Search
        </Button>
      </Link>

      {/* Artist Header */}
      <Card className="!bg-background/10">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Artist Image */}
            <div className="relative w-full md:w-64 aspect-square rounded-full overflow-hidden bg-muted flex-shrink-0">
              {artist.images[0]?.url ? (
                <Image
                  src={artist.images[0].url}
                  alt={artist.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="h-full w-full bg-muted flex items-center justify-center">
                  <Users className="h-24 w-24 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Artist Info */}
            <div className="flex-1">
              <div className="mb-2">
                <Badge variant="secondary">Artist</Badge>
              </div>
              <h1 className="text-4xl font-bold mb-2">{artist.name}</h1>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {artist.followers.toLocaleString()} followers
                </div>
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4" />
                  Popularity: {artist.popularity}/100
                </div>
              </div>

              {/* Genres */}
              {artist.genres && artist.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {artist.genres.map((genre) => (
                    <Badge key={genre} variant="outline">
                      {genre}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3">
                <Button
                  variant={isArtistLiked() ? "default" : "outline"}
                  onClick={handleArtistLikeToggle}
                  className="gap-2"
                >
                  <Heart className={isArtistLiked() ? "h-5 w-5 fill-current" : "h-5 w-5"} />
                  {isArtistLiked() ? "Liked" : "Like Artist"}
                </Button>
                <a
                  href={artist.external_urls.spotify}
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="!bg-background/10">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold">{artistAlbums.length}</div>
            <div className="text-sm text-muted-foreground">Releases</div>
            {syncArtistAlbums.isPending && (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-2">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Syncing...
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="!bg-background/10">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold">{artistTracks.length}</div>
            <div className="text-sm text-muted-foreground">Tracks</div>
            {syncArtistAlbums.isPending && (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-2">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Syncing...
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="!bg-background/10">
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold">{artist.popularity}</div>
            <div className="text-sm text-muted-foreground">Popularity</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Popular Tracks and Releases */}
      <Tabs defaultValue="tracks">
        <TabsList className="grid w-full grid-cols-2 !bg-background/10">
          <TabsTrigger value="tracks">Popular Tracks</TabsTrigger>
          <TabsTrigger value="releases">Releases</TabsTrigger>
        </TabsList>

        {/* Popular Tracks Tab */}
        <TabsContent value="tracks">
          <Card className="!bg-background/10">
            <CardHeader>
              <CardTitle>Popular Tracks</CardTitle>
              <CardDescription>
                Top tracks by {artist.name}, sorted by popularity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]"></TableHead>
                    <TableHead className="w-[300px]">Track</TableHead>
                    <TableHead className="w-[200px]">Album</TableHead>
                    <TableHead className="w-[100px]">Duration</TableHead>
                    <TableHead className="w-[120px]">Popularity</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {artistTracks.slice(0, 20).map((track) => {
                    const album = albumMap.get(track.album_id);

                    return (
                      <TableRow key={track._id}>
                        <TableCell>
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
                          <Link href={`/albums/${track.album_id}`}>
                            <span
                              className="text-sm text-muted-foreground hover:text-primary hover:underline cursor-pointer block truncate"
                              title={album?.name || "Unknown Album"}
                            >
                              {album?.name || "Unknown Album"}
                            </span>
                          </Link>
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
              {artistTracks.length > 20 && (
                <p className="text-sm text-muted-foreground text-center mt-4">
                  Showing top 20 tracks
                </p>
              )}
              {artistTracks.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No tracks found for this artist.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Releases Tab */}
        <TabsContent value="releases">
          <Card className="!bg-background/10">
            <CardHeader>
              <CardTitle>Releases</CardTitle>
              <CardDescription>
                All albums and releases by {artist.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {artistAlbums.map((album) => (
                  <Card key={album._id} className="overflow-hidden hover:shadow-lg transition-shadow !bg-background/10">
                    <Link href={`/albums/${album._id}`}>
                      <div className="relative aspect-square bg-muted cursor-pointer">
                        {album.images[0]?.url ? (
                          <Image
                            src={album.images[0].url}
                            alt={album.name}
                            fill
                            className="object-cover hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="h-full w-full bg-muted flex items-center justify-center">
                            <Disc className="h-16 w-16 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </Link>
                    <CardContent className="p-4">
                      <Link href={`/albums/${album._id}`}>
                        <h3 className="font-semibold truncate hover:text-primary cursor-pointer" title={album.name}>
                          {album.name}
                        </h3>
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {new Date(album.release_date).getFullYear()}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="outline" className="text-xs">
                          {album.album_type}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleAlbumLikeToggle(album._id)}
                            className={isAlbumLiked(album._id) ? "text-red-500 hover:text-red-600" : ""}
                          >
                            <Heart className={isAlbumLiked(album._id) ? "h-4 w-4 fill-current" : "h-4 w-4"} />
                          </Button>
                          <a
                            href={album.external_urls.spotify}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-accent rounded-md"
                          >
                            <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {artistAlbums.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No releases found for this artist.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add to Playlist Dialog */}
      <Dialog open={playlistDialogOpen} onOpenChange={setPlaylistDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Playlist</DialogTitle>
            <DialogDescription>
              Select a playlist to add this track to.
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
              onClick={handleAddToPlaylist}
              disabled={!selectedPlaylistId || addTracksToPlaylist.isPending}
            >
              {addTracksToPlaylist.isPending ? "Adding..." : "Add to Playlist"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
