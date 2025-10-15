import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CreateArtistDto } from './dto/create-artist.dto';
import { UpdateArtistDto } from './dto/update-artist.dto';
import { Artist, ArtistDocument } from './entities/artist.entity';

@Injectable()
export class ArtistsService {
  constructor(
    @InjectModel(Artist.name) private artistModel: Model<ArtistDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(createArtistDto: CreateArtistDto) {
    const createdArtist = new this.artistModel(createArtistDto);
    const result = await createdArtist.save();
    // Invalidate cache
    await this.cacheManager.del('all-artists');
    return result;
  }

  async findAll() {
    const cacheKey = 'all-artists';
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const artists = await this.artistModel.find().exec();
    await this.cacheManager.set(cacheKey, artists);
    return artists;
  }

  async findOne(id: string) {
    return this.artistModel.findById(id).exec();
  }

  async update(id: string, updateArtistDto: UpdateArtistDto) {
    const result = await this.artistModel
      .findByIdAndUpdate(id, updateArtistDto, { new: true })
      .exec();
    // Invalidate cache
    await this.cacheManager.del('all-artists');
    return result;
  }

  async remove(id: string) {
    const result = await this.artistModel.findByIdAndDelete(id).exec();
    // Invalidate cache
    await this.cacheManager.del('all-artists');
    return result;
  }
}
