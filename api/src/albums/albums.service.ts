import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CreateAlbumDto } from './dto/create-album.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';
import { Album, AlbumDocument } from './entities/album.entity';

@Injectable()
export class AlbumsService {
  constructor(
    @InjectModel(Album.name) private albumModel: Model<AlbumDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
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
    if (cached) return cached;

    const albums = await this.albumModel.find().exec();
    await this.cacheManager.set(cacheKey, albums);
    return albums;
  }

  async findOne(id: string) {
    return this.albumModel.findById(id).exec();
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
}
