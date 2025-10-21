import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Track, TrackDocument } from '../tracks/entities/track.entity';
import { Album, AlbumDocument } from '../albums/entities/album.entity';
import { Artist, ArtistDocument } from '../artists/entities/artist.entity';
import { User, UserDocument } from '../users/entities/user.entity';
import { Playlist, PlaylistDocument } from '../playlists/entities/playlist.entity';
import { PaginatedResult } from '../common/dto/pagination.dto';
import { SearchTrackDto, SearchAlbumDto } from './dto/search-result.dto';

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(Track.name) private trackModel: Model<TrackDocument>,
    @InjectModel(Album.name) private albumModel: Model<AlbumDocument>,
    @InjectModel(Artist.name) private artistModel: Model<ArtistDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Playlist.name) private playlistModel: Model<PlaylistDocument>,
  ) {}

  async search(
    query: string,
    type: 'tracks' | 'albums' | 'artists' | 'playlists' | 'users',
    page = 1,
    limit = 20,
  ): Promise<PaginatedResult<any>> {
    if (!query || query.trim().length === 0) {
      return {
        data: [],
        meta: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }

    const skip = (page - 1) * limit;

    switch (type) {
      case 'tracks':
        return this.searchTracks(query.trim(), skip, limit, page);
      case 'albums':
        return this.searchAlbums(query.trim(), skip, limit, page);
      case 'artists':
        return this.searchArtists(query.trim(), skip, limit, page);
      case 'playlists':
        return this.searchPlaylists(query.trim(), skip, limit, page);
      case 'users':
        return this.searchUsers(query.trim(), skip, limit, page);
      default:
        throw new Error('Invalid search type');
    }
  }

  private async searchTracks(
    query: string,
    skip: number,
    limit: number,
    page: number,
  ): Promise<PaginatedResult<SearchTrackDto>> {
    // Utilise MongoDB text search avec score de pertinence
    const [tracks, total] = await Promise.all([
      this.trackModel
        .find({ $text: { $search: query } }, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(limit)
        .populate('album_id', 'name images')
        .populate('artist_ids', 'name')
        .exec(),
      this.trackModel.countDocuments({ $text: { $search: query } }).exec(),
    ]);

    // Transform to DTOs
    const data = tracks.map((track) => {
      const artistNames = Array.isArray(track.artist_ids)
        ? track.artist_ids
            .map((artist: any) => artist?.name || 'Unknown Artist')
            .join(', ')
        : 'Unknown Artist';

      const albumName = (track.album_id as any)?.name || 'Unknown Album';
      const albumImage = (track.album_id as any)?.images?.[0]?.url || null;

      return {
        _id: track._id.toString(),
        name: track.name,
        duration_ms: track.duration_ms,
        explicit: track.explicit,
        popularity: track.popularity,
        external_urls: track.external_urls,
        artistNames,
        albumName,
        albumImage,
      } as SearchTrackDto;
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  private async searchAlbums(
    query: string,
    skip: number,
    limit: number,
    page: number,
  ): Promise<PaginatedResult<SearchAlbumDto>> {
    const [albums, total] = await Promise.all([
      this.albumModel
        .find({ $text: { $search: query } }, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(limit)
        .populate('artist_ids', 'name')
        .exec(),
      this.albumModel.countDocuments({ $text: { $search: query } }).exec(),
    ]);

    // Transform to DTOs
    const data = albums.map((album) => {
      const artistNames = Array.isArray(album.artist_ids)
        ? album.artist_ids
            .map((artist: any) => artist?.name || 'Unknown Artist')
            .join(', ')
        : 'Unknown Artist';

      return {
        _id: album._id.toString(),
        name: album.name,
        album_type: album.album_type,
        images: album.images,
        external_urls: album.external_urls,
        artistNames,
      } as SearchAlbumDto;
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  private async searchArtists(
    query: string,
    skip: number,
    limit: number,
    page: number,
  ): Promise<PaginatedResult<Artist>> {
    const [data, total] = await Promise.all([
      this.artistModel
        .find({ $text: { $search: query } }, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.artistModel.countDocuments({ $text: { $search: query } }).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  private async searchPlaylists(
    query: string,
    skip: number,
    limit: number,
    page: number,
  ): Promise<PaginatedResult<Playlist>> {
    const filter = {
      $text: { $search: query },
      isPublic: true,
    };

    const [data, total] = await Promise.all([
      this.playlistModel
        .find(filter, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.playlistModel.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  private async searchUsers(
    query: string,
    skip: number,
    limit: number,
    page: number,
  ): Promise<PaginatedResult<User>> {
    const [data, total] = await Promise.all([
      this.userModel
        .find({ $text: { $search: query } }, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments({ $text: { $search: query } }).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }
}
