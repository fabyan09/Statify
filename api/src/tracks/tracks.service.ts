import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CreateTrackDto } from './dto/create-track.dto';
import { UpdateTrackDto } from './dto/update-track.dto';
import { Track, TrackDocument } from './entities/track.entity';

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

  async findAll() {
    const cacheKey = 'all-tracks';
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const tracks = await this.trackModel.find().exec();
    await this.cacheManager.set(cacheKey, tracks);
    return tracks;
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
