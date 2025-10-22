import { Injectable, Inject, forwardRef, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CreateArtistDto } from './dto/create-artist.dto';
import { UpdateArtistDto } from './dto/update-artist.dto';
import { Artist, ArtistDocument } from './entities/artist.entity';
import { SpotifyService } from '../spotify/spotify.service';
import { AlbumsService } from '../albums/albums.service';
import { TracksService } from '../tracks/tracks.service';

@Injectable()
export class ArtistsService {
  constructor(
    @InjectModel(Artist.name) private artistModel: Model<ArtistDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private spotifyService: SpotifyService,
    @Inject(forwardRef(() => AlbumsService))
    private albumsService: AlbumsService,
    @Inject(forwardRef(() => TracksService))
    private tracksService: TracksService,
  ) {}

  async create(createArtistDto: CreateArtistDto) {
    const createdArtist = new this.artistModel(createArtistDto);
    const result = await createdArtist.save();
    // Invalidate cache
    await this.cacheManager.del('all-artists');
    return result;
  }

  async findAll() {
    const cacheKey = 'all-artists';
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const artists = await this.artistModel.find().exec();
    await this.cacheManager.set(cacheKey, artists);
    return artists;
  }

  async findOne(id: string) {
    return this.artistModel.findById(id).exec();
  }

  async findByIds(ids: string[]) {
    return this.artistModel.find({ _id: { $in: ids } }).exec();
  }

  async getArtistAlbums(artistId: string) {
    // Cette méthode sera implémentée dans le controller en utilisant AlbumsService
    // pour éviter la dépendance circulaire
    throw new Error('Use controller method instead');
  }

  async getArtistTracks(artistId: string) {
    // Cette méthode sera implémentée dans le controller en utilisant TracksService
    // pour éviter la dépendance circulaire
    throw new Error('Use controller method instead');
  }

  async update(id: string, updateArtistDto: UpdateArtistDto) {
    const result = await this.artistModel
      .findByIdAndUpdate(id, updateArtistDto, { new: true })
      .exec();
    // Invalidate cache
    await this.cacheManager.del('all-artists');
    return result;
  }

  async remove(id: string) {
    const result = await this.artistModel.findByIdAndDelete(id).exec();
    // Invalidate cache
    await this.cacheManager.del('all-artists');
    return result;
  }

  private async invalidateArtistsCache() {
    await this.cacheManager.del('all-artists');
  }

  async syncAlbumsFromSpotify(artistId: string) {
    console.log(`[ARTIST-SYNC] Starting sync for artist ${artistId}`);

    try {
      // 1. Récupérer l'artiste depuis la DB
      const artist = await this.artistModel.findById(artistId).exec();
      if (!artist) {
        throw new NotFoundException(`Artist with ID ${artistId} not found`);
      }

      console.log(`[ARTIST-SYNC] Artist found: ${artist.name}, spotify_synced: ${artist.spotify_synced}`);

      // 2. Vérifier si l'artiste a déjà été synced
      if (artist.spotify_synced) {
        console.log(`[ARTIST-SYNC] Artist already synced, skipping`);
        return {
          message: 'Artist already synced',
          artist,
          syncedAlbums: 0,
          syncedTracks: 0,
        };
      }

      // 3. Récupérer les albums de l'artiste depuis l'API Spotify
      console.log(`[ARTIST-SYNC] Fetching albums from Spotify API`);
      const spotifyAlbums = await this.spotifyService.getArtistAlbums(artistId);
      console.log(`[ARTIST-SYNC] Received ${spotifyAlbums.length} albums from Spotify`);

      // 4. Récupérer les informations complètes des albums (pour avoir la popularité et autres détails)
      console.log(`[ARTIST-SYNC] Fetching complete album info`);
      const albumIds = spotifyAlbums.map((album: any) => album.id);
      const completeAlbumsData: any[] = await this.spotifyService.getAlbums(albumIds);
      console.log(`[ARTIST-SYNC] Received complete info for ${completeAlbumsData.length} albums`);

      // 5. Upsert les albums en base de données et sync leurs tracks (EN PARALLÈLE PAR BATCH)
      const createdAlbumIds: string[] = [];
      let totalTracksSynced = 0;

      // Traiter les albums par batch de 5 en parallèle pour optimiser la performance
      const BATCH_SIZE = 5;
      console.log(`[ARTIST-SYNC] Processing ${completeAlbumsData.length} albums in batches of ${BATCH_SIZE}...`);

      for (let i = 0; i < completeAlbumsData.length; i += BATCH_SIZE) {
        const batch = completeAlbumsData.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(completeAlbumsData.length / BATCH_SIZE);

        console.log(`[ARTIST-SYNC] Processing batch ${batchNumber}/${totalBatches} (${batch.length} albums)`);

        // Traiter tous les albums du batch en parallèle
        const batchPromises = batch.map(async (spotifyAlbum) => {
          try {
            // Upsert l'album avec les informations de Spotify (skip cache invalidation pour optimiser)
            const albumData = {
              name: spotifyAlbum.name,
              album_type: spotifyAlbum.album_type,
              total_tracks: spotifyAlbum.total_tracks,
              release_date: spotifyAlbum.release_date,
              release_date_precision: spotifyAlbum.release_date_precision,
              popularity: spotifyAlbum.popularity,
              href: spotifyAlbum.href,
              uri: spotifyAlbum.uri,
              external_urls: spotifyAlbum.external_urls,
              images: spotifyAlbum.images,
              label: spotifyAlbum.label,
              artist_ids: spotifyAlbum.artists.map(artist => artist.id),
              genres: spotifyAlbum.genres || [],
              track_ids: [], // Will be filled by syncTracksFromSpotify
              spotify_synced: false, // Will be set to true by syncTracksFromSpotify
            };

            const upsertedAlbum = await this.albumsService.upsert(spotifyAlbum.id, albumData, { skipCacheInvalidation: true });

            // Synchroniser les tracks de l'album
            const syncResult = await this.albumsService.syncTracksFromSpotify(spotifyAlbum.id);

            return {
              albumId: upsertedAlbum._id,
              tracksSynced: syncResult.syncedTracks || 0,
            };
          } catch (error) {
            console.error(`[ARTIST-SYNC] Failed to process album ${spotifyAlbum.id}:`, error.message);
            return null;
          }
        });

        // Attendre que tous les albums du batch soient traités
        const batchResults = await Promise.all(batchPromises);

        // Collecter les résultats
        for (const result of batchResults) {
          if (result) {
            createdAlbumIds.push(result.albumId);
            totalTracksSynced += result.tracksSynced;
          }
        }
      }

      // 6. Mettre à jour l'artiste avec les album_ids et spotify_synced = true
      const updatedArtist = await this.artistModel
        .findByIdAndUpdate(
          artistId,
          {
            album_ids: createdAlbumIds,
            spotify_synced: true,
          },
          { new: true },
        )
        .exec();

      // 7. Invalider tous les caches une seule fois à la fin (optimisation)
      console.log(`[ARTIST-SYNC] Invalidating caches...`);
      await Promise.all([
        this.invalidateArtistsCache(),
        this.albumsService.invalidateAlbumsCache(),
        this.tracksService.invalidateTracksCache(),
      ]);

      console.log(`[ARTIST-SYNC] Sync completed! ${createdAlbumIds.length} albums and ${totalTracksSynced} tracks synced`);

      return {
        message: 'Artist albums and tracks synced successfully',
        artist: updatedArtist,
        syncedAlbums: createdAlbumIds.length,
        syncedTracks: totalTracksSynced,
      };
    } catch (error) {
      console.error(`[ARTIST-SYNC] Error syncing artist ${artistId}:`, error.message);
      throw error;
    }
  }
}
