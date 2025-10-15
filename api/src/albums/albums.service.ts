import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateAlbumDto } from './dto/create-album.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';
import { Album, AlbumDocument } from './entities/album.entity';

@Injectable()
export class AlbumsService {
  constructor(
    @InjectModel(Album.name) private albumModel: Model<AlbumDocument>,
  ) {}

  async create(createAlbumDto: CreateAlbumDto) {
    const createdAlbum = new this.albumModel(createAlbumDto);
    return createdAlbum.save();
  }

  async findAll() {
    return this.albumModel.find().exec();
  }

  async findOne(id: string) {
    return this.albumModel.findById(id).exec();
  }

  async update(id: string, updateAlbumDto: UpdateAlbumDto) {
    return this.albumModel
      .findByIdAndUpdate(id, updateAlbumDto, { new: true })
      .exec();
  }

  async remove(id: string) {
    return this.albumModel.findByIdAndDelete(id).exec();
  }
}
