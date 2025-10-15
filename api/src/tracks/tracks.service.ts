import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateTrackDto } from './dto/create-track.dto';
import { UpdateTrackDto } from './dto/update-track.dto';
import { Track, TrackDocument } from './entities/track.entity';

@Injectable()
export class TracksService {
  constructor(
    @InjectModel(Track.name) private trackModel: Model<TrackDocument>,
  ) {}

  async create(createTrackDto: CreateTrackDto) {
    const createdTrack = new this.trackModel(createTrackDto);
    return createdTrack.save();
  }

  async findAll() {
    return this.trackModel.find().exec();
  }

  async findOne(id: string) {
    return this.trackModel.findById(id).exec();
  }

  async update(id: string, updateTrackDto: UpdateTrackDto) {
    return this.trackModel
      .findByIdAndUpdate(id, updateTrackDto, { new: true })
      .exec();
  }

  async remove(id: string) {
    return this.trackModel.findByIdAndDelete(id).exec();
  }
}
