"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Album } from "@/lib/types";
import { useAlbums } from "@/lib/hooks";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";

interface CohortData {
  period: string;
  releases: number;
  avgPopularity: number;
  singles: number;
  albums: number;
  compilations: number;
}

interface CohortAccumulator {
  period: string;
  releases: number;
  totalPopularity: number;
  singles: number;
  albums: number;
  compilations: number;
}

export default function ReleaseCohortsPage() {
  const { data: albums, isLoading, error } = useAlbums();

  // Group by year
  const yearlyData: CohortData[] = albums ? Object.entries(
    albums.reduce((acc, album) => {
      const year = album.release_date.split("-")[0];
      if (!acc[year]) {
        acc[year] = {
          period: year,
          releases: 0,
          totalPopularity: 0,
          singles: 0,
          albums: 0,
          compilations: 0,
        };
      }
      acc[year].releases++;
      acc[year].totalPopularity += album.popularity;
      if (album.album_type === "single") acc[year].singles++;
      else if (album.album_type === "album") acc[year].albums++;
      else if (album.album_type === "compilation") acc[year].compilations++;
      return acc;
    }, {} as Record<string, CohortAccumulator>)
  )
    .map(([_, data]) => ({
      period: data.period,
      releases: data.releases,
      avgPopularity: Math.round(data.totalPopularity / data.releases),
      singles: data.singles,
      albums: data.albums,
      compilations: data.compilations,
    }))
    .sort((a, b) => a.period.localeCompare(b.period)) : [];

  // Group by year-month
  const monthlyData: CohortData[] = albums ? Object.entries(
    albums.reduce((acc, album) => {
      const [year, month] = album.release_date.split("-");
      const yearMonth = `${year}-${month}`;
      if (!acc[yearMonth]) {
        acc[yearMonth] = {
          period: yearMonth,
          releases: 0,
          totalPopularity: 0,
          singles: 0,
          albums: 0,
          compilations: 0,
        };
      }
      acc[yearMonth].releases++;
      acc[yearMonth].totalPopularity += album.popularity;
      if (album.album_type === "single") acc[yearMonth].singles++;
      else if (album.album_type === "album") acc[yearMonth].albums++;
      else if (album.album_type === "compilation") acc[yearMonth].compilations++;
      return acc;
    }, {} as Record<string, CohortAccumulator>)
  )
    .map(([_, data]) => ({
      period: data.period,
      releases: data.releases,
      avgPopularity: Math.round(data.totalPopularity / data.releases),
      singles: data.singles,
      albums: data.albums,
      compilations: data.compilations,
    }))
    .sort((a, b) => a.period.localeCompare(b.period))
    .slice(-36) : []; // Last 36 months

  // Top performing cohorts
  const topCohorts = [...yearlyData]
    .sort((a, b) => b.avgPopularity - a.avgPopularity)
    .slice(0, 10);

  if (error) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error Loading Data</CardTitle>
            <CardDescription>
              Failed to fetch albums from the API. Make sure the API server is running.
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

  if (isLoading || !albums) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading release data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Release Cohorts</h1>
        <p className="text-muted-foreground">
          Analyze release patterns across {yearlyData.length} years
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Releases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{albums.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Years Span</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {yearlyData[0]?.period} - {yearlyData[yearlyData.length - 1]?.period}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Releases/Year</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(albums.length / yearlyData.length).toFixed(1)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Peak Year</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {[...yearlyData].sort((a, b) => b.releases - a.releases)[0]?.period}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Charts */}
      <Tabs defaultValue="yearly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="yearly">Yearly View</TabsTrigger>
          <TabsTrigger value="monthly">Monthly View (Last 3 Years)</TabsTrigger>
        </TabsList>

        <TabsContent value="yearly" className="space-y-4">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Releases by Year</CardTitle>
                <CardDescription>Number of releases per year</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={yearlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="singles" fill="#2563eb" name="Singles" stackId="a" />
                    <Bar dataKey="albums" fill="#7c3aed" name="Albums" stackId="a" />
                    <Bar dataKey="compilations" fill="#db2777" name="Compilations" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Popularity by Year</CardTitle>
                <CardDescription>How popularity trends over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={yearlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="avgPopularity"
                      stroke="#2563eb"
                      strokeWidth={2}
                      name="Avg Popularity"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Releases by Month</CardTitle>
              <CardDescription>Monthly release patterns (last 36 months)</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="period"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="singles" fill="#2563eb" name="Singles" stackId="a" />
                  <Bar dataKey="albums" fill="#7c3aed" name="Albums" stackId="a" />
                  <Bar dataKey="compilations" fill="#db2777" name="Compilations" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Top Performing Years */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Cohorts</CardTitle>
          <CardDescription>Years with highest average popularity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topCohorts.map((cohort, index) => (
              <div
                key={cohort.period}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-xl font-bold text-muted-foreground w-6">
                    #{index + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold">{cohort.period}</h3>
                    <p className="text-sm text-muted-foreground">
                      {cohort.releases} releases
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {cohort.singles > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {cohort.singles}S
                      </Badge>
                    )}
                    {cohort.albums > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {cohort.albums}A
                      </Badge>
                    )}
                    {cohort.compilations > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {cohort.compilations}C
                      </Badge>
                    )}
                  </div>
                  <Badge variant="outline" className="min-w-[70px] justify-center">
                    {cohort.avgPopularity}/100
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
