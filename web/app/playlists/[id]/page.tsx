"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { playlistApi, fetchTracks } from "@/lib/api";
import { Album, Artist } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import { useUser, useAddToLibrary, useRemoveFromLibrary, usePlaylistTracks } from "@/lib/hooks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Music,
  Plus,
  Trash2,
  Users,
  Lock,
  Globe,
  Edit,
  UserPlus,
  UserMinus,
  Heart,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { StatifyLoader } from "@/components/StatifyLoader";

export default function PlaylistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const playlistId = params.id as string;
  const queryClient = useQueryClient();
  const { user: currentUser, isLoading: authLoading } = useAuth();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push("/auth");
    }
  }, [authLoading, currentUser, router]);

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedDesc, setEditedDesc] = useState("");
  const [editedPublic, setEditedPublic] = useState(false);
  const [showAddTracks, setShowAddTracks] = useState(false);
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [showAddCollaborator, setShowAddCollaborator] = useState(false);
  const [collaboratorId, setCollaboratorId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch playlist
  const { data: playlist, isLoading } = useQuery({
    queryKey: ["playlist", playlistId],
    queryFn: () => playlistApi.getById(playlistId),
    enabled: !!currentUser,
  });

  // Fetch playlist tracks (only the tracks in this playlist)
  const { data: playlistTracks, isLoading: playlistTracksLoading } = usePlaylistTracks(playlistId);

  // Fetch tracks (for the "add tracks" section)
  // Limited to 100 to avoid loading too much data
  // TODO: Implement search-based track selection for better UX
  const { data: tracksResult } = useQuery({
    queryKey: ["tracks"],
    queryFn: () => fetchTracks({ limit: 100 }),
    enabled: !!currentUser && showAddTracks, // Only load when adding tracks
  });

  const allTracks = tracksResult?.data || [];

  // Fetch albums and artists ONLY when showing the "add tracks" section
  // The playlist tracks already have populated album_id and artist_ids from the backend
  const { data: albums } = useQuery({
    queryKey: ["albums"],
    queryFn: () => fetch(`${process.env.NEXT_PUBLIC_API_URL}/albums`).then(res => res.json()),
    enabled: !!currentUser && showAddTracks, // Only load when adding tracks
  });
  const { data: artists } = useQuery({
    queryKey: ["artists"],
    queryFn: () => fetch(`${process.env.NEXT_PUBLIC_API_URL}/artists`).then(res => res.json()),
    enabled: !!currentUser && showAddTracks, // Only load when adding tracks
  });

  // Get user data for like functionality
  const { data: user } = useUser(currentUser?._id || "");

  const addToLibrary = useAddToLibrary();
  const removeFromLibrary = useRemoveFromLibrary();

  // Create lookups for the "add tracks" section (these tracks are NOT populated)
  const albumMap = albums ? new Map(albums.map((album: Album) => [album._id, album])) : new Map();
  const artistMap = artists ? new Map(artists.map((artist: Artist) => [artist._id, artist])) : new Map();

  // Update playlist mutation
  const updateMutation = useMutation({
    mutationFn: (data: { name?: string; description?: string; isPublic?: boolean }) =>
      playlistApi.update(playlistId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlist", playlistId] });
      setIsEditing(false);
    },
  });

  // Add tracks mutation
  const addTracksMutation = useMutation({
    mutationFn: (track_ids: string[]) => playlistApi.addTracks(playlistId, track_ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlist", playlistId] });
      queryClient.invalidateQueries({ queryKey: ["playlist-tracks", playlistId] });
      setShowAddTracks(false);
      setSelectedTracks([]);
    },
  });

  // Remove tracks mutation
  const removeTracksMutation = useMutation({
    mutationFn: (track_ids: string[]) => playlistApi.removeTracks(playlistId, track_ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlist", playlistId] });
      queryClient.invalidateQueries({ queryKey: ["playlist-tracks", playlistId] });
    },
  });

  // Add collaborator mutation
  const addCollaboratorMutation = useMutation({
    mutationFn: (user_id: string) => playlistApi.addCollaborator(playlistId, user_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlist", playlistId] });
      setShowAddCollaborator(false);
      setCollaboratorId("");
    },
  });

  // Remove collaborator mutation
  const removeCollaboratorMutation = useMutation({
    mutationFn: (user_id: string) => playlistApi.removeCollaborator(playlistId, user_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playlist", playlistId] });
    },
  });

  if (authLoading || isLoading || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading playlist...</div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-lg">Playlist not found</div>
        <Link href="/playlists">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Playlists
          </Button>
        </Link>
      </div>
    );
  }

  // Filter available tracks by search term
  const availableTracks = allTracks
    .filter((track) => !playlist?.tracks.includes(track._id))
    .filter((track) => {
      if (!searchTerm) return true;
      const album = albumMap.get(track.album_id);
      const trackArtists = track.artist_ids.map((id) => artistMap.get(id)).filter(Boolean);
      const artistNames = trackArtists.map((artist) => artist?.name).join(", ");

      return (
        track.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        album?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        artistNames.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

  const isOwner = playlist.owner_id === currentUser._id;
  const isCollaborator = playlist.collaborators.includes(currentUser._id);
  const canEdit = isOwner || isCollaborator;

  function formatDuration(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  function isTrackLiked(trackId: string): boolean {
    return user?.liked_tracks?.includes(trackId) || false;
  }

  function handleLikeToggle(trackId: string) {
    if (!currentUser) return;
    if (isTrackLiked(trackId)) {
      removeFromLibrary.mutate({ userId: currentUser._id, data: { track_id: trackId } });
    } else {
      addToLibrary.mutate({ userId: currentUser._id, data: { track_id: trackId } });
    }
  }

  const handleUpdate = () => {
    updateMutation.mutate({
      name: editedName,
      description: editedDesc,
      isPublic: editedPublic,
    });
  };

  const startEditing = () => {
    setEditedName(playlist.name);
    setEditedDesc(playlist.description);
    setEditedPublic(playlist.isPublic);
    setIsEditing(true);
  };

  const toggleTrackSelection = (trackId: string) => {
    setSelectedTracks((prev) =>
      prev.includes(trackId) ? prev.filter((id) => id !== trackId) : [...prev, trackId]
    );
  };

  const handleAddTracks = () => {
    if (selectedTracks.length > 0) {
      addTracksMutation.mutate(selectedTracks);
    }
  };

  const handleAddCollaborator = () => {
    if (collaboratorId.trim()) {
      addCollaboratorMutation.mutate(collaboratorId);
    }
  };

  return (
    <div className="space-y-6">
      <Link href="/playlists">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Playlists
        </Button>
      </Link>

      <Card className="!bg-background/10">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label>Playlist Name</Label>
                    <Input
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input
                      value={editedDesc}
                      onChange={(e) => setEditedDesc(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="edit-public"
                      checked={editedPublic}
                      onChange={(e) => setEditedPublic(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="edit-public">Public</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleUpdate} size="sm">
                      Save
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)} size="sm">
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <CardTitle className="text-3xl">{playlist.name}</CardTitle>
                  <CardDescription className="mt-2 text-base">
                    {playlist.description || "No description"}
                  </CardDescription>
                  <div className="flex items-center gap-2 mt-4 flex-wrap">
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
                    {isOwner && <Badge variant="outline">Owner</Badge>}
                    {isCollaborator && !isOwner && <Badge variant="outline">Collaborator</Badge>}
                    <Badge variant="secondary">
                      <Music className="h-3 w-3 mr-1" />
                      {playlist.tracks.length} tracks
                    </Badge>
                  </div>
                </>
              )}
            </div>
            {!isEditing && isOwner && (
              <Button onClick={startEditing} variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="tracks">
        <TabsList className="!bg-background/10">
          <TabsTrigger value="tracks">Tracks</TabsTrigger>
          {isOwner && <TabsTrigger value="collaborators">Collaborators</TabsTrigger>}
        </TabsList>

        <TabsContent value="tracks" className="space-y-4">
          {canEdit && (
            <Button onClick={() => setShowAddTracks(!showAddTracks)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tracks
            </Button>
          )}

          {showAddTracks && (
            <Card className="!bg-background/10">
              <CardHeader>
                <CardTitle>Add Tracks</CardTitle>
                <CardDescription>
                  Select tracks to add to this playlist ({availableTracks.length} available)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Search tracks, albums, or artists..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="h-[400px] overflow-y-auto space-y-2 pr-2">
                  {availableTracks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "No tracks found matching your search" : "No tracks available to add"}
                    </div>
                  ) : (
                    availableTracks.map((track) => {
                      const album = albumMap.get(track.album_id);
                      const trackArtists = track.artist_ids.map((id) => artistMap.get(id)).filter(Boolean);
                      const artistNames = trackArtists.map((artist) => artist?.name).join(", ") || "Unknown Artist";

                      return (
                        <div
                          key={track._id}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedTracks.includes(track._id)
                              ? "bg-primary/20 border-2 border-primary"
                              : "hover:bg-accent border-2 border-transparent"
                          }`}
                          onClick={() => toggleTrackSelection(track._id)}
                        >
                          <input
                            type="checkbox"
                            checked={selectedTracks.includes(track._id)}
                            onChange={() => {}}
                            className="h-4 w-4"
                          />
                          <div className="relative h-12 w-12 rounded overflow-hidden bg-muted flex-shrink-0">
                            {album?.images[0]?.url ? (
                              <Image
                                src={album.images[0].url}
                                alt={album.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="h-full w-full bg-muted flex items-center justify-center">
                                <Music className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate" title={track.name}>{track.name}</div>
                            <div className="text-sm text-muted-foreground truncate" title={artistNames}>
                              {artistNames}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{track.popularity}/100</Badge>
                            <div className="text-sm text-muted-foreground w-12 text-right">
                              {formatDuration(track.duration_ms)}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddTracks} disabled={selectedTracks.length === 0}>
                    Add {selectedTracks.length} track{selectedTracks.length !== 1 ? "s" : ""}
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setShowAddTracks(false);
                    setSelectedTracks([]);
                    setSearchTerm("");
                  }}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="!bg-background/10">
            <CardHeader>
              <CardTitle>Playlist Tracks</CardTitle>
              <CardDescription>
                {playlistTracks?.length || 0} track{(playlistTracks?.length || 0) !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {playlistTracksLoading ? (
                <div className="text-center py-8">
                  <StatifyLoader size="md" className="mx-auto" />
                </div>
              ) : !playlistTracks || playlistTracks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No tracks yet. Add some tracks to get started!
                </div>
              ) : (
                <div className="space-y-2">
                  {playlistTracks.map((track, index) => {
                    // Les données sont déjà populées par le backend
                    const album = typeof track.album_id === 'string'
                      ? albumMap.get(track.album_id)
                      : track.album_id;

                    // artist_ids peut être soit un tableau d'IDs soit un tableau d'objets populés
                    const trackArtists = Array.isArray(track.artist_ids)
                      ? track.artist_ids.map((artistOrId) =>
                          typeof artistOrId === 'string' ? artistMap.get(artistOrId) : artistOrId
                        ).filter(Boolean)
                      : [];
                    const artistNames = trackArtists.map((artist) => artist?.name).join(", ") || "Unknown Artist";

                    return (
                      <div
                        key={track._id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="text-sm text-muted-foreground w-8">{index + 1}</div>
                        <div className="relative h-12 w-12 rounded overflow-hidden bg-muted flex-shrink-0">
                          {album?.images[0]?.url ? (
                            <Image
                              src={album.images[0].url}
                              alt={album.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-muted flex items-center justify-center">
                              <Music className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate" title={track.name}>{track.name}</div>
                          <div className="text-sm text-muted-foreground truncate" title={artistNames}>
                            {artistNames}
                          </div>
                        </div>
                        <Badge variant="outline">{track.popularity}/100</Badge>
                        <div className="text-sm text-muted-foreground w-12 text-right">
                          {formatDuration(track.duration_ms)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleLikeToggle(track._id)}
                            className={isTrackLiked(track._id) ? "text-red-500 hover:text-red-600" : ""}
                          >
                            <Heart className={isTrackLiked(track._id) ? "h-4 w-4 fill-current" : "h-4 w-4"} />
                          </Button>
                          <a
                            href={track.external_urls.spotify}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-accent rounded-md"
                          >
                            <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
                          </a>
                          {canEdit && (
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => removeTracksMutation.mutate([track._id])}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {isOwner && (
          <TabsContent value="collaborators" className="space-y-4">
            <Button onClick={() => setShowAddCollaborator(!showAddCollaborator)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Collaborator
            </Button>

            {showAddCollaborator && (
              <Card>
                <CardHeader>
                  <CardTitle>Add Collaborator</CardTitle>
                  <CardDescription>
                    Enter the user ID of the person you want to add
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>User ID</Label>
                    <Input
                      placeholder="Enter user ID"
                      value={collaboratorId}
                      onChange={(e) => setCollaboratorId(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleAddCollaborator} disabled={!collaboratorId.trim()}>
                      Add
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddCollaborator(false);
                        setCollaboratorId("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Collaborators</CardTitle>
                <CardDescription>
                  {playlist.collaborators.length} collaborator
                  {playlist.collaborators.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {playlist.collaborators.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No collaborators yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {playlist.collaborators.map((userId) => (
                      <div
                        key={userId}
                        className="flex items-center justify-between p-3 rounded-lg bg-accent/50"
                      >
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span className="font-medium">{userId}</span>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeCollaboratorMutation.mutate(userId)}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
