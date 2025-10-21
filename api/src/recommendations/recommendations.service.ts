import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/entities/user.entity';
import { Artist } from '../artists/entities/artist.entity';
import { Album } from '../albums/entities/album.entity';
import { Track } from '../tracks/entities/track.entity';
import { RecommendationSectionDto, RecommendationsResponseDto } from './dto/recommendation-section.dto';

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);
  private readonly CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 heures

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Artist.name) private artistModel: Model<Artist>,
    @InjectModel(Album.name) private albumModel: Model<Album>,
    @InjectModel(Track.name) private trackModel: Model<Track>,
  ) {}

  async getRecommendations(userId: string): Promise<RecommendationsResponseDto> {
    this.logger.log(`Getting recommendations for user ${userId}`);

    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Vérifier si les recommandations existent et sont fraîches
    const now = new Date();
    const hasRecommendations = user.recommendations && user.recommendations.sections;
    const isFresh = hasRecommendations &&
      user.recommendations &&
      user.recommendations.lastUpdated &&
      (now.getTime() - new Date(user.recommendations.lastUpdated).getTime()) < this.CACHE_DURATION_MS;

    if (isFresh && user.recommendations) {
      this.logger.log(`Returning cached recommendations for user ${userId}`);
      // Populate les recommandations avec les objets complets
      return this.populateRecommendations(user.recommendations.sections);
    }

    // Sinon, calculer de nouvelles recommandations
    this.logger.log(`Computing new recommendations for user ${userId}`);
    const sections = await this.computeRecommendations(user);

    // Extraire seulement les IDs pour le stockage
    const sectionsWithIds = sections.map(section => ({
      title: section.title,
      description: section.description,
      icon: section.icon,
      type: section.type,
      itemIds: section.items.map(item => item._id),
    }));

    // Sauvegarder les recommandations en DB (avec IDs seulement)
    await this.userModel.findByIdAndUpdate(userId, {
      recommendations: {
        sections: sectionsWithIds,
        lastUpdated: now,
      },
    }).exec();

    this.logger.log(`Recommendations saved for user ${userId}`);
    return { sections };
  }

  private async populateRecommendations(sections: any[]): Promise<RecommendationsResponseDto> {
    const populatedSections = await Promise.all(
      sections.map(async (section) => {
        let items: any[] = [];

        if (section.type === 'artist') {
          items = await this.artistModel.find({ _id: { $in: section.itemIds } }).exec();
        } else if (section.type === 'album') {
          items = await this.albumModel.find({ _id: { $in: section.itemIds } }).exec();
        } else if (section.type === 'track') {
          items = await this.trackModel
            .find({ _id: { $in: section.itemIds } })
            .populate('album_id')
            .exec();
        }

        return {
          title: section.title,
          description: section.description,
          icon: section.icon,
          type: section.type,
          items,
        };
      })
    );

    return { sections: populatedSections };
  }

  private async computeRecommendations(user: User): Promise<RecommendationSectionDto[]> {
    const sections: RecommendationSectionDto[] = [];

    // Créer des maps pour les genres et labels favoris
    const favoriteGenres = new Map<string, number>();
    const favoriteLabels = new Map<string, number>();

    // 1. Analyser les artistes favoris
    if (user.favorite_artists.length > 0) {
      const favoriteArtistsData = await this.artistModel
        .find({ _id: { $in: user.favorite_artists } })
        .exec();

      favoriteArtistsData.forEach(artist => {
        artist.genres?.forEach(genre => {
          favoriteGenres.set(genre, (favoriteGenres.get(genre) || 0) + 1);
        });
      });
    }

    // 2. Analyser les albums likés
    if (user.liked_albums.length > 0) {
      const likedAlbumsData = await this.albumModel
        .find({ _id: { $in: user.liked_albums } })
        .exec();

      likedAlbumsData.forEach(album => {
        album.genres?.forEach(genre => {
          favoriteGenres.set(genre, (favoriteGenres.get(genre) || 0) + 1);
        });
        if (album.label) {
          favoriteLabels.set(album.label, (favoriteLabels.get(album.label) || 0) + 1);
        }
      });
    }

    // 3. Analyser les tracks likés
    if (user.liked_tracks.length > 0) {
      const likedTracksData = await this.trackModel
        .find({ _id: { $in: user.liked_tracks } })
        .exec();

      const trackArtistIds = [...new Set(likedTracksData.flatMap(t => t.artist_ids))];
      const trackArtists = await this.artistModel
        .find({ _id: { $in: trackArtistIds } })
        .exec();

      trackArtists.forEach(artist => {
        artist.genres?.forEach(genre => {
          favoriteGenres.set(genre, (favoriteGenres.get(genre) || 0) + 1);
        });
      });
    }

    const hasPreferences = favoriteGenres.size > 0 || favoriteLabels.size > 0;

    // SECTION 1: Artistes similaires par genre
    if (favoriteGenres.size > 0) {
      const genresArray = Array.from(favoriteGenres.keys());
      const similarArtists = await this.artistModel
        .find({
          _id: { $nin: user.favorite_artists },
          genres: { $in: genresArray },
        })
        .sort({ popularity: -1 })
        .limit(8)
        .exec();

      if (similarArtists.length > 0) {
        sections.push({
          title: 'Artistes recommandés pour vous',
          description: 'Basé sur vos genres préférés',
          icon: 'sparkles',
          type: 'artist',
          items: similarArtists,
        });
      }
    }

    // SECTION 2: Albums des labels favoris
    if (favoriteLabels.size > 0) {
      const topLabels = Array.from(favoriteLabels.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([label]) => label);

      const albumsFromLabels = await this.albumModel
        .find({
          label: { $in: topLabels },
          _id: { $nin: user.liked_albums },
        })
        .sort({ popularity: -1 })
        .limit(8)
        .exec();

      if (albumsFromLabels.length > 0) {
        sections.push({
          title: 'Albums de vos labels préférés',
          description: topLabels.join(', '),
          icon: 'tag',
          type: 'album',
          items: albumsFromLabels,
        });
      }
    }

    // SECTION 3: Nouveautés dans vos genres
    const currentYear = new Date().getFullYear();
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(currentYear - 2);

    if (favoriteGenres.size > 0) {
      const genresArray = Array.from(favoriteGenres.keys());
      const recentAlbums = await this.albumModel
        .find({
          _id: { $nin: user.liked_albums },
          genres: { $in: genresArray },
          release_date: { $gte: twoYearsAgo.toISOString() },
        })
        .sort({ release_date: -1 })
        .limit(8)
        .exec();

      if (recentAlbums.length > 0) {
        sections.push({
          title: 'Nouveautés pour vous',
          description: 'Sorties récentes dans vos genres favoris',
          icon: 'clock',
          type: 'album',
          items: recentAlbums,
        });
      }
    } else {
      // Si pas de préférences, montrer toutes les nouveautés populaires
      const recentPopular = await this.albumModel
        .find({
          release_date: { $gte: twoYearsAgo.toISOString() },
          popularity: { $gte: 50 },
        })
        .sort({ release_date: -1 })
        .limit(8)
        .exec();

      if (recentPopular.length > 0) {
        sections.push({
          title: 'Nouveautés populaires',
          description: 'Les sorties récentes les plus écoutées',
          icon: 'clock',
          type: 'album',
          items: recentPopular,
        });
      }
    }

    // SECTION 4: Tracks populaires dans vos genres
    if (favoriteGenres.size > 0) {
      const genresArray = Array.from(favoriteGenres.keys());

      // Trouver les artistes dans ces genres
      const artistsInGenres = await this.artistModel
        .find({ genres: { $in: genresArray } })
        .select('_id')
        .limit(100)
        .exec();

      const artistIds = artistsInGenres.map(a => a._id.toString());

      const popularTracks = await this.trackModel
        .find({
          _id: { $nin: user.liked_tracks },
          artist_ids: { $in: artistIds },
        })
        .populate('album_id')
        .sort({ popularity: -1 })
        .limit(10)
        .exec();

      if (popularTracks.length > 0) {
        sections.push({
          title: 'Titres qui pourraient vous plaire',
          description: 'Des hits dans vos genres préférés',
          icon: 'music',
          type: 'track',
          items: popularTracks,
        });
      }
    }

    // SECTION 5: Tendances actuelles (toujours affichée)
    const trendingTracks = await this.trackModel
      .find({
        _id: { $nin: user.liked_tracks },
        popularity: { $gte: 70 },
      })
      .populate('album_id')
      .sort({ popularity: -1 })
      .limit(10)
      .exec();

    if (trendingTracks.length > 0) {
      sections.push({
        title: 'Tendances actuelles',
        description: 'Les titres les plus populaires du moment',
        icon: 'trending-up',
        type: 'track',
        items: trendingTracks,
      });
    }

    // SECTION 6: Artistes populaires (si pas assez de préférences)
    if (!hasPreferences || sections.length < 3) {
      const popularArtists = await this.artistModel
        .find({ _id: { $nin: user.favorite_artists } })
        .sort({ popularity: -1 })
        .limit(8)
        .exec();

      if (popularArtists.length > 0) {
        sections.push({
          title: hasPreferences ? 'Artistes populaires' : 'Artistes les plus écoutés',
          description: 'Découvrez les artistes du moment',
          icon: 'trending-up',
          type: 'artist',
          items: popularArtists,
        });
      }
    }

    this.logger.log(`Generated ${sections.length} recommendation sections`);
    return sections;
  }
}
