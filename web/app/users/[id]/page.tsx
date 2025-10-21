"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useUser,
  useUserLibrary,
  useUserPlaylists,
  useTracks,
  useAlbums,
  useArtists,
  usePlaylists,
  useAddToLibrary,
  useRemoveFromLibrary,
  useAddTracksToPlaylist,
} from "@/lib/hooks";
import { useAuth } from "@/contexts/auth-context";
import { ExternalLink, Heart, Plus, ArrowLeft, User, ListMusic } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;

  const { data: profileUser, isLoading: userLoading } = useUser(userId);
  const { data: userLibrary, isLoading: libraryLoading } = useUserLibrary(userId);
  const { data: userPlaylists, isLoading: playlistsLoading } = useUserPlaylists(userId);

  const { data: tracks, isLoading: tracksLoading } = useTracks();
  const { data: albums, isLoading: albumsLoading } = useAlbums();
  const { data: artists, isLoading: artistsLoading } = useArtists();
  const { data: allPlaylists } = usePlaylists();

  // Get authenticated user
  const { user: authUser } = useAuth();
  const { data: currentUser } = useUser(authUser?._id || "");

  const addToLibrary = useAddToLibrary();
  const removeFromLibrary = useRemoveFromLibrary();
  const addTracksToPlaylist = useAddTracksToPlaylist();

  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>("");
  const [selectedTrackId, setSelectedTrackId] = useState<string>("");

  const albumMap = albums ? new Map(albums.map((album) => [album._id, album])) : new Map();
  const artistMap = artists ? new Map(artists.map((artist) => [artist._id, artist])) : new Map();

  // Get liked tracks from library
  const likedTrackIds = userLibrary?.tracks || profileUser?.liked_tracks || [];
  const likedTracks = (tracks || [])
    .filter((track) => likedTrackIds.includes(track._id))
    .sort((a, b) => b.popularity - a.popularity);

  const isLoading = userLoading || libraryLoading || playlistsLoading || tracksLoading || albumsLoading || artistsLoading;

  function formatDuration(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  function isTrackLiked(trackId: string): boolean {
    return currentUser?.liked_tracks?.includes(trackId) || false;
  }

  function handleLikeToggle(trackId: string) {
    if (!authUser) return;
    if (isTrackLiked(trackId)) {
      removeFromLibrary.mutate({ userId: authUser._id, data: { track_id: trackId } });
    } else {
      addToLibrary.mutate({ userId: authUser._id, data: { track_id: trackId } });
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
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>User Not Found</CardTitle>
            <CardDescription>
              The user you&apos;re looking for doesn&apos;t exist.
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

      {/* User Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            {/* User Avatar */}
            <div className="relative w-32 h-32 rounded-full overflow-hidden bg-muted flex-shrink-0">
              <div className="h-full w-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <User className="h-16 w-16 text-white" />
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="mb-2">
                <Badge variant="secondary">User</Badge>
              </div>
              <h1 className="text-4xl font-bold mb-4">{profileUser.username}</h1>

              <div className="flex flex-wrap gap-6 justify-center md:justify-start text-sm">
                <div>
                  <div className="text-2xl font-bold">{userPlaylists?.length || 0}</div>
                  <div className="text-muted-foreground">Playlists</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{likedTracks.length}</div>
                  <div className="text-muted-foreground">Liked Tracks</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{profileUser.favorite_artists?.length || 0}</div>
                  <div className="text-muted-foreground">Favorite Artists</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Playlists and Liked Tracks */}
      <Tabs defaultValue="playlists">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="playlists">Playlists</TabsTrigger>
          <TabsTrigger value="tracks">Liked Tracks</TabsTrigger>
        </TabsList>

        {/* Playlists Tab */}
        <TabsContent value="playlists">
          <Card>
            <CardHeader>
              <CardTitle>Playlists</CardTitle>
              <CardDescription>
                {userPlaylists?.length || 0} playlist{userPlaylists?.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userPlaylists && userPlaylists.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userPlaylists.map((playlist) => (
                    <Card key={playlist._id} className="hover:shadow-lg transition-shadow">
                      <Link href={`/playlists/${playlist._id}`}>
                        <CardContent className="p-6 cursor-pointer">
                          <div className="flex items-start gap-4">
                            <div className="h-16 w-16 rounded bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                              <ListMusic className="h-8 w-8 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold truncate hover:text-primary" title={playlist.name}>
                                {playlist.name}
                              </h3>
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {playlist.description || "No description"}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="text-xs">
                                  {playlist.tracks.length} tracks
                                </Badge>
                                {playlist.isPublic && (
                                  <Badge variant="outline" className="text-xs">
                                    Public
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Link>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No playlists yet.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Liked Tracks Tab */}
        <TabsContent value="tracks">
          <Card>
            <CardHeader>
              <CardTitle>Liked Tracks</CardTitle>
              <CardDescription>
                {likedTracks.length} liked track{likedTracks.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {likedTracks.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]"></TableHead>
                      <TableHead className="w-[300px]">Track</TableHead>
                      <TableHead className="w-[200px]">Artist</TableHead>
                      <TableHead className="w-[200px]">Album</TableHead>
                      <TableHead className="w-[100px]">Duration</TableHead>
                      <TableHead className="w-[120px]">Popularity</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {likedTracks.map((track) => {
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
                            <span className="text-sm block truncate" title={artistNames}>
                              {artistNames}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Link href={`/albums/${track.album_id}`}>
                              <span
                                className="text-sm text-muted-foreground hover:text-primary hover:underline cursor-pointer block truncate"
                                title={albumName}
                              >
                                {albumName}
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
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No liked tracks yet.
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
                {allPlaylists && allPlaylists.length > 0 ? (
                  allPlaylists.map((playlist) => (
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
