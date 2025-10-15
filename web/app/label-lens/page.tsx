"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Album, Track } from "@/lib/types";
import { useAlbums, useTracks } from "@/lib/hooks";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";

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

const COLORS = [
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#65a30d",
  "#0891b2",
  "#4f46e5",
  "#be123c",
];

export default function LabelLensPage() {
  const { data: albums, isLoading: albumsLoading, error: albumsError } = useAlbums();
  const { data: tracks, isLoading: tracksLoading, error: tracksError } = useTracks();

  const isLoading = albumsLoading || tracksLoading;
  const error = albumsError || tracksError;

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
    .map(([_, stats]) => ({
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
      name: "Singles",
      value: albums.filter((a) => a.album_type === "single").length,
    },
    {
      name: "Albums",
      value: albums.filter((a) => a.album_type === "album").length,
    },
    {
      name: "Compilations",
      value: albums.filter((a) => a.album_type === "compilation").length,
    },
  ] : [];

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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Labels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{labelStats.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Albums per Label</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(albums.length / labelStats.length).toFixed(1)}
            </div>
          </CardContent>
        </Card>

        <Card>
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
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Labels by Popularity</CardTitle>
            <CardDescription>Average popularity score across albums</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={top10Labels}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="avgPopularity" fill="#2563eb" name="Avg Popularity" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Album Type Distribution</CardTitle>
            <CardDescription>Singles vs Albums vs Compilations</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={albumTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ({ name, percent }: any) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {albumTypeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Labels Table */}
      <Card>
        <CardHeader>
          <CardTitle>Label Rankings</CardTitle>
          <CardDescription>Complete label statistics sorted by popularity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {labelStats.slice(0, 20).map((stat, index) => (
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
        </CardContent>
      </Card>
    </div>
  );
}
