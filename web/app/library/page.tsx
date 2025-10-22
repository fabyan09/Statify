"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi, fetchTracks, fetchAlbums, fetchArtists } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Music, Disc, User, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function LibraryPage() {
  const router = useRouter();
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("tracks");

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push("/auth");
    }
  }, [authLoading, currentUser, router]);

  // Fetch user library (for counts)
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["user", currentUser?._id],
    queryFn: () => userApi.getById(currentUser!._id),
    enabled: !!currentUser,
  });

  // Fetch liked tracks, albums, artists with complete data from API
  const { data: likedTracks = [] } = useQuery({
    queryKey: ["user-liked-tracks", currentUser?._id],
    queryFn: () => userApi.getLikedTracks(currentUser!._id),
    enabled: !!currentUser,
  });

  const { data: likedAlbums = [] } = useQuery({
    queryKey: ["user-liked-albums", currentUser?._id],
    queryFn: () => userApi.getLikedAlbums(currentUser!._id),
    enabled: !!currentUser,
  });

  const { data: favoriteArtists = [] } = useQuery({
    queryKey: ["user-favorite-artists", currentUser?._id],
    queryFn: () => userApi.getFavoriteArtists(currentUser!._id),
    enabled: !!currentUser,
  });

  // Créer des Maps pour optimiser les lookups (éviter O(n*m))
  const albumMap = new Map(likedAlbums.map(album => [album._id, album]));
  const artistMap = new Map(favoriteArtists.map(artist => [artist._id, artist]));

  // Remove from library mutation
  const removeMutation = useMutation({
    mutationFn: (data: { track_id?: string; album_id?: string; artist_id?: string }) =>
      userApi.removeFromLibrary(currentUser!._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", currentUser?._id] });
      queryClient.invalidateQueries({ queryKey: ["user-liked-tracks", currentUser?._id] });
      queryClient.invalidateQueries({ queryKey: ["user-liked-albums", currentUser?._id] });
      queryClient.invalidateQueries({ queryKey: ["user-favorite-artists", currentUser?._id] });
    },
  });

  if (authLoading || userLoading || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading your library...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
          <Heart className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-bold">My Library</h1>
          <p className="text-muted-foreground mt-1">
            Your favorite tracks, albums, and artists
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="!bg-background/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Music className="h-4 w-4" />
              Liked Tracks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{user?.liked_tracks.length || 0}</div>
          </CardContent>
        </Card>

        <Card className="!bg-background/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Disc className="h-4 w-4" />
              Liked Albums
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{user?.liked_albums.length || 0}</div>
          </CardContent>
        </Card>

        <Card className="!bg-background/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Favorite Artists
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{user?.favorite_artists.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 !bg-background/10">
          <TabsTrigger value="tracks">Tracks</TabsTrigger>
          <TabsTrigger value="albums">Albums</TabsTrigger>
          <TabsTrigger value="artists">Artists</TabsTrigger>
        </TabsList>

        <TabsContent value="tracks" className="space-y-4">
          <Card className="!bg-background/10">
            <CardHeader>
              <CardTitle>Liked Tracks</CardTitle>
              <CardDescription>
                {likedTracks.length} track{likedTracks.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {likedTracks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No liked tracks yet. Start exploring!
                </div>
              ) : (
                <div className="space-y-2">
                  {likedTracks.map((track) => {
                    // Handle both populated album (Album object) and string reference
                    const album = typeof track.album_id === 'string'
                      ? albumMap.get(track.album_id)
                      : track.album_id;
                    return (
                      <div
                        key={track._id}
                        className="flex items-center gap-4 p-3 rounded-lg hover:bg-accent transition-colors"
                      >
                        {/* Album Cover */}
                        <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
                          {album?.images?.[0]?.url ? (
                            <Image
                              src={album.images[0].url}
                              alt={album.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                              <Music className="w-6 h-6 text-white" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="font-medium line-clamp-1">{track.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {Math.floor(track.duration_ms / 60000)}:{String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant="secondary">
                            {track.popularity}
                          </Badge>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeMutation.mutate({ track_id: track._id })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="albums" className="space-y-4">
          <Card className="!bg-background/10">
            <CardHeader>
              <CardTitle>Liked Albums</CardTitle>
              <CardDescription>
                {likedAlbums.length} album{likedAlbums.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {likedAlbums.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No liked albums yet. Start exploring!
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {likedAlbums.map((album) => {
                    const albumArtists = album.artist_ids
                      .map(id => artistMap.get(id))
                      .filter((a): a is NonNullable<typeof a> => a !== undefined);

                    return (
                      <Card key={album._id} className="!bg-background/10 overflow-hidden hover:border-green-500 hover:shadow-lg transition-all duration-300 group">
                        <CardContent className="p-4">
                          <Link href={`/albums/${album._id}`}>
                            <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-3">
                              {album.images?.[0]?.url ? (
                                <Image
                                  src={album.images[0].url}
                                  alt={album.name}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                                  <Disc className="w-12 h-12 text-white" />
                                </div>
                              )}
                            </div>
                          </Link>

                          <Link href={`/albums/${album._id}`}>
                            <h3 className="font-semibold mb-1 hover:text-green-500 transition-colors line-clamp-1">
                              {album.name}
                            </h3>
                          </Link>

                          <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                            {albumArtists.map(a => a.name).join(", ")}
                          </p>

                          <div className="flex items-center justify-between gap-2">
                            <div className="flex gap-1">
                              <Badge variant="secondary" className="text-xs">
                                {album.album_type}
                              </Badge>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => removeMutation.mutate({ album_id: album._id })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="artists" className="space-y-4">
          <Card className="!bg-background/10">
            <CardHeader>
              <CardTitle>Favorite Artists</CardTitle>
              <CardDescription>
                {favoriteArtists.length} artist{favoriteArtists.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {favoriteArtists.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No favorite artists yet. Start exploring!
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {favoriteArtists.map((artist) => (
                    <Card key={artist._id} className="!bg-background/10 overflow-hidden hover:border-green-500 hover:shadow-lg transition-all duration-300 group">
                      <CardContent className="p-4">
                        <Link href={`/artists/${artist._id}`}>
                          <div className="relative w-full aspect-square rounded-full overflow-hidden mb-3">
                            {artist.images?.[0]?.url ? (
                              <Image
                                src={artist.images[0].url}
                                alt={artist.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                                <User className="w-12 h-12 text-white" />
                              </div>
                            )}
                          </div>
                        </Link>

                        <Link href={`/artists/${artist._id}`}>
                          <h3 className="font-semibold mb-1 hover:text-green-500 transition-colors text-center line-clamp-1">
                            {artist.name}
                          </h3>
                        </Link>

                        <p className="text-xs text-muted-foreground mb-2 text-center line-clamp-1">
                          {artist.genres.slice(0, 2).join(", ")}
                        </p>

                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="secondary" className="text-xs flex-1 justify-center">
                            {artist.popularity}
                          </Badge>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => removeMutation.mutate({ artist_id: artist._id })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
