import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  Query,
} from '@nestjs/common';
import { PlaylistsService } from './playlists.service';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import {
  AddTracksDto,
  RemoveTracksDto,
  AddCollaboratorDto,
  RemoveCollaboratorDto,
} from './dto/manage-playlist.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('playlists')
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @Post()
  create(@Body() createPlaylistDto: CreatePlaylistDto) {
    return this.playlistsService.create(createPlaylistDto);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.playlistsService.findAll(paginationDto);
  }

  @Get('public')
  findPublicPlaylists(@Query() paginationDto: PaginationDto) {
    return this.playlistsService.findPublicPlaylists(paginationDto);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string, @Query() paginationDto: PaginationDto) {
    return this.playlistsService.findByUser(userId, paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.playlistsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePlaylistDto: UpdatePlaylistDto) {
    return this.playlistsService.update(id, updatePlaylistDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.playlistsService.remove(id);
  }

  // Track management endpoints
  @Put(':id/tracks/add')
  addTracks(@Param('id') id: string, @Body() addTracksDto: AddTracksDto) {
    return this.playlistsService.addTracks(id, addTracksDto);
  }

  @Put(':id/tracks/remove')
  removeTracks(@Param('id') id: string, @Body() removeTracksDto: RemoveTracksDto) {
    return this.playlistsService.removeTracks(id, removeTracksDto);
  }

  @Put(':id/tracks/reorder')
  reorderTracks(@Param('id') id: string, @Body() body: { track_ids: string[] }) {
    return this.playlistsService.reorderTracks(id, body.track_ids);
  }

  // Collaborator management endpoints
  @Put(':id/collaborators/add')
  addCollaborator(@Param('id') id: string, @Body() addCollaboratorDto: AddCollaboratorDto) {
    return this.playlistsService.addCollaborator(id, addCollaboratorDto);
  }

  @Put(':id/collaborators/remove')
  removeCollaborator(@Param('id') id: string, @Body() removeCollaboratorDto: RemoveCollaboratorDto) {
    return this.playlistsService.removeCollaborator(id, removeCollaboratorDto);
  }

  @Get(':id/can-edit/:userId')
  canEdit(@Param('id') id: string, @Param('userId') userId: string) {
    return this.playlistsService.canEdit(id, userId);
  }
}
