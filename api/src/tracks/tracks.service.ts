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
    if (cached) return cached as PaginatedResult<Track>;

    const [data, total] = await Promise.all([
      this.trackModel.find().skip(skip).limit(limit).exec(),
      this.trackModel.countDocuments().exec(),
    ]);

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
}
