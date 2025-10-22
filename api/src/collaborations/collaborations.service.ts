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
    // Fetch all tracks with multiple artists (collaborations)
    const collaborativeTracks = await this.trackModel
      .find({
        $expr: { $gt: [{ $size: '$artist_ids' }, 1] },
      })
      .select('artist_ids')
      .lean()
      .exec();

    // Calculate collaborations
    const collabMap = new Map<string, number>();

    collaborativeTracks.forEach((track) => {
      if (track.artist_ids.length > 1) {
        for (let i = 0; i < track.artist_ids.length; i++) {
          for (let j = i + 1; j < track.artist_ids.length; j++) {
            const key = [track.artist_ids[i], track.artist_ids[j]]
              .sort()
              .join('-');
            collabMap.set(key, (collabMap.get(key) || 0) + 1);
          }
        }
      }
    });

    // Filter by minimum collaboration count
    const collaborations: Collaboration[] = Array.from(collabMap.entries())
      .map(([key, count]) => {
        const [artist1, artist2] = key.split('-');
        return { artist1, artist2, count };
      })
      .filter((collab) => collab.count >= minCollabCount);

    // Get unique artist IDs from collaborations
    const collabArtistIds = new Set<string>();
    collaborations.forEach(({ artist1, artist2 }) => {
      collabArtistIds.add(artist1);
      collabArtistIds.add(artist2);
    });

    // Fetch artist details for nodes
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

    // Calculate stats
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
