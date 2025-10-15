import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateArtistDto } from './dto/create-artist.dto';
import { UpdateArtistDto } from './dto/update-artist.dto';
import { Artist, ArtistDocument } from './entities/artist.entity';

@Injectable()
export class ArtistsService {
  constructor(
    @InjectModel(Artist.name) private artistModel: Model<ArtistDocument>,
  ) {}

  async create(createArtistDto: CreateArtistDto) {
    const createdArtist = new this.artistModel(createArtistDto);
    return createdArtist.save();
  }

  async findAll() {
    return this.artistModel.find().exec();
  }

  async findOne(id: string) {
    return this.artistModel.findById(id).exec();
  }

  async update(id: string, updateArtistDto: UpdateArtistDto) {
    return this.artistModel
      .findByIdAndUpdate(id, updateArtistDto, { new: true })
      .exec();
  }

  async remove(id: string) {
    return this.artistModel.findByIdAndDelete(id).exec();
  }
}
