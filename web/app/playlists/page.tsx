"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { playlistApi } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ListMusic, Plus, Trash2, Users, Lock, Globe, Music } from "lucide-react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/pagination";

export default function PlaylistsPage() {
  const router = useRouter();
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [publicPage, setPublicPage] = useState(1);
  const [publicLimit] = useState(12);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push("/auth");
    }
  }, [authLoading, currentUser, router]);

  // Fetch user's playlists (no pagination for user's own playlists)
  const { data: userPlaylistsResult, isLoading } = useQuery({
    queryKey: ["playlists", "user", currentUser?._id],
    queryFn: () => playlistApi.getByUser(currentUser!._id, { limit: 1000 }),
    enabled: !!currentUser,
  });

  // Fetch public playlists with pagination
  const { data: publicPlaylistsResult } = useQuery({
    queryKey: ["playlists", "public", publicPage, publicLimit],
    queryFn: () => playlistApi.getPublic({ page: publicPage, limit: publicLimit }),
  });

  const userPlaylists = userPlaylistsResult?.data || [];
  const publicPlaylists = publicPlaylistsResult?.data || [];

  // Create playlist mutation
  const createMutation = useMutation({
    mutationFn: (data: { name: string; description?: string; isPublic: boolean }) =>
      playlistApi.create({ ...data, owner_id: currentUser!._id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
      setShowCreateForm(false);
      setNewPlaylistName("");
      setNewPlaylistDesc("");
      setIsPublic(false);
    },
  });

  // Delete playlist mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => playlistApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
    },
  });

  const handleCreate = () => {
    if (newPlaylistName.trim()) {
      createMutation.mutate({
        name: newPlaylistName,
        description: newPlaylistDesc,
        isPublic,
      });
    }
  };

  const myPlaylists = userPlaylists.filter((p) => p.owner_id === currentUser?._id);
  const collaborativePlaylists = userPlaylists.filter(
    (p) => p.owner_id !== currentUser?._id && p.collaborators.includes(currentUser?._id || "")
  );

  if (authLoading || isLoading || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading playlists...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
            <ListMusic className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">My Playlists</h1>
            <p className="text-muted-foreground mt-1">
              Manage and organize your music collections
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Create Playlist
        </Button>
      </div>

      {showCreateForm && (
        <Card className="border-2 border-primary !bg-background/10">
          <CardHeader>
            <CardTitle>Create New Playlist</CardTitle>
            <CardDescription>Add a new playlist to your collection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Playlist Name</Label>
              <Input
                id="name"
                placeholder="My Awesome Playlist"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                placeholder="A collection of my favorite songs"
                value={newPlaylistDesc}
                onChange={(e) => setNewPlaylistDesc(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="public"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="public">Make this playlist public</Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={!newPlaylistName.trim()}>
                Create
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="!bg-background/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ListMusic className="h-4 w-4" />
              My Playlists
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{myPlaylists.length}</div>
          </CardContent>
        </Card>

        <Card className="!bg-background/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Collaborative
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{collaborativePlaylists.length}</div>
          </CardContent>
        </Card>

        <Card className="!bg-background/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Music className="h-4 w-4" />
              Total Tracks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {userPlaylists.reduce((sum, p) => sum + p.tracks.length, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {myPlaylists.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">My Playlists</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myPlaylists.map((playlist) => (
              <Card key={playlist._id} className="hover:shadow-lg transition-shadow !bg-background/10">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="line-clamp-1">{playlist.name}</CardTitle>
                      <CardDescription className="line-clamp-2 mt-1">
                        {playlist.description || "No description"}
                      </CardDescription>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(playlist._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Music className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {playlist.tracks.length} track{playlist.tracks.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={playlist.isPublic ? "default" : "secondary"}>
                        {playlist.isPublic ? (
                          <>
                            <Globe className="h-3 w-3 mr-1" />
                            Public
                          </>
                        ) : (
                          <>
                            <Lock className="h-3 w-3 mr-1" />
                            Private
                          </>
                        )}
                      </Badge>
                      {playlist.collaborators.length > 0 && (
                        <Badge variant="outline">
                          <Users className="h-3 w-3 mr-1" />
                          {playlist.collaborators.length} collaborator{playlist.collaborators.length !== 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                    <Link href={`/playlists/${playlist._id}`}>
                      <Button className="w-full" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {collaborativePlaylists.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Collaborative Playlists</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {collaborativePlaylists.map((playlist) => (
              <Card key={playlist._id} className="hover:shadow-lg transition-shadow border-2 border-purple-500/20 !bg-background/10">
                <CardHeader>
                  <CardTitle className="line-clamp-1">{playlist.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {playlist.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Music className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {playlist.tracks.length} track{playlist.tracks.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <Badge variant="outline">
                      <Users className="h-3 w-3 mr-1" />
                      Collaborative
                    </Badge>
                    <Link href={`/playlists/${playlist._id}`}>
                      <Button className="w-full" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {publicPlaylists.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Public Playlists</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {publicPlaylists.map((playlist) => (
              <Card key={playlist._id} className="hover:shadow-lg transition-shadow !bg-background/10">
                <CardHeader>
                  <CardTitle className="line-clamp-1">{playlist.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {playlist.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Music className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {playlist.tracks.length} track{playlist.tracks.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <Badge variant="default">
                      <Globe className="h-3 w-3 mr-1" />
                      Public
                    </Badge>
                    <Link href={`/playlists/${playlist._id}`}>
                      <Button className="w-full" size="sm" variant="outline">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {publicPlaylistsResult?.meta && (
            <Pagination
              meta={publicPlaylistsResult.meta}
              onPageChange={(newPage) => setPublicPage(newPage)}
            />
          )}
        </div>
      )}
    </div>
  );
}
