import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Artist, ArtistDocument } from '../artists/entities/artist.entity';
import { Album, AlbumDocument } from '../albums/entities/album.entity';
import { Track, TrackDocument } from '../tracks/entities/track.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectModel(Artist.name) private artistModel: Model<ArtistDocument>,
    @InjectModel(Album.name) private albumModel: Model<AlbumDocument>,
    @InjectModel(Track.name) private trackModel: Model<TrackDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getDashboardStats() {
    const cacheKey = 'dashboard-stats';
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    // Count aggregations (fast)
    const [totalArtists, totalAlbums, totalTracks] = await Promise.all([
      this.artistModel.countDocuments().exec(),
      this.albumModel.countDocuments().exec(),
      this.trackModel.countDocuments().exec(),
    ]);

    // Aggregate avg popularity
    const avgPopularityResult = await this.artistModel.aggregate([
      {
        $group: {
          _id: null,
          avgPopularity: { $avg: '$popularity' },
        },
      },
    ]);

    const avgPopularity =
      avgPopularityResult.length > 0
        ? Math.round(avgPopularityResult[0].avgPopularity)
        : 0;

    // Unique labels count
    const uniqueLabelsResult = await this.albumModel.distinct('label').exec();
    const uniqueLabels = uniqueLabelsResult.length;

    // Collaborative tracks (tracks with multiple artists)
    const collaborativeTracksCount = await this.trackModel.countDocuments({
      $expr: { $gt: [{ $size: '$artist_ids' }, 1] },
    });

    // Avg tracks per album (excluding singles and compilations)
    const albumsOnly = await this.albumModel
      .find({ album_type: 'album' })
      .select('track_ids')
      .exec();

    const totalAlbumsOnly = albumsOnly.length;
    const totalTracksInAlbums = albumsOnly.reduce(
      (sum, album) => sum + album.track_ids.length,
      0,
    );

    const avgTracksPerAlbum =
      totalAlbumsOnly > 0
        ? (totalTracksInAlbums / totalAlbumsOnly).toFixed(1)
        : '0';

    // Album types distribution
    const albumTypesResult = await this.albumModel.aggregate([
      {
        $group: {
          _id: '$album_type',
          count: { $count: {} },
        },
      },
    ]);

    const albumTypes = albumTypesResult.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const stats = {
      totalArtists,
      totalAlbums,
      totalTracks,
      avgPopularity,
      uniqueLabels,
      collaborativeTracks: collaborativeTracksCount,
      avgTracksPerAlbum,
      albumTypes,
    };

    await this.cacheManager.set(cacheKey, stats);
    return stats;
  }

  async getTopArtists(limit = 10) {
    const cacheKey = `top-artists-${limit}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const topArtists = await this.artistModel
      .find()
      .sort({ popularity: -1 })
      .limit(limit)
      .select('_id name popularity followers images external_urls')
      .exec();

    await this.cacheManager.set(cacheKey, topArtists);
    return topArtists;
  }

  async getReleaseCohorts(granularity: 'year' | 'month' = 'year') {
    const cacheKey = `release-cohorts-${granularity}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const albums = await this.albumModel
      .find()
      .select('release_date popularity album_type')
      .exec();

    const cohortsMap = new Map();

    albums.forEach((album) => {
      const year = album.release_date.split('-')[0];

      // Skip invalid years
      if (parseInt(year) < 1900) return;

      let period;
      if (granularity === 'year') {
        period = year;
      } else {
        const [y, month] = album.release_date.split('-');
        const validMonth = month && parseInt(month) >= 1 && parseInt(month) <= 12 ? month : '01';
        period = `${y}-${validMonth.padStart(2, '0')}`;
      }

      if (!cohortsMap.has(period)) {
        cohortsMap.set(period, {
          period,
          releases: 0,
          totalPopularity: 0,
          singles: 0,
          albums: 0,
          compilations: 0,
        });
      }

      const cohort = cohortsMap.get(period);
      cohort.releases++;
      cohort.totalPopularity += album.popularity;
      if (album.album_type === 'single') cohort.singles++;
      else if (album.album_type === 'album') cohort.albums++;
      else if (album.album_type === 'compilation') cohort.compilations++;
    });

    const cohorts = Array.from(cohortsMap.values())
      .map((cohort) => ({
        ...cohort,
        avgPopularity: Math.round(cohort.totalPopularity / cohort.releases),
        totalPopularity: undefined, // Remove from output
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    await this.cacheManager.set(cacheKey, cohorts);
    return cohorts;
  }

  async getLabelStats() {
    const cacheKey = 'label-stats';
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const albums = await this.albumModel
      .find()
      .select('label popularity album_type track_ids')
      .exec();

    const labelsMap = new Map();

    albums.forEach((album) => {
      if (!labelsMap.has(album.label)) {
        labelsMap.set(album.label, {
          label: album.label,
          albumCount: 0,
          trackCount: 0,
          totalPopularity: 0,
          singles: 0,
          albums: 0,
          compilations: 0,
        });
      }

      const labelStats = labelsMap.get(album.label);
      labelStats.albumCount++;
      labelStats.trackCount += album.track_ids.length;
      labelStats.totalPopularity += album.popularity;
      if (album.album_type === 'single') labelStats.singles++;
      else if (album.album_type === 'album') labelStats.albums++;
      else if (album.album_type === 'compilation') labelStats.compilations++;
    });

    const labelStats = Array.from(labelsMap.values())
      .map((stats) => ({
        ...stats,
        avgPopularity: Math.round(stats.totalPopularity / stats.albumCount),
        totalPopularity: undefined, // Remove from output
      }))
      .sort((a, b) => b.albumCount - a.albumCount); // Sort by album count descending

    await this.cacheManager.set(cacheKey, labelStats);
    return labelStats;
  }

  async getCollaborations() {
    const cacheKey = 'collaborations';
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const tracks = await this.trackModel
      .find()
      .select('artist_ids')
      .exec();

    const collabMap = new Map();

    tracks.forEach((track) => {
      if (track.artist_ids.length > 1) {
        // Multiple artists = collaboration
        for (let i = 0; i < track.artist_ids.length; i++) {
          for (let j = i + 1; j < track.artist_ids.length; j++) {
            const key = [track.artist_ids[i], track.artist_ids[j]]
              .sort()
              .join('-');
            collabMap.set(key, (collabMap.get(key) || 0) + 1);
          }
        }
      }
    });

    const collaborations = Array.from(collabMap.entries())
      .map(([key, count]) => {
        const [artist1, artist2] = key.split('-');
        return { artist1, artist2, count };
      })
      .sort((a, b) => b.count - a.count); // Sort by collab count descending

    await this.cacheManager.set(cacheKey, collaborations);
    return collaborations;
  }
}
