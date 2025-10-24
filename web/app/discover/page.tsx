"use client";

import { useEffect, useState } from "react";
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

  const [activeSection, setActiveSection] = useState(0);

  const addToLibrary = useAddToLibrary();
  const removeFromLibrary = useRemoveFromLibrary();

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push("/auth");
    }
  }, [currentUser, authLoading, router]);

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('[id^="section-"]');
      let maxVisibleArea = 0;
      let currentSection = 0;
      let fullyVisibleSection = -1;

      sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const sectionHeight = rect.height;

        // Calculate how much of this section is visible
        const visibleTop = Math.max(0, rect.top);
        const visibleBottom = Math.min(viewportHeight, rect.bottom);
        const visibleHeight = Math.max(0, visibleBottom - visibleTop);

        // Calculate visible area (visible height as percentage of viewport)
        const visibleArea = visibleHeight / viewportHeight;

        // Check if section is 100% visible (entire section fits in viewport)
        const isFullyVisible = rect.top >= 0 && rect.bottom <= viewportHeight;

        // Priority: If a section is 100% visible, prefer it
        if (isFullyVisible) {
          fullyVisibleSection = index;
        }

        // Otherwise, track section with most visible area
        if (visibleArea > maxVisibleArea) {
          maxVisibleArea = visibleArea;
          currentSection = index;
        }
      });

      // If we found a fully visible section, use it. Otherwise use the one with most visible area
      setActiveSection(fullyVisibleSection >= 0 ? fullyVisibleSection : currentSection);
    };

    handleScroll(); // Run on mount
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
          <Music className="w-12 h-12 animate-spin mx-auto mb-4 text-green-500" />
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
          <Sparkles className="w-12 h-12 animate-pulse mx-auto mb-4 text-green-500" />
          <p className="text-gray-400">Analyse de vos goûts musicaux...</p>
        </div>
      </div>
    );
  }

  const recommendations = recommendationsData?.sections || [];

  const scrollToSection = (index: number) => {
    const element = document.getElementById(`section-${index}`);
    if (element) {
      const offset = 100; // Offset for sticky header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen pb-12 sm:pb-16">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Découvrir</h1>
        </div>
        <p className="text-gray-400 text-sm sm:text-base">
          Recommandations personnalisées basées sur vos goûts musicaux
        </p>
      </div>

      {/* Floating Navigation Menu */}
      {recommendations.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1rem)] max-w-[95vw] sm:w-auto sm:max-w-4xl">
          <div className="bg-background/95 backdrop-blur-md border border-border rounded-full shadow-lg px-2 sm:px-4 py-1.5 sm:py-2">
            <div className="flex items-center justify-start sm:justify-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-hide">
              {recommendations.map((section, idx) => {
                const IconComponent = iconMap[section.icon] || Sparkles;
                const isActive = activeSection === idx;
                return (
                  <Button
                    key={idx}
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    onClick={() => scrollToSection(idx)}
                    className="flex items-center gap-1 sm:gap-1.5 whitespace-nowrap flex-shrink-0 rounded-full h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
                  >
                    <IconComponent className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                    <span className="hidden md:inline max-w-[120px] truncate">{section.title}</span>
                    {section.items.length > 0 && (
                      <Badge variant="secondary" className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0 h-3.5 sm:h-4 flex-shrink-0">
                        {section.items.length}
                      </Badge>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
        <div className="space-y-8 sm:space-y-12">
          {recommendations.map((section, idx) => {
            const IconComponent = iconMap[section.icon] || Sparkles;

            return (
              <div key={idx} id={`section-${idx}`} className="scroll-mt-24">
                <div className="flex items-center gap-2 sm:gap-3 mb-4">
                  <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0" />
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold">{section.title}</h2>
                    <p className="text-xs sm:text-sm text-gray-400">{section.description}</p>
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
                                <div className="w-full h-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
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
                                <div className="w-full h-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {section.items.map((item) => {
                      const track = item as Track;
                      const album = typeof track.album_id === 'object' ? track.album_id : null;

                      return (
                        <Card key={track._id} className="!bg-background/10 hover:border-green-500 transition-all duration-200 overflow-hidden">
                          <div className="flex items-center gap-2 p-1">
                            <div className="relative w-14 h-14 rounded overflow-hidden flex-shrink-0">
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
                              <div className="flex items-center gap-1.5">
                                <h3 className="font-semibold line-clamp-1 text-base">{track.name}</h3>
                                {track.explicit && (
                                  <Badge variant="secondary" className="text-[10px] py-0 px-1 h-4">E</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-[11px] py-0 px-2 h-5">{track.popularity}</Badge>
                                <span className="text-xs text-gray-400">
                                  {formatDuration(track.duration_ms)}
                                </span>
                              </div>
                            </div>

                            <Button
                              size="sm"
                              variant={isLiked(track._id, 'track') ? "default" : "ghost"}
                              onClick={() => handleToggleLike(track._id, 'track')}
                              className="h-9 w-9 p-0 flex-shrink-0"
                            >
                              <Heart className={`w-4 h-4 ${isLiked(track._id, 'track') ? 'fill-current' : ''}`} />
                            </Button>
                          </div>
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
