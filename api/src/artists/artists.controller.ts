import { Controller, Get, Post, Body, Patch, Param, Delete, Inject, forwardRef } from '@nestjs/common';
import { ArtistsService } from './artists.service';
import { CreateArtistDto } from './dto/create-artist.dto';
import { UpdateArtistDto } from './dto/update-artist.dto';
import { AlbumsService } from '../albums/albums.service';
import { TracksService } from '../tracks/tracks.service';

@Controller('artists')
export class ArtistsController {
  constructor(
    private readonly artistsService: ArtistsService,
    @Inject(forwardRef(() => AlbumsService))
    private readonly albumsService: AlbumsService,
    @Inject(forwardRef(() => TracksService))
    private readonly tracksService: TracksService,
  ) {}

  @Post()
  create(@Body() createArtistDto: CreateArtistDto) {
    return this.artistsService.create(createArtistDto);
  }

  @Get()
  findAll() {
    return this.artistsService.findAll();
  }

  @Post('by-ids')
  findByIds(@Body('ids') ids: string[]) {
    return this.artistsService.findByIds(ids);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.artistsService.findOne(id);
  }

  @Get(':id/albums')
  getArtistAlbums(@Param('id') id: string) {
    return this.albumsService.findByArtist(id);
  }

  @Get(':id/tracks')
  getArtistTracks(@Param('id') id: string) {
    return this.tracksService.findByArtist(id);
  }

  @Post(':id/sync-albums')
  syncAlbums(@Param('id') id: string) {
    return this.artistsService.syncAlbumsFromSpotify(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateArtistDto: UpdateArtistDto) {
    return this.artistsService.update(id, updateArtistDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.artistsService.remove(id);
  }
}
