"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchTrack, SearchAlbum, SearchArtist, SearchPlaylist, SearchUser } from "@/lib/types";
import {
  useSearch,
  useUser,
  useAddToLibrary,
  useRemoveFromLibrary,
  useAddTracksToPlaylist,
  useAddCollaborator,
  useUserPlaylists,
} from "@/lib/hooks";
import { useAuth } from "@/contexts/auth-context";
import { ExternalLink, Search, Heart, Plus, Users, Music, Disc, User, ListMusic } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Pagination } from "@/components/pagination";
import { useDebounce } from "@/lib/useDebounce";

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("tracks");

  // Separate pagination state for each type
  const [tracksPage, setTracksPage] = useState(1);
  const [albumsPage, setAlbumsPage] = useState(1);
  const [artistsPage, setArtistsPage] = useState(1);
  const [playlistsPage, setPlaylistsPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);

  const limit = 20;

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Search queries for each type
  const { data: tracksResult, isLoading: tracksLoading } = useSearch(debouncedSearchTerm, 'tracks', { page: tracksPage, limit });
  const { data: albumsResult, isLoading: albumsLoading } = useSearch(debouncedSearchTerm, 'albums', { page: albumsPage, limit });
  const { data: artistsResult, isLoading: artistsLoading } = useSearch(debouncedSearchTerm, 'artists', { page: artistsPage, limit });
  const { data: playlistsResult, isLoading: playlistsLoading } = useSearch(debouncedSearchTerm, 'playlists', { page: playlistsPage, limit });
  const { data: usersResult, isLoading: usersLoading } = useSearch(debouncedSearchTerm, 'users', { page: usersPage, limit });

  // Extract data from search results
  const tracks = tracksResult?.data || [];
  const albums = albumsResult?.data || [];
  const artists = artistsResult?.data || [];
  const playlists = playlistsResult?.data || [];
  const users = usersResult?.data || [];

  // Get authenticated user
  const { user: currentUser } = useAuth();
  const { data: user } = useUser(currentUser?._id || "");
  const { data: userPlaylistsResult } = useUserPlaylists(currentUser?._id || "", { limit: 1000 });
  const userPlaylists = userPlaylistsResult?.data || [];

  const addToLibrary = useAddToLibrary();
  const removeFromLibrary = useRemoveFromLibrary();
  const addTracksToPlaylist = useAddTracksToPlaylist();
  const addCollaborator = useAddCollaborator();

  // Dialog states
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>("");
  const [selectedTrackId, setSelectedTrackId] = useState<string>("");

  const isLoading = tracksLoading || albumsLoading || artistsLoading || playlistsLoading || usersLoading;

  // Helper functions
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

  function isArtistLiked(artistId: string): boolean {
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

  function handleArtistLikeToggle(artistId: string) {
    if (!currentUser) return;
    if (isArtistLiked(artistId)) {
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

  function handleJoinPlaylist(playlistId: string) {
    if (!currentUser) return;
    addCollaborator.mutate({ playlistId, userId: currentUser._id });
  }


  return (
    <div className="space-y-8">
      {/* Search Input - Hero Section */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Search</h1>
          <p className="text-muted-foreground text-lg">
            Find tracks, albums, artists, playlists, and users
          </p>
        </div>

        <Card className="!bg-background/10 border-2">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
              <Input
                placeholder="Search for tracks, albums, artists, playlists, or users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-14 h-14 text-lg border-0 focus-visible:ring-2 focus-visible:ring-primary"
                autoFocus
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 !bg-background/10">
          <TabsTrigger value="tracks" className="flex items-center gap-2">
            <Music className="h-4 w-4" />
            Tracks
          </TabsTrigger>
          <TabsTrigger value="albums" className="flex items-center gap-2">
            <Disc className="h-4 w-4" />
            Albums
          </TabsTrigger>
          <TabsTrigger value="artists" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Artists
          </TabsTrigger>
          <TabsTrigger value="playlists" className="flex items-center gap-2">
            <ListMusic className="h-4 w-4" />
            Playlists
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Users
          </TabsTrigger>
        </TabsList>

        {/* Tracks Tab */}
        <TabsContent value="tracks">
          {!debouncedSearchTerm ? (
            <Card className="!bg-background/10 border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Music className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Search for tracks</h3>
                <p className="text-muted-foreground text-center max-w-sm">
                  Enter a search term above to find tracks by name, artist, or album
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="!bg-background/10">
                <CardHeader>
                  <CardTitle>Tracks</CardTitle>
                  <CardDescription>
                    {tracksResult?.meta.total || 0} track{tracksResult?.meta.total !== 1 ? "s" : ""} found
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {tracksLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                    </div>
                  ) : tracks.length === 0 ? (
                    <div className="text-center py-12">
                      <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground">No tracks found matching your search.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[60px]"></TableHead>
                          <TableHead className="w-[250px]">Track</TableHead>
                          <TableHead className="w-[200px]">Artist</TableHead>
                          <TableHead className="w-[200px]">Album</TableHead>
                          <TableHead className="w-[100px]">Duration</TableHead>
                          <TableHead className="w-[120px]">Popularity</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                          <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tracks.map((track: SearchTrack) => (
                          <TableRow key={track._id}>
                            <TableCell>
                              <div className="relative h-10 w-10 rounded overflow-hidden bg-muted">
                                {track.albumImage ? (
                                  <Image
                                    src={track.albumImage}
                                    alt={track.albumName || track.name}
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
                                <span className="font-medium truncate block" title={track.name}>
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
                              <span className="text-sm block truncate">
                                {track.artistNames}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground block truncate">
                                {track.albumName}
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
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
              {tracksResult?.meta && tracks.length > 0 && (
                <div className="mt-4">
                  <Pagination
                    meta={tracksResult.meta}
                    onPageChange={(newPage) => setTracksPage(newPage)}
                  />
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Albums Tab */}
        <TabsContent value="albums">
          {!debouncedSearchTerm ? (
            <Card className="!bg-background/10 border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Disc className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Search for albums</h3>
                <p className="text-muted-foreground text-center max-w-sm">
                  Enter a search term above to find albums by name or artist
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="!bg-background/10">
                <CardHeader>
                  <CardTitle>Albums</CardTitle>
                  <CardDescription>
                    {albumsResult?.meta.total || 0} album{albumsResult?.meta.total !== 1 ? "s" : ""} found
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {albumsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                    </div>
                  ) : albums.length === 0 ? (
                    <div className="text-center py-12">
                      <Disc className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground">No albums found matching your search.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {albums.map((album: SearchAlbum) => (
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
                          <p className="text-sm text-muted-foreground truncate">
                            {album.artistNames}
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
                  )}
                </CardContent>
              </Card>
              {albumsResult?.meta && albums.length > 0 && (
                <div className="mt-4">
                  <Pagination
                    meta={albumsResult.meta}
                    onPageChange={(newPage) => setAlbumsPage(newPage)}
                  />
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Artists Tab */}
        <TabsContent value="artists">
          {!debouncedSearchTerm ? (
            <Card className="!bg-background/10 border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Users className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Search for artists</h3>
                <p className="text-muted-foreground text-center max-w-sm">
                  Enter a search term above to find artists by name or genre
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="!bg-background/10">
                <CardHeader>
                  <CardTitle>Artists</CardTitle>
                  <CardDescription>
                    {artistsResult?.meta.total || 0} artist{artistsResult?.meta.total !== 1 ? "s" : ""} found
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {artistsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                    </div>
                  ) : artists.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground">No artists found matching your search.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {artists.map((artist: SearchArtist) => (
                      <Card key={artist._id} className="overflow-hidden hover:shadow-lg transition-shadow !bg-background/10">
                        <Link href={`/artists/${artist._id}`}>
                          <div className="relative aspect-square bg-muted cursor-pointer">
                            {artist.images[0]?.url ? (
                              <Image
                                src={artist.images[0].url}
                                alt={artist.name}
                                fill
                                className="object-cover hover:scale-105 transition-transform rounded-full"
                              />
                            ) : (
                              <div className="h-full w-full bg-muted flex items-center justify-center">
                                <Users className="h-16 w-16 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </Link>
                        <CardContent className="p-4">
                          <Link href={`/artists/${artist._id}`}>
                            <h3 className="font-semibold truncate hover:text-primary cursor-pointer" title={artist.name}>
                              {artist.name}
                            </h3>
                          </Link>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {artist.genres?.slice(0, 2).map((genre: string) => (
                              <Badge key={genre} variant="secondary" className="text-xs">
                                {genre}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <Badge variant="outline" className="text-xs">
                              {artist.popularity}/100
                            </Badge>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleArtistLikeToggle(artist._id)}
                                className={isArtistLiked(artist._id) ? "text-red-500 hover:text-red-600" : ""}
                              >
                                <Heart className={isArtistLiked(artist._id) ? "h-4 w-4 fill-current" : "h-4 w-4"} />
                              </Button>
                              <a
                                href={artist.external_urls.spotify}
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
                  )}
                </CardContent>
              </Card>
              {artistsResult?.meta && artists.length > 0 && (
                <div className="mt-4">
                  <Pagination
                    meta={artistsResult.meta}
                    onPageChange={(newPage) => setArtistsPage(newPage)}
                  />
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Playlists Tab */}
        <TabsContent value="playlists">
          {!debouncedSearchTerm ? (
            <Card className="!bg-background/10 border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <ListMusic className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Search for playlists</h3>
                <p className="text-muted-foreground text-center max-w-sm">
                  Enter a search term above to find public playlists by name or description
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="!bg-background/10">
                <CardHeader>
                  <CardTitle>Public Playlists</CardTitle>
                  <CardDescription>
                    {playlistsResult?.meta.total || 0} playlist{playlistsResult?.meta.total !== 1 ? "s" : ""} found
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {playlistsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                    </div>
                  ) : playlists.length === 0 ? (
                    <div className="text-center py-12">
                      <ListMusic className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground">No playlists found matching your search.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {playlists.map((playlist: SearchPlaylist) => {
                      const isCollaborator = currentUser ? playlist.collaborators.includes(currentUser._id) : false;

                      return (
                        <Card key={playlist._id} className="hover:shadow-lg transition-shadow !bg-background/10">
                          <CardContent className="p-6">
                            <div className="flex items-start gap-4">
                              <div className="h-16 w-16 rounded bg-muted flex items-center justify-center flex-shrink-0">
                                <ListMusic className="h-8 w-8 text-muted-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold truncate" title={playlist.name}>
                                  {playlist.name}
                                </h3>
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                  {playlist.description || "No description"}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {playlist.tracks.length} tracks
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {playlist.collaborators.length} collaborators
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-4">
                              {isCollaborator ? (
                                <Button variant="outline" size="sm" disabled className="flex-1">
                                  <Users className="h-4 w-4 mr-2" />
                                  Joined
                                </Button>
                              ) : (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleJoinPlaylist(playlist._id)}
                                  disabled={addCollaborator.isPending}
                                  className="flex-1"
                                >
                                  <Users className="h-4 w-4 mr-2" />
                                  Join as Collaborator
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                    </div>
                  )}
                </CardContent>
              </Card>
              {playlistsResult?.meta && playlists.length > 0 && (
                <div className="mt-4">
                  <Pagination
                    meta={playlistsResult.meta}
                    onPageChange={(newPage) => setPlaylistsPage(newPage)}
                  />
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          {!debouncedSearchTerm ? (
            <Card className="!bg-background/10 border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <User className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Search for users</h3>
                <p className="text-muted-foreground text-center max-w-sm">
                  Enter a search term above to find users by username
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="!bg-background/10">
                <CardHeader>
                  <CardTitle>Users</CardTitle>
                  <CardDescription>
                    {usersResult?.meta.total || 0} user{usersResult?.meta.total !== 1 ? "s" : ""} found
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {usersLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                    </div>
                  ) : users.length === 0 ? (
                    <div className="text-center py-12">
                      <User className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground">No users found matching your search.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.map((u: SearchUser) => (
                      <Card key={u._id} className="hover:shadow-lg transition-shadow !bg-background/10">
                        <Link href={`/users/${u._id}`}>
                          <CardContent className="p-6 cursor-pointer">
                            <div className="flex items-center gap-4">
                              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                <User className="h-8 w-8 text-muted-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold truncate hover:text-primary" title={u.username}>
                                  {u.username}
                                </h3>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {u.liked_tracks?.length || 0} tracks
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {u.favorite_artists?.length || 0} artists
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Link>
                      </Card>
                    ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              {usersResult?.meta && users.length > 0 && (
                <div className="mt-4">
                  <Pagination
                    meta={usersResult.meta}
                    onPageChange={(newPage) => setUsersPage(newPage)}
                  />
                </div>
              )}
            </>
          )}
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
                {userPlaylists && userPlaylists.length > 0 ? (
                  userPlaylists.map((playlist) => (
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
