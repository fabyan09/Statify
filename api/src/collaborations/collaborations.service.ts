import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Track, TrackDocument } from '../tracks/entities/track.entity';
import { Artist, ArtistDocument } from '../artists/entities/artist.entity';

export interface Collaboration {
  artist1: string;
  artist2: string;
  count: number;
}

export interface CollaborationNode {
  id: string;
  name: string;
  image?: string;
  popularity: number;
  followers: number;
  genres: string[];
}

export interface CollaborationResponse {
  collaborations: Collaboration[];
  nodes: CollaborationNode[];
  stats: {
    totalCollaborations: number;
    collaborativeTracks: number;
    artistsWithCollabs: number;
  };
}

@Injectable()
export class CollaborationsService {
  constructor(
    @InjectModel(Track.name) private trackModel: Model<TrackDocument>,
    @InjectModel(Artist.name) private artistModel: Model<ArtistDocument>,
  ) {}

  async getCollaborations(
    minCollabCount: number = 1,
  ): Promise<CollaborationResponse> {
    // Step 1: Get top 300 French rap artists
    const frenchRapArtists = await this.artistModel
      .find({
        genres: { $in: ['french rap', 'french hip hop', 'rap francais'] },
      })
      .sort({ popularity: -1 }) // Sort by popularity descending
      .limit(300)
      .select('_id')
      .lean()
      .exec();

    const frenchRapArtistIds = frenchRapArtists.map((a) => a._id.toString());

    // Step 2: Fetch only collaborative tracks involving these artists
    const collaborativeTracks = await this.trackModel
      .find({
        $expr: { $gt: [{ $size: '$artist_ids' }, 1] },
        artist_ids: { $in: frenchRapArtistIds },
      })
      .select('artist_ids')
      .lean()
      .exec();

    // Step 3: Calculate collaborations (only between French rap artists)
    const collabMap = new Map<string, number>();
    const frenchRapArtistSet = new Set(frenchRapArtistIds);

    collaborativeTracks.forEach((track) => {
      if (track.artist_ids.length > 1) {
        // Filter to only include French rap artists in this track
        const frenchArtistsInTrack = track.artist_ids.filter((id) =>
          frenchRapArtistSet.has(id),
        );

        // Only count collaborations between French rap artists
        if (frenchArtistsInTrack.length > 1) {
          for (let i = 0; i < frenchArtistsInTrack.length; i++) {
            for (let j = i + 1; j < frenchArtistsInTrack.length; j++) {
              const key = [frenchArtistsInTrack[i], frenchArtistsInTrack[j]]
                .sort()
                .join('-');
              collabMap.set(key, (collabMap.get(key) || 0) + 1);
            }
          }
        }
      }
    });

    // Step 4: Filter by minimum collaboration count
    const collaborations: Collaboration[] = Array.from(collabMap.entries())
      .map(([key, count]) => {
        const [artist1, artist2] = key.split('-');
        return { artist1, artist2, count };
      })
      .filter((collab) => collab.count >= minCollabCount);

    // Step 5: Get unique artist IDs from collaborations
    const collabArtistIds = new Set<string>();
    collaborations.forEach(({ artist1, artist2 }) => {
      collabArtistIds.add(artist1);
      collabArtistIds.add(artist2);
    });

    // Step 6: Fetch artist details for nodes
    const artists = await this.artistModel
      .find({ _id: { $in: Array.from(collabArtistIds) } })
      .lean()
      .exec();

    const nodes: CollaborationNode[] = artists.map((artist) => ({
      id: artist._id.toString(),
      name: artist.name,
      image: artist.images?.[0]?.url,
      popularity: artist.popularity,
      followers: artist.followers,
      genres: artist.genres,
    }));

    // Step 7: Calculate stats
    const stats = {
      totalCollaborations: collaborations.length,
      collaborativeTracks: collaborativeTracks.length,
      artistsWithCollabs: collabArtistIds.size,
    };

    return {
      collaborations,
      nodes,
      stats,
    };
  }
}
