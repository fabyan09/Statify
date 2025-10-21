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
import {
  useTracks,
  useAlbums,
  useArtists,
  usePlaylists,
  usePublicPlaylists,
  useUsers,
  useUser,
  useAddToLibrary,
  useRemoveFromLibrary,
  useAddTracksToPlaylist,
  useAddCollaborator,
} from "@/lib/hooks";
import { useAuth } from "@/contexts/auth-context";
import { ExternalLink, Search, Heart, Plus, Users, Music, Disc, User, ListMusic } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function SearchPage() {
  const { data: tracks, isLoading: tracksLoading } = useTracks();
  const { data: albums, isLoading: albumsLoading } = useAlbums();
  const { data: artists, isLoading: artistsLoading } = useArtists();
  const { data: publicPlaylists, isLoading: playlistsLoading } = usePublicPlaylists();
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: userPlaylists } = usePlaylists();

  // Get authenticated user
  const { user: currentUser } = useAuth();
  const { data: user } = useUser(currentUser?._id || "");

  const addToLibrary = useAddToLibrary();
  const removeFromLibrary = useRemoveFromLibrary();
  const addTracksToPlaylist = useAddTracksToPlaylist();
  const addCollaborator = useAddCollaborator();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("tracks");

  // Dialog states
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>("");
  const [selectedTrackId, setSelectedTrackId] = useState<string>("");

  // Create lookups
  const albumMap = albums ? new Map(albums.map((album) => [album._id, album])) : new Map();
  const artistMap = artists ? new Map(artists.map((artist) => [artist._id, artist])) : new Map();

  const isLoading = tracksLoading || albumsLoading || artistsLoading || playlistsLoading || usersLoading;

  // Filter functions
  const filteredTracks = (tracks || []).filter((track) => {
    const album = albumMap.get(track.album_id);
    const trackArtists = track.artist_ids.map((id) => artistMap.get(id)).filter(Boolean);
    const artistNames = trackArtists.map((artist) => artist?.name).join(", ");

    return (
      track.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      album?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      artistNames.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const filteredAlbums = (albums || []).filter((album) => {
    const albumArtists = album.artist_ids.map((id) => artistMap.get(id)).filter(Boolean);
    const artistNames = albumArtists.map((artist) => artist?.name).join(", ");

    return (
      album.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      artistNames.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const filteredArtists = (artists || []).filter((artist) =>
    artist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    artist.genres.some((genre) => genre.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredPlaylists = (publicPlaylists || []).filter((playlist) =>
    playlist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    playlist.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = (users || []).filter((u) =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Search</h1>
        <p className="text-muted-foreground">
          Find tracks, albums, artists, playlists, and users
        </p>
      </div>

      {/* Search Input */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for tracks, albums, artists, playlists, or users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 h-12 text-lg"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="tracks" className="flex items-center gap-2">
            <Music className="h-4 w-4" />
            Tracks ({filteredTracks.length})
          </TabsTrigger>
          <TabsTrigger value="albums" className="flex items-center gap-2">
            <Disc className="h-4 w-4" />
            Albums ({filteredAlbums.length})
          </TabsTrigger>
          <TabsTrigger value="artists" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Artists ({filteredArtists.length})
          </TabsTrigger>
          <TabsTrigger value="playlists" className="flex items-center gap-2">
            <ListMusic className="h-4 w-4" />
            Playlists ({filteredPlaylists.length})
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Users ({filteredUsers.length})
          </TabsTrigger>
        </TabsList>

        {/* Tracks Tab */}
        <TabsContent value="tracks">
          <Card>
            <CardHeader>
              <CardTitle>Tracks</CardTitle>
              <CardDescription>
                {filteredTracks.length} track{filteredTracks.length !== 1 ? "s" : ""} found
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                  {filteredTracks.slice(0, 50).map((track) => {
                    const album = albumMap.get(track.album_id);
                    const trackArtists = track.artist_ids.map((id) => artistMap.get(id)).filter(Boolean);
                    const artistNames = trackArtists.map((artist) => artist?.name).join(", ") || "Unknown Artist";
                    const albumName = album?.name || "Unknown Album";

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
                          <span className="text-sm block truncate" title={artistNames}>
                            {artistNames}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground block truncate" title={albumName}>
                            {albumName}
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
              {filteredTracks.length > 50 && (
                <p className="text-sm text-muted-foreground text-center mt-4">
                  Showing first 50 results. Refine your search to see more.
                </p>
              )}
              {filteredTracks.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No tracks found matching your search.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Albums Tab */}
        <TabsContent value="albums">
          <Card>
            <CardHeader>
              <CardTitle>Albums</CardTitle>
              <CardDescription>
                {filteredAlbums.length} album{filteredAlbums.length !== 1 ? "s" : ""} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredAlbums.slice(0, 50).map((album) => {
                  const albumArtists = album.artist_ids.map((id) => artistMap.get(id)).filter(Boolean);
                  const artistNames = albumArtists.map((artist) => artist?.name).join(", ") || "Unknown Artist";

                  return (
                    <Card key={album._id} className="overflow-hidden hover:shadow-lg transition-shadow">
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
                        <p className="text-sm text-muted-foreground truncate" title={artistNames}>
                          {artistNames}
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
                  );
                })}
              </div>
              {filteredAlbums.length > 50 && (
                <p className="text-sm text-muted-foreground text-center mt-4">
                  Showing first 50 results. Refine your search to see more.
                </p>
              )}
              {filteredAlbums.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No albums found matching your search.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Artists Tab */}
        <TabsContent value="artists">
          <Card>
            <CardHeader>
              <CardTitle>Artists</CardTitle>
              <CardDescription>
                {filteredArtists.length} artist{filteredArtists.length !== 1 ? "s" : ""} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredArtists.slice(0, 50).map((artist) => (
                  <Card key={artist._id} className="overflow-hidden hover:shadow-lg transition-shadow">
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
                        {artist.genres.slice(0, 2).map((genre) => (
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
              {filteredArtists.length > 50 && (
                <p className="text-sm text-muted-foreground text-center mt-4">
                  Showing first 50 results. Refine your search to see more.
                </p>
              )}
              {filteredArtists.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No artists found matching your search.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Playlists Tab */}
        <TabsContent value="playlists">
          <Card>
            <CardHeader>
              <CardTitle>Public Playlists</CardTitle>
              <CardDescription>
                {filteredPlaylists.length} playlist{filteredPlaylists.length !== 1 ? "s" : ""} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPlaylists.map((playlist) => {
                  const isCollaborator = currentUser ? playlist.collaborators.includes(currentUser._id) : false;

                  return (
                    <Card key={playlist._id} className="hover:shadow-lg transition-shadow">
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
              {filteredPlaylists.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No playlists found matching your search.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.map((u) => (
                  <Card key={u._id} className="hover:shadow-lg transition-shadow">
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
              {filteredUsers.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No users found matching your search.
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
