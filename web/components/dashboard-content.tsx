"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardStats, useTopArtists } from "@/lib/hooks";
import { Users, Disc, Music, TrendingUp, ExternalLink, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function DashboardContent() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats();
  const { data: topArtists, isLoading: artistsLoading, error: artistsError } = useTopArtists(10);

  const isLoading = statsLoading || artistsLoading;
  const error = statsError || artistsError;

  if (error) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Card className="w-full max-w-md border-destructive/50 !bg-background/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Data</CardTitle>
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
          Dashboard Overview
        </h1>
        <p className="text-muted-foreground text-lg">
          Comprehensive analytics for your music collection
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-l-4 border-l-blue-500 !bg-background/10 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Artists
            </CardTitle>
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalArtists.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Unique artists in collection</p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-l-4 border-l-purple-500 !bg-background/10 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Albums
            </CardTitle>
            <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
              <Disc className="h-5 w-5 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalAlbums.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Albums catalogued</p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-l-4 border-l-green-500 !bg-background/10 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tracks
            </CardTitle>
            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
              <Music className="h-5 w-5 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalTracks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Songs in library</p>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-l-4 border-l-orange-500 !bg-background/10 backdrop-blur-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Popularity
            </CardTitle>
            <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
              <TrendingUp className="h-5 w-5 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.avgPopularity}<span className="text-lg text-muted-foreground">/100</span></div>
            <div className="mt-2 h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-1000"
                style={{ width: `${stats.avgPopularity}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow duration-300 !bg-background/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Quick Stats
            </CardTitle>
            <CardDescription>Additional metrics at a glance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center group">
              <span className="text-muted-foreground group-hover:text-foreground transition-colors">Unique Labels</span>
              <span className="font-bold text-lg">{stats.uniqueLabels}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between items-center group">
              <span className="text-muted-foreground group-hover:text-foreground transition-colors">Avg Tracks per Album</span>
              <span className="font-bold text-lg">{stats.avgTracksPerAlbum}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between items-center group">
              <span className="text-muted-foreground group-hover:text-foreground transition-colors">Total Followers</span>
              <span className="font-bold text-lg">{stats.totalFollowers.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-300 !bg-background/10 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Album Types</CardTitle>
                <CardDescription>Distribution of album types</CardDescription>
              </div>
              <Link
                href="/release-cohorts"
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 group"
              >
                <span>See More</span>
                <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(stats.albumTypes).map(([type, count]) => {
              const total = Object.values(stats.albumTypes).reduce((a, b) => a + b, 0);
              const percentage = ((count / total) * 100).toFixed(1);
              return (
                <div key={type} className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground capitalize font-medium">{type}</span>
                    <span className="font-bold">{count} <span className="text-xs text-muted-foreground">({percentage}%)</span></span>
                  </div>
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Top Artists */}
      <Card className="overflow-hidden !bg-background/10 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">Top 10 Most Popular Artists</CardTitle>
              <CardDescription>Based on Spotify popularity score</CardDescription>
            </div>
            <Link
              href="/artist-board"
              className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 group"
            >
              <span>See All Artists</span>
              <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            {topArtists.map((artist, index) => (
              <div key={artist._id} className="group flex flex-col items-center space-y-3">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-500 rounded-full opacity-0 group-hover:opacity-75 blur transition-opacity duration-300" />
                  <div className="relative h-32 w-32 rounded-full overflow-hidden bg-muted ring-2 ring-background group-hover:ring-primary transition-all duration-300 group-hover:scale-105">
                    {artist.images[0]?.url ? (
                      <Image
                        src={artist.images[0].url}
                        alt={artist.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full w-full">
                        <Users className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="absolute -top-2 -right-2 h-8 w-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                    #{index + 1}
                  </div>
                </div>
                <div className="text-center space-y-1 w-full">
                  <a
                    href={artist.external_urls.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-sm line-clamp-2 hover:text-primary transition-colors cursor-pointer flex items-center justify-center gap-1 group/link"
                  >
                    <span>{artist.name}</span>
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                  </a>
                  <div className="flex items-center justify-center gap-2">
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 rounded-full">
                      <TrendingUp className="h-3 w-3 text-primary" />
                      <span className="text-xs font-semibold text-primary">
                        {artist.popularity}/100
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Users className="h-3 w-3" />
                    {artist.followers.toLocaleString()}
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
