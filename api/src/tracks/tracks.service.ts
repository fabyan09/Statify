import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CreateTrackDto } from './dto/create-track.dto';
import { UpdateTrackDto } from './dto/update-track.dto';
import { Track, TrackDocument } from './entities/track.entity';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class TracksService {
  constructor(
    @InjectModel(Track.name) private trackModel: Model<TrackDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(createTrackDto: CreateTrackDto) {
    const createdTrack = new this.trackModel(createTrackDto);
    const result = await createdTrack.save();
    // Invalidate cache
    await this.cacheManager.del('all-tracks');
    return result;
  }

  async findAll(paginationDto?: PaginationDto): Promise<PaginatedResult<Track>> {
    const page = Number(paginationDto?.page) || 1;
    const limit = Number(paginationDto?.limit) || 20;
    const skip = (page - 1) * limit;

    const cacheKey = `tracks-page-${page}-limit-${limit}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      console.log(`[TracksService.findAll] Returning from cache, page: ${page}, limit: ${limit}, count: ${(cached as any).data.length}`);
      return cached as PaginatedResult<Track>;
    }

    const [data, total] = await Promise.all([
      this.trackModel.find().skip(skip).limit(limit).exec(),
      this.trackModel.countDocuments().exec(),
    ]);

    console.log(`[TracksService.findAll] Fetched from DB, page: ${page}, limit: ${limit}, count: ${data.length}, total: ${total}`);

    const totalPages = Math.ceil(total / limit);

    const result = {
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

    await this.cacheManager.set(cacheKey, result);
    return result;
  }

  async findOne(id: string) {
    return this.trackModel.findById(id).exec();
  }

  async findByIds(ids: string[]) {
    return this.trackModel
      .find({ _id: { $in: ids } })
      .populate('album_id') // Include full album data
      .exec();
  }

  async findByArtist(artistId: string) {
    return this.trackModel
      .find({ artist_ids: artistId })
      .populate('album_id') // Include full album data for collaborative tracks
      .sort({ popularity: -1 }) // Most popular first
      .exec();
  }

  async update(id: string, updateTrackDto: UpdateTrackDto) {
    const result = await this.trackModel
      .findByIdAndUpdate(id, updateTrackDto, { new: true })
      .exec();
    // Invalidate cache
    await this.cacheManager.del('all-tracks');
    return result;
  }

  async remove(id: string) {
    const result = await this.trackModel.findByIdAndDelete(id).exec();
    // Invalidate cache
    await this.cacheManager.del('all-tracks');
    return result;
  }

  async upsert(id: string, trackData: any, options?: { skipCacheInvalidation?: boolean }) {
    const result = await this.trackModel
      .findByIdAndUpdate(id, trackData, { upsert: true, new: true })
      .exec();
    // Invalidate only tracks cache (skip si demandé pour optimiser les batch operations)
    if (!options?.skipCacheInvalidation) {
      await this.invalidateTracksCache();
    }
    return result;
  }

  async invalidateTracksCache() {
    // Clear the entire cache since we can't easily iterate keys
    // This is acceptable since cache is rebuilt quickly on next request
    await this.cacheManager.clear();
  }
}
