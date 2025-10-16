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

    // Total followers
    const totalFollowersResult = await this.artistModel.aggregate([
      {
        $group: {
          _id: null,
          totalFollowers: { $sum: '$followers' },
        },
      },
    ]);

    const totalFollowers =
      totalFollowersResult.length > 0
        ? totalFollowersResult[0].totalFollowers
        : 0;

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
      totalFollowers,
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
}
