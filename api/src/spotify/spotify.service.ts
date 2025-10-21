import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';

@Injectable()
export class SpotifyService {
  private spotifyApi: SpotifyApi;

  constructor(private configService: ConfigService) {
    const clientId = this.configService.get<string>('SPOTIFY_CLIENT_ID');
    const clientSecret = this.configService.get<string>('SPOTIFY_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('Spotify API credentials are not configured');
    }

    this.spotifyApi = SpotifyApi.withClientCredentials(clientId, clientSecret);
  }

  /**
   * Récupère toutes les tracks d'un album depuis l'API Spotify
   * @param albumId L'ID Spotify de l'album
   * @returns Les tracks de l'album
   */
  async getAlbumTracks(albumId: string) {
    try {
      const album = await this.spotifyApi.albums.get(albumId);
      return album.tracks.items;
    } catch (error) {
      throw new Error(`Failed to fetch album tracks from Spotify: ${error.message}`);
    }
  }

  /**
   * Récupère les informations complètes d'un album depuis l'API Spotify
   * @param albumId L'ID Spotify de l'album
   * @returns Les informations de l'album
   */
  async getAlbum(albumId: string) {
    try {
      return await this.spotifyApi.albums.get(albumId);
    } catch (error) {
      throw new Error(`Failed to fetch album from Spotify: ${error.message}`);
    }
  }

  /**
   * Récupère les informations complètes de plusieurs tracks depuis l'API Spotify
   * L'API Spotify permet de récupérer jusqu'à 50 tracks à la fois
   * @param trackIds Les IDs Spotify des tracks
   * @returns Les informations complètes des tracks (incluant la popularité)
   */
  async getTracks(trackIds: string[]) {
    try {
      const tracks = await this.spotifyApi.tracks.get(trackIds);
      return tracks;
    } catch (error) {
      throw new Error(`Failed to fetch tracks from Spotify: ${error.message}`);
    }
  }

  /**
   * Récupère tous les albums d'un artiste depuis l'API Spotify
   * @param artistId L'ID Spotify de l'artiste
   * @returns Les albums de l'artiste (albums, singles, compilations)
   */
  async getArtistAlbums(artistId: string) {
    try {
      const allAlbums: any[] = [];
      let offset = 0;
      const limit = 50; // Maximum autorisé par l'API
      let hasMore = true;

      while (hasMore) {
        const response = await this.spotifyApi.artists.albums(
          artistId,
          'album,single,compilation', // Include all types
          undefined, // market
          limit,
          offset,
        );

        allAlbums.push(...response.items);

        // Check if there are more items to fetch
        if (response.items.length < limit || allAlbums.length >= response.total) {
          hasMore = false;
        } else {
          offset += limit;
        }
      }

      return allAlbums;
    } catch (error) {
      throw new Error(`Failed to fetch artist albums from Spotify: ${error.message}`);
    }
  }

  /**
   * Récupère les informations complètes de plusieurs albums depuis l'API Spotify
   * L'API Spotify permet de récupérer jusqu'à 20 albums à la fois
   * @param albumIds Les IDs Spotify des albums
   * @returns Les informations complètes des albums
   */
  async getAlbums(albumIds: string[]) {
    try {
      // Split into chunks of 20 (API limit)
      const chunks: string[][] = [];
      for (let i = 0; i < albumIds.length; i += 20) {
        chunks.push(albumIds.slice(i, i + 20));
      }

      const allAlbums: any[] = [];
      for (const chunk of chunks) {
        const albums = await this.spotifyApi.albums.get(chunk);
        allAlbums.push(...albums);
      }

      return allAlbums;
    } catch (error) {
      throw new Error(`Failed to fetch albums from Spotify: ${error.message}`);
    }
  }
}
