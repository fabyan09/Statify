import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { CollaborationsService } from './collaborations.service';

@Controller('collaborations')
export class CollaborationsController {
  constructor(
    private readonly collaborationsService: CollaborationsService,
  ) {}

  @Get()
  getCollaborations(
    @Query('minCount', new ParseIntPipe({ optional: true })) minCount?: number,
  ) {
    return this.collaborationsService.getCollaborations(minCount || 1);
  }
}
