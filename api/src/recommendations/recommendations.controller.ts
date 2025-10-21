import { Controller, Get, Param, Logger } from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { RecommendationsResponseDto } from './dto/recommendation-section.dto';

@Controller('recommendations')
export class RecommendationsController {
  private readonly logger = new Logger(RecommendationsController.name);

  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get(':userId')
  async getRecommendations(@Param('userId') userId: string): Promise<RecommendationsResponseDto> {
    this.logger.log(`GET /recommendations/${userId}`);
    return this.recommendationsService.getRecommendations(userId);
  }
}
