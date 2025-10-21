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

@Injectable()
export class ArtistsService {
  constructor(
    @InjectModel(Artist.name) private artistModel: Model<ArtistDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private spotifyService: SpotifyService,
    @Inject(forwardRef(() => AlbumsService))
    private albumsService: AlbumsService,
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

      // 5. Upsert les albums en base de données et sync leurs tracks
      const createdAlbumIds: string[] = [];
      let totalTracksSynced = 0;

      // Fonction helper pour attendre
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      // Traiter les albums un par un pour éviter le rate limiting Spotify
      for (let i = 0; i < completeAlbumsData.length; i++) {
        const spotifyAlbum = completeAlbumsData[i];
        try {
          console.log(`[ARTIST-SYNC] Processing album ${i + 1}/${completeAlbumsData.length}: ${spotifyAlbum.name}`);

          // Upsert l'album avec les informations de Spotify
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

          const upsertedAlbum = await this.albumsService.upsert(spotifyAlbum.id, albumData);
          createdAlbumIds.push(upsertedAlbum._id);

          // Synchroniser les tracks de l'album
          console.log(`[ARTIST-SYNC] Syncing tracks for album: ${spotifyAlbum.name}`);
          const syncResult = await this.albumsService.syncTracksFromSpotify(spotifyAlbum.id);

          if (syncResult.syncedTracks) {
            totalTracksSynced += syncResult.syncedTracks;
          }

          // Attendre un peu entre chaque album pour éviter le rate limiting (sauf pour le dernier)
          if (i < completeAlbumsData.length - 1) {
            await delay(200); // 200ms entre chaque album (réduit pour éviter MongoDB timeout)
          }
        } catch (error) {
          console.error(`Failed to upsert album ${spotifyAlbum.id}:`, error.message);
          // Continuer avec les autres albums même si un échoue
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

      // Invalidate cache
      await this.invalidateArtistsCache();

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
