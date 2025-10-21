"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useArtists, useAlbums, useTracks, useUser, useAddToLibrary, useRemoveFromLibrary } from "@/lib/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Music, Sparkles, TrendingUp, Clock, Tag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { User } from "@/lib/api";

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
  album_id: string;
  artist_ids: string[];
  external_urls: { spotify: string };
  preview_url: string;
}

interface RecommendationSection {
  title: string;
  description: string;
  icon: React.ElementType;
  items: (Artist | Album | Track)[];
  type: 'artist' | 'album' | 'track';
}

export default function DiscoverPage() {
  const router = useRouter();
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const { data: user, isLoading: userLoading } = useUser(currentUser?._id || "");
  const { data: artists = [], isLoading: artistsLoading } = useArtists();
  const { data: albums = [], isLoading: albumsLoading } = useAlbums();
  const { data: tracksData, isLoading: tracksLoading } = useTracks();

  const addToLibrary = useAddToLibrary();
  const removeFromLibrary = useRemoveFromLibrary();

  const [recommendations, setRecommendations] = useState<RecommendationSection[]>([]);

  useEffect(() => {
    // Ne rediriger que si l'auth est chargée ET qu'il n'y a pas d'utilisateur
    if (!authLoading && !currentUser) {
      router.push("/auth");
    }
  }, [currentUser, authLoading, router]);

  useEffect(() => {
    if (!user || !artists.length || !albums.length || !tracksData?.data?.length) {
      return;
    }

    const tracks = tracksData.data;
    const recs = generateRecommendations(user, artists, albums, tracks);
    setRecommendations(recs);
  }, [user, artists, albums, tracksData]);

  const generateRecommendations = (
    user: User,
    allArtists: Artist[],
    allAlbums: Album[],
    allTracks: Track[]
  ): RecommendationSection[] => {
    const sections: RecommendationSection[] = [];

    // Créer des maps pour un accès rapide
    const artistMap = new Map(allArtists.map(a => [a._id, a]));
    const albumMap = new Map(allAlbums.map(a => [a._id, a]));

    // Initialiser les tableaux s'ils sont undefined
    const userFavoriteArtists = user.favorite_artists || [];
    const userLikedAlbums = user.liked_albums || [];
    const userLikedTracks = user.liked_tracks || [];

    console.log('🔍 User preferences:', {
      favorite_artists: userFavoriteArtists.length,
      liked_albums: userLikedAlbums.length,
      liked_tracks: userLikedTracks.length,
    });

    // Vérifier si l'utilisateur a des préférences
    const hasPreferences = userFavoriteArtists.length > 0 ||
                          userLikedAlbums.length > 0 ||
                          userLikedTracks.length > 0;

    // Récupérer les genres favoris de l'utilisateur
    const favoriteGenres = new Map<string, number>();
    userFavoriteArtists.forEach((artistId: string) => {
      const artist = artistMap.get(artistId);
      if (artist?.genres) {
        artist.genres.forEach(genre => {
          favoriteGenres.set(genre, (favoriteGenres.get(genre) || 0) + 1);
        });
      }
    });

    // Ajouter aussi les genres des albums likés
    userLikedAlbums.forEach((albumId: string) => {
      const album = albumMap.get(albumId);
      if (album?.genres) {
        album.genres.forEach(genre => {
          favoriteGenres.set(genre, (favoriteGenres.get(genre) || 0) + 1);
        });
      }
    });

    console.log('🎵 Favorite genres:', Array.from(favoriteGenres.entries()));

    // Récupérer les labels favoris
    const favoriteLabels = new Map<string, number>();
    userLikedAlbums.forEach((albumId: string) => {
      const album = albumMap.get(albumId);
      if (album?.label) {
        favoriteLabels.set(album.label, (favoriteLabels.get(album.label) || 0) + 1);
      }
    });

    // Récupérer les artistes des tracks likés pour comprendre les préférences
    const likedTrackArtists = new Set<string>();
    userLikedTracks.forEach((trackId: string) => {
      const track = allTracks.find(t => t._id === trackId);
      if (track?.artist_ids) {
        track.artist_ids.forEach(id => likedTrackArtists.add(id));
        // Ajouter aussi les genres de ces artistes
        track.artist_ids.forEach(id => {
          const artist = artistMap.get(id);
          if (artist?.genres) {
            artist.genres.forEach(genre => {
              favoriteGenres.set(genre, (favoriteGenres.get(genre) || 0) + 1);
            });
          }
        });
      }
    });

    // 1. ARTISTES SIMILAIRES PAR GENRE (si l'utilisateur a des préférences)
    if (favoriteGenres.size > 0) {
      const similarArtistsByGenre = allArtists
        .filter(artist =>
          !userFavoriteArtists.includes(artist._id) && // Pas déjà dans les favoris
          artist.genres.some(genre => favoriteGenres.has(genre)) // Partage au moins un genre
        )
        .map(artist => ({
          ...artist,
          score: artist.genres.reduce((sum, genre) =>
            sum + (favoriteGenres.get(genre) || 0) * artist.popularity / 100, 0
          )
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);

      if (similarArtistsByGenre.length > 0) {
        sections.push({
          title: "Artistes recommandés pour vous",
          description: "Basé sur vos genres préférés",
          icon: Sparkles,
          items: similarArtistsByGenre,
          type: 'artist'
        });
      }
    }

    // 2. ALBUMS DU MÊME LABEL (si l'utilisateur a des préférences)
    if (favoriteLabels.size > 0) {
      const topLabels = Array.from(favoriteLabels.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([label]) => label);

      const albumsFromFavoriteLabels = allAlbums
        .filter(album =>
          topLabels.includes(album.label) &&
          !userLikedAlbums.includes(album._id)
        )
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 8);

      if (albumsFromFavoriteLabels.length > 0) {
        sections.push({
          title: `Albums de vos labels préférés`,
          description: topLabels.join(", "),
          icon: Tag,
          items: albumsFromFavoriteLabels,
          type: 'album'
        });
      }
    }

    // 3. NOUVEAUTÉS DANS VOS GENRES (ou toutes les nouveautés si pas de préférences)
    const currentYear = new Date().getFullYear();
    const recentYears = [currentYear, currentYear - 1, currentYear - 2];

    if (favoriteGenres.size > 0) {
      const recentAlbumsInFavoriteGenres = allAlbums
        .filter(album => {
          const releaseYear = new Date(album.release_date).getFullYear();
          return recentYears.includes(releaseYear) &&
            !userLikedAlbums.includes(album._id) &&
            album.genres.some(genre => favoriteGenres.has(genre));
        })
        .sort((a, b) => {
          const dateA = new Date(a.release_date).getTime();
          const dateB = new Date(b.release_date).getTime();
          return dateB - dateA;
        })
        .slice(0, 8);

      if (recentAlbumsInFavoriteGenres.length > 0) {
        sections.push({
          title: "Nouveautés pour vous",
          description: "Sorties récentes dans vos genres favoris",
          icon: Clock,
          items: recentAlbumsInFavoriteGenres,
          type: 'album'
        });
      }
    } else {
      // Si pas de préférences, montrer toutes les nouveautés populaires
      const recentPopularAlbums = allAlbums
        .filter(album => {
          const releaseYear = new Date(album.release_date).getFullYear();
          return recentYears.includes(releaseYear) && album.popularity >= 50;
        })
        .sort((a, b) => {
          const dateA = new Date(a.release_date).getTime();
          const dateB = new Date(b.release_date).getTime();
          return dateB - dateA;
        })
        .slice(0, 8);

      if (recentPopularAlbums.length > 0) {
        sections.push({
          title: "Nouveautés populaires",
          description: "Les sorties récentes les plus écoutées",
          icon: Clock,
          items: recentPopularAlbums,
          type: 'album'
        });
      }
    }

    // 4. TRACKS POPULAIRES D'ARTISTES SIMILAIRES (si préférences)
    if (favoriteGenres.size > 0) {
      const tracksFromSimilarArtists = allTracks
        .filter(track => {
          const trackArtistGenres = track.artist_ids
            .map(id => artistMap.get(id))
            .filter((artist): artist is Artist => artist !== undefined)
            .flatMap(artist => artist.genres);

          return !userLikedTracks.includes(track._id) &&
            trackArtistGenres.some(genre => favoriteGenres.has(genre));
        })
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 10);

      if (tracksFromSimilarArtists.length > 0) {
        sections.push({
          title: "Titres qui pourraient vous plaire",
          description: "Des hits dans vos genres préférés",
          icon: Music,
          items: tracksFromSimilarArtists,
          type: 'track'
        });
      }
    }

    // 5. TENDANCES (basé sur popularité globale, toujours affiché)
    const trendingTracks = allTracks
      .filter(track =>
        !userLikedTracks.includes(track._id) &&
        track.popularity >= 70
      )
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 10);

    console.log('🔥 Trending tracks:', {
      found: trendingTracks.length,
      totalTracks: allTracks.length,
      popularityRange: [
        Math.min(...allTracks.map(t => t.popularity)),
        Math.max(...allTracks.map(t => t.popularity))
      ]
    });

    if (trendingTracks.length > 0) {
      sections.push({
        title: "Tendances actuelles",
        description: "Les titres les plus populaires du moment",
        icon: TrendingUp,
        items: trendingTracks,
        type: 'track'
      });
    }

    // 5b. ARTISTES POPULAIRES (si pas de préférences ou complément)
    if (!hasPreferences || sections.length < 3) {
      const popularArtists = allArtists
        .filter(artist => !userFavoriteArtists.includes(artist._id))
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 8);

      if (popularArtists.length > 0) {
        sections.push({
          title: hasPreferences ? "Artistes populaires" : "Artistes les plus écoutés",
          description: "Découvrez les artistes du moment",
          icon: TrendingUp,
          items: popularArtists,
          type: 'artist'
        });
      }
    }

    // 6. DÉCOUVERTES PAR DÉCENNIE (basé sur les années des albums likés)
    if (userLikedAlbums.length > 0) {
      const likedAlbumYears = userLikedAlbums
        .map((albumId: string) => albumMap.get(albumId))
        .filter((album): album is Album => album !== undefined)
        .map((album) => new Date(album.release_date).getFullYear())
        .filter((year) => !isNaN(year));

      if (likedAlbumYears.length > 0) {
        const avgYear = Math.floor(
          likedAlbumYears.reduce((sum: number, year: number) => sum + year, 0) / likedAlbumYears.length
        );
        const decade = Math.floor(avgYear / 10) * 10;

        const albumsFromFavoriteDecade = allAlbums
          .filter(album => {
            const year = new Date(album.release_date).getFullYear();
            return year >= decade && year < decade + 10 &&
              !userLikedAlbums.includes(album._id);
          })
          .sort((a, b) => b.popularity - a.popularity)
          .slice(0, 8);

        if (albumsFromFavoriteDecade.length > 0) {
          sections.push({
            title: `Classiques des années ${decade}`,
            description: "Basé sur vos préférences temporelles",
            icon: Clock,
            items: albumsFromFavoriteDecade,
            type: 'album'
          });
        }
      }
    }

    // 7. EXPLORATION PAR GENRE (si pas assez de sections)
    if (sections.length < 2) {
      // Récupérer tous les genres uniques
      const allGenres = new Set<string>();
      allArtists.forEach(artist => {
        artist.genres.forEach(genre => allGenres.add(genre));
      });

      // Prendre un genre au hasard et afficher des artistes de ce genre
      const genresArray = Array.from(allGenres);
      if (genresArray.length > 0) {
        const randomGenre = genresArray[Math.floor(Math.random() * genresArray.length)];
        const artistsInGenre = allArtists
          .filter(artist => artist.genres.includes(randomGenre))
          .sort((a, b) => b.popularity - a.popularity)
          .slice(0, 8);

        if (artistsInGenre.length > 0) {
          sections.push({
            title: `Explorer le ${randomGenre}`,
            description: "Une sélection d'artistes dans ce genre",
            icon: Sparkles,
            items: artistsInGenre,
            type: 'artist'
          });
        }
      }
    }

    console.log('✅ Sections generated:', sections.length, sections.map(s => ({ title: s.title, items: s.items.length })));
    return sections;
  };

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

  // État de chargement initial de l'auth
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

  // Si pas d'utilisateur après chargement, on ne rend rien (redirection en cours)
  if (!currentUser) {
    return null;
  }

  // Chargement des données utilisateur
  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Music className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-500" />
          <p className="text-gray-400">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  if (artistsLoading || albumsLoading || tracksLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Sparkles className="w-12 h-12 animate-pulse mx-auto mb-4 text-purple-500" />
          <p className="text-gray-400">Analyse de vos goûts musicaux...</p>
        </div>
      </div>
    );
  }

  const artistMap = new Map(artists.map((a: Artist) => [a._id, a]));
  const albumMap = new Map(albums.map((a: Album) => [a._id, a]));

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
          {recommendations.map((section, idx) => (
            <div key={idx}>
              <div className="flex items-center gap-3 mb-4">
                <section.icon className="w-6 h-6 text-purple-500" />
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
                      <Card key={artist._id} className="!bg-background/10 overflow-hidden hover:border-purple-500 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
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
                            <h3 className="font-semibold mb-1 hover:text-purple-500 transition-colors line-clamp-1">
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
                    const albumArtists = album.artist_ids
                      .map(id => artistMap.get(id))
                      .filter((artist): artist is Artist => artist !== undefined);

                    return (
                      <Card key={album._id} className="!bg-background/10 overflow-hidden hover:border-purple-500 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
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
                            <h3 className="font-semibold mb-1 hover:text-purple-500 transition-colors line-clamp-1">
                              {album.name}
                            </h3>
                          </Link>
                          <p className="text-sm text-gray-400 mb-2 line-clamp-1">
                            {albumArtists.map((a: Artist) => a.name).join(", ")}
                          </p>
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
                    const trackAlbum = albumMap.get(track.album_id);
                    const trackArtists = track.artist_ids
                      .map(id => artistMap.get(id))
                      .filter((artist): artist is Artist => artist !== undefined);

                    return (
                      <Card key={track._id} className="!bg-background/10 hover:border-purple-500 hover:shadow-md transition-all duration-300">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            {/* Album Art */}
                            <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0">
                              {trackAlbum?.images?.[0]?.url ? (
                                <Image
                                  src={trackAlbum.images[0].url}
                                  alt={trackAlbum.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                  <Music className="w-6 h-6 text-white" />
                                </div>
                              )}
                            </div>

                            {/* Track Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold line-clamp-1">{track.name}</h3>
                                {track.explicit && (
                                  <Badge variant="secondary" className="text-xs">E</Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-400 line-clamp-1">
                                {trackArtists.map((a: Artist) => a.name).join(", ")}
                              </p>
                              {trackAlbum && (
                                <p className="text-xs text-gray-500 line-clamp-1">
                                  {trackAlbum.name}
                                </p>
                              )}
                            </div>

                            {/* Actions */}
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
          ))}
        </div>
      )}
    </div>
  );
}
