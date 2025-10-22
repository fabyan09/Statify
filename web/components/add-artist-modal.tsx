"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Check, ExternalLink, Users } from "lucide-react";
import { useSearchSpotifyArtists, useAddArtistFromSpotify, useSyncArtistAlbums } from "@/lib/hooks";
import { useDebounce } from "@/lib/useDebounce";
import Image from "next/image";
import { SpotifyArtistSearchResult } from "@/lib/api";

interface AddArtistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuery?: string;
}

export function AddArtistModal({ open, onOpenChange, initialQuery = "" }: AddArtistModalProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [processingArtistId, setProcessingArtistId] = useState<string | null>(null);
  const debouncedQuery = useDebounce(searchQuery, 500);

  // Mettre à jour le searchQuery quand initialQuery change ou quand le modal s'ouvre
  useEffect(() => {
    if (open && initialQuery) {
      setSearchQuery(initialQuery);
    }
  }, [open, initialQuery]);

  const { data: artists, isLoading } = useSearchSpotifyArtists(debouncedQuery);
  const addArtist = useAddArtistFromSpotify();
  const syncArtist = useSyncArtistAlbums();

  const handleAddArtist = async (artist: SpotifyArtistSearchResult) => {
    setProcessingArtistId(artist.spotifyId);

    try {
      if (artist.isOnStatify) {
        // L'artiste est déjà sur Statify, on le synchronise
        if (artist.statifyId) {
          await syncArtist.mutateAsync(artist.statifyId);
        }
      } else {
        // L'artiste n'est pas sur Statify, on l'ajoute et on le synchronise
        const addedArtist = await addArtist.mutateAsync(artist.spotifyId);
        if (addedArtist._id) {
          await syncArtist.mutateAsync(addedArtist._id);
        }
      }
    } catch (error) {
      console.error("Failed to add/sync artist:", error);
    } finally {
      setProcessingArtistId(null);
    }
  };

  const isProcessing = (spotifyId: string) => {
    return processingArtistId === spotifyId;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Ajouter un artiste depuis Spotify</DialogTitle>
          <DialogDescription>
            Recherchez un artiste sur Spotify et ajoutez-le à Statify
          </DialogDescription>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un artiste sur Spotify..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          {isLoading && debouncedQuery && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {!debouncedQuery && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground">
                Commencez à taper pour rechercher un artiste
              </p>
            </div>
          )}

          {debouncedQuery && !isLoading && artists && artists.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground">
                Aucun artiste trouvé pour &quot;{debouncedQuery}&quot;
              </p>
            </div>
          )}

          {artists && artists.map((artist) => (
            <div
              key={artist.spotifyId}
              className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="relative h-16 w-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
                {artist.images[0]?.url ? (
                  <Image
                    src={artist.images[0].url}
                    alt={artist.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{artist.name}</h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  {artist.genres.slice(0, 3).map((genre) => (
                    <Badge key={genre} variant="secondary" className="text-xs">
                      {genre}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                  <span>{artist.followers.toLocaleString()} followers</span>
                  <span>Popularité: {artist.popularity}/100</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {artist.isOnStatify && (
                  <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                    <Check className="h-3 w-3 mr-1" />
                    Sur Statify
                  </Badge>
                )}

                <a
                  href={artist.external_urls.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-accent rounded-md"
                >
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>

                <Button
                  size="sm"
                  onClick={() => handleAddArtist(artist)}
                  disabled={isProcessing(artist.spotifyId)}
                  variant={artist.isOnStatify ? "outline" : "default"}
                >
                  {isProcessing(artist.spotifyId) ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-2"></div>
                      {artist.isOnStatify ? "Sync..." : "Ajout..."}
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-1" />
                      {artist.isOnStatify ? "Synchroniser" : "Ajouter"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
