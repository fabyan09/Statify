"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardStats, useTopArtists } from "@/lib/hooks";
import { Users, Disc, Music, TrendingUp } from "lucide-react";
import Image from "next/image";

export function DashboardContent() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats();
  const { data: topArtists, isLoading: artistsLoading, error: artistsError } = useTopArtists(10);

  const isLoading = statsLoading || artistsLoading;
  const error = statsError || artistsError;

  if (error) {
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

  if (isLoading || !stats || !topArtists) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your music data...</p>
        </div>
      </div>
    );
  }

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
            <div className="text-2xl font-bold">{stats.totalArtists.toLocaleString()}</div>
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
            <div className="text-2xl font-bold">{stats.totalAlbums.toLocaleString()}</div>
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
            <div className="text-2xl font-bold">{stats.totalTracks.toLocaleString()}</div>
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
            <div className="text-2xl font-bold">{stats.avgPopularity}/100</div>
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
              <span className="font-semibold">{stats.uniqueLabels}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Avg Tracks per Album</span>
              <span className="font-semibold">{stats.avgTracksPerAlbum}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Followers</span>
              <span className="font-semibold">{stats.totalFollowers.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Album Types</CardTitle>
            <CardDescription>Distribution of album types</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(stats.albumTypes).map(([type, count]) => (
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
}
