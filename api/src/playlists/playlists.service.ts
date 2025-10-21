import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Playlist, PlaylistDocument } from './entities/playlist.entity';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import {
  AddTracksDto,
  RemoveTracksDto,
  AddCollaboratorDto,
  RemoveCollaboratorDto,
} from './dto/manage-playlist.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class PlaylistsService {
  constructor(
    @InjectModel(Playlist.name) private playlistModel: Model<PlaylistDocument>,
  ) {}

  async create(createPlaylistDto: CreatePlaylistDto): Promise<Playlist> {
    const createdPlaylist = new this.playlistModel(createPlaylistDto);
    return createdPlaylist.save();
  }

  async findAll(paginationDto?: PaginationDto): Promise<PaginatedResult<Playlist>> {
    const page = paginationDto?.page || 1;
    const limit = paginationDto?.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.playlistModel.find().skip(skip).limit(limit).exec(),
      this.playlistModel.countDocuments().exec(),
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

  async findOne(id: string): Promise<Playlist> {
    const playlist = await this.playlistModel.findById(id).exec();
    if (!playlist) {
      throw new NotFoundException(`Playlist with ID ${id} not found`);
    }
    return playlist;
  }

  async findByUser(userId: string, paginationDto?: PaginationDto): Promise<PaginatedResult<Playlist>> {
    const page = paginationDto?.page || 1;
    const limit = paginationDto?.limit || 20;
    const skip = (page - 1) * limit;

    const filter = {
      $or: [{ owner_id: userId }, { collaborators: userId }],
    };

    const [data, total] = await Promise.all([
      this.playlistModel.find(filter).skip(skip).limit(limit).exec(),
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

  async findPublicPlaylists(paginationDto?: PaginationDto): Promise<PaginatedResult<Playlist>> {
    const page = paginationDto?.page || 1;
    const limit = paginationDto?.limit || 20;
    const skip = (page - 1) * limit;

    const filter = { isPublic: true };

    const [data, total] = await Promise.all([
      this.playlistModel.find(filter).skip(skip).limit(limit).exec(),
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

  async update(id: string, updatePlaylistDto: UpdatePlaylistDto): Promise<Playlist> {
    const updatedPlaylist = await this.playlistModel
      .findByIdAndUpdate(id, updatePlaylistDto, { new: true })
      .exec();
    if (!updatedPlaylist) {
      throw new NotFoundException(`Playlist with ID ${id} not found`);
    }
    return updatedPlaylist;
  }

  async remove(id: string): Promise<void> {
    const result = await this.playlistModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Playlist with ID ${id} not found`);
    }
  }

  // Track management
  async addTracks(playlistId: string, addTracksDto: AddTracksDto): Promise<Playlist> {
    const playlist = await this.findOne(playlistId);

    // Add only unique tracks
    const newTracks = addTracksDto.track_ids.filter(
      (trackId) => !playlist.tracks.includes(trackId),
    );
    playlist.tracks.push(...newTracks);

    const updatedPlaylist = await this.playlistModel
      .findByIdAndUpdate(playlistId, { tracks: playlist.tracks }, { new: true })
      .exec();

    if (!updatedPlaylist) {
      throw new NotFoundException(`Playlist with ID ${playlistId} not found`);
    }

    return updatedPlaylist;
  }

  async removeTracks(playlistId: string, removeTracksDto: RemoveTracksDto): Promise<Playlist> {
    const playlist = await this.findOne(playlistId);

    playlist.tracks = playlist.tracks.filter(
      (trackId) => !removeTracksDto.track_ids.includes(trackId),
    );

    const updatedPlaylist = await this.playlistModel
      .findByIdAndUpdate(playlistId, { tracks: playlist.tracks }, { new: true })
      .exec();

    if (!updatedPlaylist) {
      throw new NotFoundException(`Playlist with ID ${playlistId} not found`);
    }

    return updatedPlaylist;
  }

  async reorderTracks(playlistId: string, trackIds: string[]): Promise<Playlist> {
    const playlist = await this.findOne(playlistId);

    // Verify all track IDs exist in the playlist
    const allTracksExist = trackIds.every((trackId) => playlist.tracks.includes(trackId));
    if (!allTracksExist || trackIds.length !== playlist.tracks.length) {
      throw new ForbiddenException('Invalid track order: missing or extra tracks');
    }

    const updatedPlaylist = await this.playlistModel
      .findByIdAndUpdate(playlistId, { tracks: trackIds }, { new: true })
      .exec();

    if (!updatedPlaylist) {
      throw new NotFoundException(`Playlist with ID ${playlistId} not found`);
    }

    return updatedPlaylist;
  }

  // Collaborator management
  async addCollaborator(playlistId: string, addCollaboratorDto: AddCollaboratorDto): Promise<Playlist> {
    const playlist = await this.findOne(playlistId);

    if (!playlist.collaborators.includes(addCollaboratorDto.user_id)) {
      playlist.collaborators.push(addCollaboratorDto.user_id);
    }

    const updatedPlaylist = await this.playlistModel
      .findByIdAndUpdate(playlistId, { collaborators: playlist.collaborators }, { new: true })
      .exec();

    if (!updatedPlaylist) {
      throw new NotFoundException(`Playlist with ID ${playlistId} not found`);
    }

    return updatedPlaylist;
  }

  async removeCollaborator(playlistId: string, removeCollaboratorDto: RemoveCollaboratorDto): Promise<Playlist> {
    const playlist = await this.findOne(playlistId);

    playlist.collaborators = playlist.collaborators.filter(
      (userId) => userId !== removeCollaboratorDto.user_id,
    );

    const updatedPlaylist = await this.playlistModel
      .findByIdAndUpdate(playlistId, { collaborators: playlist.collaborators }, { new: true })
      .exec();

    if (!updatedPlaylist) {
      throw new NotFoundException(`Playlist with ID ${playlistId} not found`);
    }

    return updatedPlaylist;
  }

  // Check if user can edit playlist (owner or collaborator)
  async canEdit(playlistId: string, userId: string): Promise<boolean> {
    const playlist = await this.findOne(playlistId);
    return (
      playlist.owner_id === userId ||
      playlist.collaborators.includes(userId)
    );
  }
}
