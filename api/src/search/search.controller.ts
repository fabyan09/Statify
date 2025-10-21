import { Controller, Get, Query, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(
    @Query('q') query: string,
    @Query('type') type: 'tracks' | 'albums' | 'artists' | 'playlists' | 'users',
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    if (!type) {
      throw new BadRequestException('type parameter is required');
    }
    return this.searchService.search(query, type, page || 1, limit || 20);
  }
}
