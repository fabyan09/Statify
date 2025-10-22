import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CreateAlbumDto } from './dto/create-album.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';
import { Album, AlbumDocument } from './entities/album.entity';
import { SpotifyService } from '../spotify/spotify.service';
import { TracksService } from '../tracks/tracks.service';

@Injectable()
export class AlbumsService {
  constructor(
    @InjectModel(Album.name) private albumModel: Model<AlbumDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private spotifyService: SpotifyService,
    private tracksService: TracksService,
  ) {}

  async create(createAlbumDto: CreateAlbumDto) {
    const createdAlbum = new this.albumModel(createAlbumDto);
    const result = await createdAlbum.save();
    // Invalidate cache
    await this.cacheManager.del('all-albums');
    return result;
  }

  async findAll() {
    const cacheKey = 'all-albums';
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      console.log('[AlbumsService.findAll] Returning from cache, count:', (cached as any[]).length);
      return cached;
    }

    const albums = await this.albumModel.find().exec();
    console.log('[AlbumsService.findAll] Fetched from DB, count:', albums.length);
    await this.cacheManager.set(cacheKey, albums);
    return albums;
  }

  async findOne(id: string) {
    const album = await this.albumModel.findById(id).exec();
    console.log('[AlbumsService.findOne] Album data:', JSON.stringify(album, null, 2));
    return album;
  }

  async findByIds(ids: string[]) {
    return this.albumModel.find({ _id: { $in: ids } }).exec();
  }

  async findByArtist(artistId: string) {
    return this.albumModel
      .find({ artist_ids: artistId })
      .sort({ release_date: -1 }) // Most recent first
      .exec();
  }

  async update(id: string, updateAlbumDto: UpdateAlbumDto) {
    const result = await this.albumModel
      .findByIdAndUpdate(id, updateAlbumDto, { new: true })
      .exec();
    // Invalidate cache
    await this.cacheManager.del('all-albums');
    return result;
  }

  async remove(id: string) {
    const result = await this.albumModel.findByIdAndDelete(id).exec();
    // Invalidate cache
    await this.cacheManager.del('all-albums');
    return result;
  }

  async upsert(id: string, albumData: any, options?: { skipCacheInvalidation?: boolean }) {
    const result = await this.albumModel
      .findByIdAndUpdate(id, albumData, { upsert: true, new: true })
      .exec();
    // Invalidate cache (skip si demandé pour optimiser les batch operations)
    if (!options?.skipCacheInvalidation) {
      await this.invalidateAlbumsCache();
    }
    return result;
  }

  async invalidateAlbumsCache() {
    // Simply delete the main albums cache key
    await this.cacheManager.del('all-albums');
  }

  async getAlbumTracks(albumId: string) {
    const album = await this.albumModel.findById(albumId).exec();
    if (!album) {
      throw new NotFoundException(`Album with ID ${albumId} not found`);
    }

    // Fetch tracks using the track_ids from the album
    const tracks = await this.tracksService.findByIds(album.track_ids);

    // Sort by disc and track number
    tracks.sort((a, b) => {
      if (a.disc_number !== b.disc_number) {
        return a.disc_number - b.disc_number;
      }
      return a.track_number - b.track_number;
    });

    return tracks;
  }

  async getReleaseCohorts() {
    // Aggregation pipeline pour calculer les stats par année et par mois
    const yearlyData = await this.albumModel.aggregate([
      {
        $addFields: {
          year: { $substr: ['$release_date', 0, 4] }
        }
      },
      {
        $match: {
          year: { $gte: '1900' } // Filtrer les années invalides
        }
      },
      {
        $group: {
          _id: '$year',
          releases: { $sum: 1 },
          totalPopularity: { $sum: '$popularity' },
          singles: {
            $sum: { $cond: [{ $eq: ['$album_type', 'single'] }, 1, 0] }
          },
          albums: {
            $sum: { $cond: [{ $eq: ['$album_type', 'album'] }, 1, 0] }
          },
          compilations: {
            $sum: { $cond: [{ $eq: ['$album_type', 'compilation'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 0,
          period: '$_id',
          releases: 1,
          avgPopularity: { $round: [{ $divide: ['$totalPopularity', '$releases'] }, 0] },
          singles: 1,
          albums: 1,
          compilations: 1
        }
      },
      {
        $sort: { period: 1 }
      }
    ]).exec();

    // Aggregation pour les données mensuelles
    const monthlyData = await this.albumModel.aggregate([
      {
        $addFields: {
          year: { $substr: ['$release_date', 0, 4] },
          month: { $substr: ['$release_date', 5, 2] }
        }
      },
      {
        $match: {
          year: { $gte: '1900' } // Filtrer les années invalides
        }
      },
      {
        $addFields: {
          // Si le mois est invalide, utiliser '01'
          validMonth: {
            $cond: [
              { $and: [
                { $gte: ['$month', '01'] },
                { $lte: ['$month', '12'] }
              ]},
              '$month',
              '01'
            ]
          }
        }
      },
      {
        $addFields: {
          yearMonth: { $concat: ['$year', '-', '$validMonth'] }
        }
      },
      {
        $group: {
          _id: '$yearMonth',
          releases: { $sum: 1 },
          totalPopularity: { $sum: '$popularity' },
          singles: {
            $sum: { $cond: [{ $eq: ['$album_type', 'single'] }, 1, 0] }
          },
          albums: {
            $sum: { $cond: [{ $eq: ['$album_type', 'album'] }, 1, 0] }
          },
          compilations: {
            $sum: { $cond: [{ $eq: ['$album_type', 'compilation'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 0,
          period: '$_id',
          releases: 1,
          avgPopularity: { $round: [{ $divide: ['$totalPopularity', '$releases'] }, 0] },
          singles: 1,
          albums: 1,
          compilations: 1
        }
      },
      {
        $sort: { period: 1 }
      }
    ]).exec();

    // Stats globales
    const totalReleases = await this.albumModel.countDocuments().exec();

    return {
      yearlyData,
      monthlyData,
      totalReleases
    };
  }

  async getLabelStats() {
    // Aggregation pour calculer les stats par label
    const labelStats = await this.albumModel.aggregate([
      {
        $group: {
          _id: '$label',
          albumCount: { $sum: 1 },
          trackCount: { $sum: { $size: '$track_ids' } },
          totalPopularity: { $sum: '$popularity' },
          singles: {
            $sum: { $cond: [{ $eq: ['$album_type', 'single'] }, 1, 0] }
          },
          albums: {
            $sum: { $cond: [{ $eq: ['$album_type', 'album'] }, 1, 0] }
          },
          compilations: {
            $sum: { $cond: [{ $eq: ['$album_type', 'compilation'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 0,
          label: '$_id',
          albumCount: 1,
          trackCount: 1,
          avgPopularity: { $round: [{ $divide: ['$totalPopularity', '$albumCount'] }, 0] },
          singles: 1,
          albums: 1,
          compilations: 1
        }
      },
      {
        $sort: { avgPopularity: -1 }
      }
    ]).exec();

    // Distribution globale des types d'albums
    const albumTypeDistribution = await this.albumModel.aggregate([
      {
        $group: {
          _id: '$album_type',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          type: '$_id',
          count: 1
        }
      }
    ]).exec();

    const totalAlbums = await this.albumModel.countDocuments().exec();

    return {
      labelStats,
      albumTypeDistribution,
      totalAlbums
    };
  }

  async syncTracksFromSpotify(albumId: string) {
    console.log(`[SYNC] Starting sync for album ${albumId}`);

    // 1. Récupérer l'album depuis la DB
    const album = await this.albumModel.findById(albumId).exec();
    if (!album) {
      throw new NotFoundException(`Album with ID ${albumId} not found`);
    }

    console.log(`[SYNC] Album found: ${album.name}, spotify_synced: ${album.spotify_synced}`);

    // 2. Vérifier si l'album a déjà été synced
    if (album.spotify_synced) {
      console.log(`[SYNC] Album already synced, skipping`);
      return {
        message: 'Album already synced',
        album,
      };
    }

    // 3. Récupérer les tracks depuis l'API Spotify (call 1: récupère les IDs et infos de base)
    console.log(`[SYNC] Fetching tracks from Spotify API (album tracks endpoint)`);
    const spotifyTracks = await this.spotifyService.getAlbumTracks(albumId);
    console.log(`[SYNC] Received ${spotifyTracks.length} tracks from Spotify`);

    // 4. Récupérer les informations complètes des tracks (call 2: récupère la popularité)
    console.log(`[SYNC] Fetching complete track info (tracks endpoint)`);
    const trackIds = spotifyTracks.map(track => track.id);
    const completeTracksData = await this.spotifyService.getTracks(trackIds);
    console.log(`[SYNC] Received complete info for ${completeTracksData.length} tracks`);

    // Créer une map pour accéder facilement aux données complètes par ID
    const tracksDataMap = new Map(
      completeTracksData.map(track => [track.id, track])
    );

    // 5. Upsert les tracks en base de données (EN PARALLÈLE pour meilleure performance)
    console.log(`[SYNC] Upserting ${spotifyTracks.length} tracks in parallel...`);
    const trackUpsertPromises = spotifyTracks.map(async (spotifyTrack) => {
      try {
        // Récupérer les données complètes de la track
        const completeTrackData = tracksDataMap.get(spotifyTrack.id);

        // Upsert le track avec les informations de Spotify (skip cache invalidation pour optimiser)
        const trackData = {
          name: spotifyTrack.name,
          popularity: completeTrackData?.popularity || 0, // Utilise la popularité du 2e call
          duration_ms: spotifyTrack.duration_ms,
          explicit: spotifyTrack.explicit,
          preview_url: spotifyTrack.preview_url || '',
          track_number: spotifyTrack.track_number,
          disc_number: spotifyTrack.disc_number,
          href: spotifyTrack.href,
          uri: spotifyTrack.uri,
          external_urls: spotifyTrack.external_urls,
          album_id: albumId,
          artist_ids: spotifyTrack.artists.map((artist) => artist.id),
        };

        const upsertedTrack = await this.tracksService.upsert(spotifyTrack.id, trackData, { skipCacheInvalidation: true });
        return upsertedTrack._id;
      } catch (error) {
        console.error(`Failed to upsert track ${spotifyTrack.id}:`, error);
        return null;
      }
    });

    const createdTrackIds: string[] = (await Promise.all(trackUpsertPromises)).filter(id => id !== null);

    // 6. Mettre à jour l'album avec les track_ids et spotify_synced = true
    const updatedAlbum = await this.albumModel
      .findByIdAndUpdate(
        albumId,
        {
          track_ids: createdTrackIds,
          spotify_synced: true,
        },
        { new: true },
      )
      .exec();

    // Invalidate albums cache and let TracksService handle tracks cache
    await this.invalidateAlbumsCache();

    console.log(`[SYNC] Sync completed! ${createdTrackIds.length} tracks upserted`);

    return {
      message: 'Album tracks synced successfully',
      album: updatedAlbum,
      syncedTracks: createdTrackIds.length,
    };
  }
}
