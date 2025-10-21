export class RecommendationSectionDto {
  title: string;
  description: string;
  icon: string; // 'sparkles' | 'tag' | 'clock' | 'music' | 'trending-up'
  type: 'artist' | 'album' | 'track';
  items: any[]; // Will contain Artist[], Album[], or Track[]
}

export class RecommendationsResponseDto {
  sections: RecommendationSectionDto[];
}
