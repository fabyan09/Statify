import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('dashboard')
  async getDashboardStats() {
    return this.statsService.getDashboardStats();
  }

  @Get('artists/top')
  async getTopArtists(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.statsService.getTopArtists(limit || 10);
  }

  @Get('release-cohorts')
  async getReleaseCohorts(
    @Query('granularity') granularity?: 'year' | 'month',
  ) {
    return this.statsService.getReleaseCohorts(granularity || 'year');
  }

  @Get('labels')
  async getLabelStats() {
    return this.statsService.getLabelStats();
  }

  @Get('collaborations')
  async getCollaborations() {
    return this.statsService.getCollaborations();
  }
}
