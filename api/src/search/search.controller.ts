import { Controller, Get, Query, ParseIntPipe, BadRequestException, ParseBoolPipe } from '@nestjs/common';
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
    // Popularity filters (all types)
    @Query('minPopularity', new ParseIntPipe({ optional: true })) minPopularity?: number,
    @Query('maxPopularity', new ParseIntPipe({ optional: true })) maxPopularity?: number,
    // Genre filter (albums, artists)
    @Query('genre') genre?: string,
    // Year filters (albums)
    @Query('year', new ParseIntPipe({ optional: true })) year?: number,
    @Query('fromYear', new ParseIntPipe({ optional: true })) fromYear?: number,
    @Query('toYear', new ParseIntPipe({ optional: true })) toYear?: number,
    // Album type filter (albums)
    @Query('albumType') albumType?: string,
    // Label filter (albums)
    @Query('label') label?: string,
    // Explicit filter (tracks)
    @Query('explicit', new ParseBoolPipe({ optional: true })) explicit?: boolean,
    // Duration filters (tracks) - in minutes
    @Query('minDuration', new ParseIntPipe({ optional: true })) minDuration?: number,
    @Query('maxDuration', new ParseIntPipe({ optional: true })) maxDuration?: number,
    // Followers filters (artists)
    @Query('minFollowers', new ParseIntPipe({ optional: true })) minFollowers?: number,
    @Query('maxFollowers', new ParseIntPipe({ optional: true })) maxFollowers?: number,
    // Sort options (all types)
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    if (!type) {
      throw new BadRequestException('type parameter is required');
    }

    const filters = {
      minPopularity,
      maxPopularity,
      genre,
      year,
      fromYear,
      toYear,
      albumType,
      label,
      explicit,
      minDuration,
      maxDuration,
      minFollowers,
      maxFollowers,
      sortBy,
      sortOrder,
    };

    return this.searchService.search(query, type, page || 1, limit || 20, filters);
  }
}
