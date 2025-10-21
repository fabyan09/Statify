"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useRecommendations, useAddToLibrary, useRemoveFromLibrary, useUser } from "@/lib/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Music, Sparkles, TrendingUp, Clock, Tag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  'sparkles': Sparkles,
  'tag': Tag,
  'clock': Clock,
  'music': Music,
  'trending-up': TrendingUp,
};

interface Artist {
  _id: string;
  name: string;
  popularity: number;
  followers: number;
  genres: string[];
  images: { url: string; height: number; width: number }[];
  external_urls: { spotify: string };
}

interface Album {
  _id: string;
  name: string;
  album_type: string;
  release_date: string;
  popularity: number;
  images: { url: string; height: number; width: number }[];
  label: string;
  artist_ids: string[];
  genres: string[];
  external_urls: { spotify: string };
}

interface Track {
  _id: string;
  name: string;
  popularity: number;
  duration_ms: number;
  explicit: boolean;
  album_id: string | Album; // Peut être un ID ou un objet Album populé
  artist_ids: string[];
  external_urls: { spotify: string };
  preview_url: string;
}

export default function DiscoverPage() {
  const router = useRouter();
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const { data: user, isLoading: userLoading } = useUser(currentUser?._id || "");
  const { data: recommendationsData, isLoading: recommendationsLoading } = useRecommendations(currentUser?._id || "");

  const addToLibrary = useAddToLibrary();
  const removeFromLibrary = useRemoveFromLibrary();

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push("/auth");
    }
  }, [currentUser, authLoading, router]);

  const handleToggleLike = async (itemId: string, itemType: 'track' | 'album' | 'artist') => {
    if (!currentUser) return;

    const isLiked = itemType === 'track'
      ? user?.liked_tracks?.includes(itemId)
      : itemType === 'album'
      ? user?.liked_albums?.includes(itemId)
      : user?.favorite_artists?.includes(itemId);

    if (isLiked) {
      removeFromLibrary.mutate({
        userId: currentUser._id,
        data: { [`${itemType}_id`]: itemId }
      });
    } else {
      addToLibrary.mutate({
        userId: currentUser._id,
        data: { [`${itemType}_id`]: itemId }
      });
    }
  };

  const isLiked = (itemId: string, itemType: 'track' | 'album' | 'artist') => {
    if (!user) return false;
    return itemType === 'track'
      ? user.liked_tracks?.includes(itemId)
      : itemType === 'album'
      ? user.liked_albums?.includes(itemId)
      : user.favorite_artists?.includes(itemId);
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Music className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-500" />
          <p className="text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  if (userLoading || recommendationsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Sparkles className="w-12 h-12 animate-pulse mx-auto mb-4 text-purple-500" />
          <p className="text-gray-400">Analyse de vos goûts musicaux...</p>
        </div>
      </div>
    );
  }

  const recommendations = recommendationsData?.sections || [];

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-8 h-8 text-purple-500" />
          <h1 className="text-4xl font-bold">Découvrir</h1>
        </div>
        <p className="text-gray-400">
          Recommandations personnalisées basées sur vos goûts musicaux
        </p>
      </div>

      {/* Sections de recommandations */}
      {recommendations.length === 0 ? (
        <Card className="!bg-background/10">
          <CardContent className="py-12 text-center">
            <Heart className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-xl font-semibold mb-2">Commencez à explorer</h3>
            <p className="text-gray-400 mb-4">
              Likez des artistes, albums et titres pour recevoir des recommandations personnalisées
            </p>
            <Button asChild>
              <Link href="/library">Voir ma bibliothèque</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-12">
          {recommendations.map((section, idx) => {
            const IconComponent = iconMap[section.icon] || Sparkles;

            return (
              <div key={idx}>
                <div className="flex items-center gap-3 mb-4">
                  <IconComponent className="w-6 h-6 text-purple-500" />
                  <div>
                    <h2 className="text-2xl font-bold">{section.title}</h2>
                    <p className="text-sm text-gray-400">{section.description}</p>
                  </div>
                </div>

                {/* ARTISTES */}
                {section.type === 'artist' && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {section.items.map((item) => {
                      const artist = item as Artist;
                      return (
                        <Card key={artist._id} className="!bg-background/10 overflow-hidden hover:border-green-500 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                          <CardContent className="p-4">
                            <div className="relative w-full aspect-square rounded-full overflow-hidden mb-3">
                              {artist.images?.[0]?.url ? (
                                <Image
                                  src={artist.images[0].url}
                                  alt={artist.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                  <Music className="w-12 h-12 text-white" />
                                </div>
                              )}
                            </div>
                            <Link href={`/artists/${artist._id}`}>
                              <h3 className="font-semibold mb-1 hover:text-green-500 transition-colors line-clamp-1">
                                {artist.name}
                              </h3>
                            </Link>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {artist.genres.slice(0, 2).map((genre, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {genre}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex items-center justify-between">
                              <Badge variant="outline">{artist.popularity}</Badge>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant={isLiked(artist._id, 'artist') ? "default" : "outline"}
                                  onClick={() => handleToggleLike(artist._id, 'artist')}
                                >
                                  <Heart className={`w-4 h-4 ${isLiked(artist._id, 'artist') ? 'fill-current' : ''}`} />
                                </Button>
                                <Button size="sm" variant="outline" asChild>
                                  <a href={artist.external_urls.spotify} target="_blank" rel="noopener noreferrer">
                                    <Music className="w-4 h-4" />
                                  </a>
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {/* ALBUMS */}
                {section.type === 'album' && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {section.items.map((item) => {
                      const album = item as Album;

                      return (
                        <Card key={album._id} className="!bg-background/10 overflow-hidden hover:border-green-500 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                          <CardContent className="p-4">
                            <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-3">
                              {album.images?.[0]?.url ? (
                                <Image
                                  src={album.images[0].url}
                                  alt={album.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                                  <Music className="w-12 h-12 text-white" />
                                </div>
                              )}
                            </div>
                            <Link href={`/albums/${album._id}`}>
                              <h3 className="font-semibold mb-1 hover:text-green-500 transition-colors line-clamp-1">
                                {album.name}
                              </h3>
                            </Link>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary" className="text-xs">
                                {album.album_type}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {new Date(album.release_date).getFullYear()}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <Badge variant="outline">{album.popularity}</Badge>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant={isLiked(album._id, 'album') ? "default" : "outline"}
                                  onClick={() => handleToggleLike(album._id, 'album')}
                                >
                                  <Heart className={`w-4 h-4 ${isLiked(album._id, 'album') ? 'fill-current' : ''}`} />
                                </Button>
                                <Button size="sm" variant="outline" asChild>
                                  <a href={album.external_urls.spotify} target="_blank" rel="noopener noreferrer">
                                    <Music className="w-4 h-4" />
                                  </a>
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {/* TRACKS */}
                {section.type === 'track' && (
                  <div className="space-y-2">
                    {section.items.map((item) => {
                      const track = item as Track;
                      const album = typeof track.album_id === 'object' ? track.album_id : null;

                      return (
                        <Card key={track._id} className="!bg-background/10 hover:border-green-500 hover:shadow-md transition-all duration-300">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0">
                                {album?.images?.[0]?.url ? (
                                  <Image
                                    src={album.images[0].url}
                                    alt={album.name}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                    <Music className="w-6 h-6 text-white" />
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold line-clamp-1">{track.name}</h3>
                                  {track.explicit && (
                                    <Badge variant="secondary" className="text-xs">E</Badge>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-3 flex-shrink-0">
                                <span className="text-sm text-gray-400">
                                  {formatDuration(track.duration_ms)}
                                </span>
                                <Badge variant="outline">{track.popularity}</Badge>
                                <Button
                                  size="sm"
                                  variant={isLiked(track._id, 'track') ? "default" : "outline"}
                                  onClick={() => handleToggleLike(track._id, 'track')}
                                >
                                  <Heart className={`w-4 h-4 ${isLiked(track._id, 'track') ? 'fill-current' : ''}`} />
                                </Button>
                                {track.preview_url && (
                                  <Button size="sm" variant="outline" asChild>
                                    <a href={track.preview_url} target="_blank" rel="noopener noreferrer">
                                      <Music className="w-4 h-4" />
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
