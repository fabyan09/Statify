import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AddToLibraryDto, RemoveFromLibraryDto } from './dto/update-library.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  async findAll(paginationDto?: PaginationDto): Promise<PaginatedResult<User>> {
    const page = paginationDto?.page || 1;
    const limit = paginationDto?.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.userModel.find().skip(skip).limit(limit).exec(),
      this.userModel.countDocuments().exec(),
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

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();
    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return updatedUser;
  }

  async remove(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  // Library management methods
  async addToLibrary(userId: string, addToLibraryDto: AddToLibraryDto): Promise<User> {
    const user = await this.findOne(userId);

    if (addToLibraryDto.track_id && !user.liked_tracks.includes(addToLibraryDto.track_id)) {
      user.liked_tracks.push(addToLibraryDto.track_id);
    }

    if (addToLibraryDto.album_id && !user.liked_albums.includes(addToLibraryDto.album_id)) {
      user.liked_albums.push(addToLibraryDto.album_id);
    }

    if (addToLibraryDto.artist_id && !user.favorite_artists.includes(addToLibraryDto.artist_id)) {
      user.favorite_artists.push(addToLibraryDto.artist_id);
    }

    const updatedUser = await this.userModel.findByIdAndUpdate(userId, user, { new: true }).exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return updatedUser;
  }

  async removeFromLibrary(userId: string, removeFromLibraryDto: RemoveFromLibraryDto): Promise<User> {
    const user = await this.findOne(userId);

    if (removeFromLibraryDto.track_id) {
      user.liked_tracks = user.liked_tracks.filter(id => id !== removeFromLibraryDto.track_id);
    }

    if (removeFromLibraryDto.album_id) {
      user.liked_albums = user.liked_albums.filter(id => id !== removeFromLibraryDto.album_id);
    }

    if (removeFromLibraryDto.artist_id) {
      user.favorite_artists = user.favorite_artists.filter(id => id !== removeFromLibraryDto.artist_id);
    }

    const updatedUser = await this.userModel.findByIdAndUpdate(userId, user, { new: true }).exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return updatedUser;
  }

  async getUserLibrary(userId: string): Promise<{
    liked_tracks: string[];
    liked_albums: string[];
    favorite_artists: string[];
  }> {
    const user = await this.findOne(userId);
    return {
      liked_tracks: user.liked_tracks,
      liked_albums: user.liked_albums,
      favorite_artists: user.favorite_artists,
    };
  }
}
