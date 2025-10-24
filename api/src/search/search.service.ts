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
    filters?: {
      // Popularity filters (all types)
      minPopularity?: number;
      maxPopularity?: number;
      // Genre filter (albums, artists)
      genre?: string;
      // Year filters (albums)
      year?: number;
      fromYear?: number;
      toYear?: number;
      // Album type filter (albums)
      albumType?: string;
      // Label filter (albums)
      label?: string;
      // Explicit filter (tracks)
      explicit?: boolean;
      // Duration filters (tracks) - in minutes
      minDuration?: number;
      maxDuration?: number;
      // Followers filters (artists)
      minFollowers?: number;
      maxFollowers?: number;
      // Sort options (all types)
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
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
        return this.searchTracks(query.trim(), skip, limit, page, filters);
      case 'albums':
        return this.searchAlbums(query.trim(), skip, limit, page, filters);
      case 'artists':
        return this.searchArtists(query.trim(), skip, limit, page, filters);
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
    filters?: any,
  ): Promise<PaginatedResult<SearchTrackDto>> {
    // Build the filter object with case-insensitive regex
    const filter: any = {
      name: { $regex: query, $options: 'i' } // Case-insensitive partial match
    };

    // Add popularity filter
    if (filters?.minPopularity !== undefined || filters?.maxPopularity !== undefined) {
      filter.popularity = {};
      if (filters.minPopularity !== undefined) {
        filter.popularity.$gte = filters.minPopularity;
      }
      if (filters.maxPopularity !== undefined) {
        filter.popularity.$lte = filters.maxPopularity;
      }
    }

    // Add explicit filter
    if (filters?.explicit !== undefined) {
      filter.explicit = filters.explicit;
    }

    // Add duration filters (convert minutes to milliseconds)
    if (filters?.minDuration !== undefined || filters?.maxDuration !== undefined) {
      filter.duration_ms = {};
      if (filters.minDuration !== undefined) {
        filter.duration_ms.$gte = filters.minDuration * 60000; // minutes to ms
      }
      if (filters.maxDuration !== undefined) {
        filter.duration_ms.$lte = filters.maxDuration * 60000; // minutes to ms
      }
    }

    // Determine sort criteria
    let sortCriteria: any = { popularity: -1 }; // Default sort
    if (filters?.sortBy) {
      const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
      switch (filters.sortBy) {
        case 'name':
          sortCriteria = { name: sortOrder };
          break;
        case 'duration':
          sortCriteria = { duration_ms: sortOrder };
          break;
        case 'popularity':
        default:
          sortCriteria = { popularity: sortOrder };
          break;
      }
    }

    // Use regex search with case-insensitive option
    const [tracks, total] = await Promise.all([
      this.trackModel
        .find(filter)
        .sort(sortCriteria)
        .skip(skip)
        .limit(limit)
        .populate('album_id', 'name images release_date')
        .populate('artist_ids', 'name')
        .exec(),
      this.trackModel.countDocuments(filter).exec(),
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
    filters?: any,
  ): Promise<PaginatedResult<SearchAlbumDto>> {
    // Build the filter object with case-insensitive regex
    const filter: any = {
      name: { $regex: query, $options: 'i' } // Case-insensitive partial match
    };

    // Add popularity filter
    if (filters?.minPopularity !== undefined || filters?.maxPopularity !== undefined) {
      filter.popularity = {};
      if (filters.minPopularity !== undefined) {
        filter.popularity.$gte = filters.minPopularity;
      }
      if (filters.maxPopularity !== undefined) {
        filter.popularity.$lte = filters.maxPopularity;
      }
    }

    // Add genre filter
    if (filters?.genre) {
      filter.genres = { $regex: filters.genre, $options: 'i' };
    }

    // Add album type filter
    if (filters?.albumType) {
      filter.album_type = filters.albumType;
    }

    // Add label filter
    if (filters?.label) {
      filter.label = { $regex: filters.label, $options: 'i' };
    }

    // Add year filters
    if (filters?.year) {
      filter.release_date = { $regex: `^${filters.year}` };
    } else if (filters?.fromYear || filters?.toYear) {
      filter.$expr = { $and: [] };
      if (filters?.fromYear) {
        filter.$expr.$and.push({
          $gte: [
            { $toInt: { $substr: ['$release_date', 0, 4] } },
            filters.fromYear,
          ],
        });
      }
      if (filters?.toYear) {
        filter.$expr.$and.push({
          $lte: [
            { $toInt: { $substr: ['$release_date', 0, 4] } },
            filters.toYear,
          ],
        });
      }
    }

    // Determine sort criteria
    let sortCriteria: any = { popularity: -1 }; // Default sort
    if (filters?.sortBy) {
      const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
      switch (filters.sortBy) {
        case 'name':
          sortCriteria = { name: sortOrder };
          break;
        case 'releaseDate':
          sortCriteria = { release_date: sortOrder };
          break;
        case 'popularity':
        default:
          sortCriteria = { popularity: sortOrder };
          break;
      }
    }

    const [albums, total] = await Promise.all([
      this.albumModel
        .find(filter)
        .sort(sortCriteria)
        .skip(skip)
        .limit(limit)
        .populate('artist_ids', 'name')
        .exec(),
      this.albumModel.countDocuments(filter).exec(),
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
    filters?: any,
  ): Promise<PaginatedResult<Artist>> {
    // Build the filter object with case-insensitive regex
    const filter: any = {
      name: { $regex: query, $options: 'i' } // Case-insensitive partial match
    };

    // Add popularity filter
    if (filters?.minPopularity !== undefined || filters?.maxPopularity !== undefined) {
      filter.popularity = {};
      if (filters.minPopularity !== undefined) {
        filter.popularity.$gte = filters.minPopularity;
      }
      if (filters.maxPopularity !== undefined) {
        filter.popularity.$lte = filters.maxPopularity;
      }
    }

    // Add genre filter
    if (filters?.genre) {
      filter.genres = { $regex: filters.genre, $options: 'i' };
    }

    // Add followers filter
    if (filters?.minFollowers !== undefined || filters?.maxFollowers !== undefined) {
      filter['followers.total'] = {};
      if (filters.minFollowers !== undefined) {
        filter['followers.total'].$gte = filters.minFollowers;
      }
      if (filters.maxFollowers !== undefined) {
        filter['followers.total'].$lte = filters.maxFollowers;
      }
    }

    // Determine sort criteria
    let sortCriteria: any = { popularity: -1 }; // Default sort
    if (filters?.sortBy) {
      const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
      switch (filters.sortBy) {
        case 'name':
          sortCriteria = { name: sortOrder };
          break;
        case 'followers':
          sortCriteria = { 'followers.total': sortOrder };
          break;
        case 'popularity':
        default:
          sortCriteria = { popularity: sortOrder };
          break;
      }
    }

    const [data, total] = await Promise.all([
      this.artistModel
        .find(filter)
        .sort(sortCriteria)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.artistModel.countDocuments(filter).exec(),
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
    const filter: any = {
      name: { $regex: query, $options: 'i' }, // Case-insensitive partial match
      isPublic: true,
    };

    const [data, total] = await Promise.all([
      this.playlistModel
        .find(filter)
        .sort({ name: 1 }) // Sort by name alphabetically
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
    const filter = {
      username: { $regex: query, $options: 'i' } // Case-insensitive partial match
    };

    const [data, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ username: 1 }) // Sort by username alphabetically
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(filter).exec(),
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
