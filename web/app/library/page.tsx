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

  // Fetch user library
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["user", currentUser?._id],
    queryFn: () => userApi.getById(currentUser!._id),
    enabled: !!currentUser,
  });

  // Fetch all tracks, albums, artists
  const { data: tracksResult } = useQuery({
    queryKey: ["tracks"],
    queryFn: () => fetchTracks({ limit: 1000 }),
  });

  const { data: allAlbums = [] } = useQuery({
    queryKey: ["albums"],
    queryFn: fetchAlbums,
  });

  const { data: allArtists = [] } = useQuery({
    queryKey: ["artists"],
    queryFn: fetchArtists,
  });

  const allTracks = tracksResult?.data || [];

  // Remove from library mutation
  const removeMutation = useMutation({
    mutationFn: (data: { track_id?: string; album_id?: string; artist_id?: string }) =>
      userApi.removeFromLibrary(currentUser!._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", currentUser?._id] });
    },
  });

  if (authLoading || userLoading || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading your library...</div>
      </div>
    );
  }

  const likedTracks = allTracks.filter((track) => user?.liked_tracks.includes(track._id));
  const likedAlbums = allAlbums.filter((album) => user?.liked_albums.includes(album._id));
  const favoriteArtists = allArtists.filter((artist) => user?.favorite_artists.includes(artist._id));

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl">
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
        <TabsList className="grid w-full grid-cols-3">
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
                  {likedTracks.map((track) => (
                    <div
                      key={track._id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{track.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {Math.floor(track.duration_ms / 60000)}:{String(Math.floor((track.duration_ms % 60000) / 1000)).padStart(2, '0')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {track.popularity}% popularity
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
                  ))}
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
                <div className="space-y-2">
                  {likedAlbums.map((album) => (
                    <div
                      key={album._id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{album.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {album.total_tracks} tracks • {album.release_date}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{album.album_type}</Badge>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeMutation.mutate({ album_id: album._id })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
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
                <div className="space-y-2">
                  {favoriteArtists.map((artist) => (
                    <div
                      key={artist._id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{artist.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {artist.genres.slice(0, 3).join(", ")}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {artist.popularity}% popularity
                        </Badge>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeMutation.mutate({ artist_id: artist._id })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
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
