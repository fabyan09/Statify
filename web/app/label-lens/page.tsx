"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAlbums, useTracks } from "@/lib/hooks";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface LabelStats {
  label: string;
  albumCount: number;
  trackCount: number;
  avgPopularity: number;
  singles: number;
  albums: number;
  compilations: number;
}

interface LabelAccumulator {
  label: string;
  albumCount: number;
  trackCount: number;
  totalPopularity: number;
  singles: number;
  albums: number;
  compilations: number;
}

const barChartConfig = {
  avgPopularity: {
    label: "Avg Popularity",
    color: "#52525b",
  },
} satisfies ChartConfig;

const pieChartConfig = {
  singles: {
    label: "Singles",
    color: "#3b82f6",
  },
  albums: {
    label: "Albums",
    color: "#8b5cf6",
  },
  compilations: {
    label: "Compilations",
    color: "#ec4899",
  },
} satisfies ChartConfig;

export default function LabelLensPage() {
  const { data: albums, isLoading: albumsLoading, error: albumsError } = useAlbums();
  const { data: tracksResult, isLoading: tracksLoading, error: tracksError } = useTracks({ limit: 1000 });

  const [displayedLabels, setDisplayedLabels] = useState(20);

  const isLoading = albumsLoading || tracksLoading;
  const error = albumsError || tracksError;
  const tracks = tracksResult?.data || [];

  // Calculate label stats
  const labelStats: LabelStats[] = albums ? Object.entries(
    albums.reduce((acc, album) => {
      if (!acc[album.label]) {
        acc[album.label] = {
          label: album.label,
          albumCount: 0,
          trackCount: 0,
          totalPopularity: 0,
          singles: 0,
          albums: 0,
          compilations: 0,
        };
      }
      acc[album.label].albumCount++;
      acc[album.label].trackCount += album.track_ids.length;
      acc[album.label].totalPopularity += album.popularity;

      if (album.album_type === "single") acc[album.label].singles++;
      else if (album.album_type === "album") acc[album.label].albums++;
      else if (album.album_type === "compilation") acc[album.label].compilations++;

      return acc;
    }, {} as Record<string, LabelAccumulator>)
  )
    .map(([, stats]) => ({
      label: stats.label,
      albumCount: stats.albumCount,
      trackCount: stats.trackCount,
      avgPopularity: Math.round(stats.totalPopularity / stats.albumCount),
      singles: stats.singles,
      albums: stats.albums,
      compilations: stats.compilations,
    }))
    .sort((a, b) => b.avgPopularity - a.avgPopularity) : [];

  // Top 10 labels by popularity
  const top10Labels = labelStats.slice(0, 10);

  // Album type distribution (overall)
  const albumTypeData = albums ? [
    {
      type: "singles",
      count: albums.filter((a) => a.album_type === "single").length,
      fill: "var(--color-singles)",
    },
    {
      type: "albums",
      count: albums.filter((a) => a.album_type === "album").length,
      fill: "var(--color-albums)",
    },
    {
      type: "compilations",
      count: albums.filter((a) => a.album_type === "compilation").length,
      fill: "var(--color-compilations)",
    },
  ] : [];

  const totalAlbums = albumTypeData.reduce((acc, item) => acc + item.count, 0);

  if (error) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Card className="w-full max-w-md !bg-background/10">
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

  if (isLoading || !albums || !tracks) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading label data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Label Lens</h1>
        <p className="text-muted-foreground">
          Analyze {labelStats.length} unique labels across {albums.length} albums
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="!bg-background/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Labels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{labelStats.length}</div>
          </CardContent>
        </Card>

        <Card className="!bg-background/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Albums per Label</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(albums.length / labelStats.length).toFixed(1)}
            </div>
          </CardContent>
        </Card>

        <Card className="!bg-background/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Tracks per Label</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(tracks.length / labelStats.length).toFixed(1)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="!bg-background/10">
          <CardHeader>
            <CardTitle>Top 10 Labels by Popularity</CardTitle>
            <CardDescription>Average popularity score across albums</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={barChartConfig} className="h-[350px] w-full">
              <BarChart data={top10Labels}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="avgPopularity" fill="var(--color-avgPopularity)" radius={8} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="flex flex-col !bg-background/10">
          <CardHeader className="items-center pb-0">
            <CardTitle>Album Type Distribution</CardTitle>
            <CardDescription>Singles vs Albums vs Compilations</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer
              config={pieChartConfig}
              className="mx-auto aspect-square max-h-[300px]"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={albumTypeData}
                  dataKey="count"
                  nameKey="type"
                  innerRadius={60}
                  strokeWidth={5}
                >
                  <Legend
                    content={<ChartLegendContent nameKey="type" />}
                    className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col gap-2 text-sm">
            <div className="flex items-center gap-2 font-medium leading-none">
              Total of {totalAlbums} albums across all types
            </div>
            <div className="leading-none text-muted-foreground">
              Distribution of album types in the database
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Top Labels Table */}
      <Card className="!bg-background/10">
        <CardHeader>
          <CardTitle>Label Rankings</CardTitle>
          <CardDescription>
            Complete label statistics sorted by popularity ({displayedLabels} of {labelStats.length} labels)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {labelStats.slice(0, displayedLabels).map((stat, index) => (
              <div
                key={stat.label}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="text-2xl font-bold text-muted-foreground w-8">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{stat.label}</h3>
                    <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                      <span>{stat.albumCount} albums</span>
                      <span>{stat.trackCount} tracks</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex gap-2">
                    {stat.singles > 0 && (
                      <Badge variant="secondary">
                        {stat.singles} singles
                      </Badge>
                    )}
                    {stat.albums > 0 && (
                      <Badge variant="secondary">
                        {stat.albums} albums
                      </Badge>
                    )}
                    {stat.compilations > 0 && (
                      <Badge variant="secondary">
                        {stat.compilations} comps
                      </Badge>
                    )}
                  </div>
                  <Badge variant="outline" className="min-w-[80px] justify-center">
                    {stat.avgPopularity}/100
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          {displayedLabels < labelStats.length && (
            <div className="flex justify-center mt-6">
              <Button
                onClick={() => setDisplayedLabels((prev) => prev + 20)}
                variant="outline"
              >
                Show More ({labelStats.length - displayedLabels} remaining)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
