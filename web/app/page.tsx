import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchArtists, fetchAlbums, fetchTracks } from "@/lib/api";
import { Users, Disc, Music, TrendingUp } from "lucide-react";
import Image from "next/image";

export default async function HomePage() {
  try {
    const [artists, albums, tracks] = await Promise.all([
      fetchArtists(),
      fetchAlbums(),
      fetchTracks(),
    ]);

    // Calculate KPIs
    const totalArtists = artists.length;
    const totalAlbums = albums.length;
    const totalTracks = tracks.length;

    const avgPopularity = artists.length > 0
      ? Math.round(artists.reduce((sum, a) => sum + a.popularity, 0) / artists.length)
      : 0;

    const uniqueLabels = new Set(albums.map((a) => a.label)).size;

    // Top 10 popular artists
    const topArtists = artists
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 10);

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Dashboard Overview</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics for your music collection
          </p>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Artists
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalArtists.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Albums
              </CardTitle>
              <Disc className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAlbums.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Tracks
              </CardTitle>
              <Music className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalTracks.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Popularity
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgPopularity}/100</div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
              <CardDescription>Additional metrics at a glance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unique Labels</span>
                <span className="font-semibold">{uniqueLabels}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg Tracks per Album</span>
                <span className="font-semibold">
                  {albums.length > 0 ? (totalTracks / totalAlbums).toFixed(1) : 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Followers</span>
                <span className="font-semibold">
                  {artists.reduce((sum, a) => sum + a.followers, 0).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Album Types</CardTitle>
              <CardDescription>Distribution of album types</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(
                albums.reduce((acc, album) => {
                  acc[album.album_type] = (acc[album.album_type] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([type, count]) => (
                <div key={type} className="flex justify-between">
                  <span className="text-muted-foreground capitalize">{type}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Top Artists */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Most Popular Artists</CardTitle>
            <CardDescription>Based on Spotify popularity score</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
              {topArtists.map((artist) => (
                <div key={artist._id} className="flex flex-col items-center space-y-2">
                  <div className="relative h-32 w-32 rounded-full overflow-hidden bg-muted">
                    {artist.images[0]?.url ? (
                      <Image
                        src={artist.images[0].url}
                        alt={artist.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full w-full">
                        <Users className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm line-clamp-2">{artist.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {artist.popularity}/100
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {artist.followers.toLocaleString()} followers
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error Loading Data</CardTitle>
            <CardDescription>
              Failed to fetch data from the API. Make sure the API server is running.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "Unknown error"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
}
