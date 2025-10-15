"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Artist, Track } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with force-graph
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
});

interface Collaboration {
  artist1: string;
  artist2: string;
  count: number;
}

interface GraphNode {
  id: string;
  name: string;
  image?: string;
  popularity: number;
  followers: number;
  genres: string[];
}

interface GraphLink {
  source: string;
  target: string;
  value: number;
}

export default function CollabNetworkPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const graphRef = useRef<any>();

  useEffect(() => {
    async function fetchData() {
      try {
        const [artistsRes, tracksRes] = await Promise.all([
          fetch("/api/artists"),
          fetch("/api/tracks"),
        ]);
        const artistsData = await artistsRes.json();
        const tracksData = await tracksRes.json();
        setArtists(artistsData);
        setTracks(tracksData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Calculate collaborations
  const { collaborations, topCollabs } = useMemo(() => {
    const collabMap = new Map<string, number>();

    tracks.forEach((track) => {
      if (track.artist_ids.length > 1) {
        // Multiple artists = collaboration
        for (let i = 0; i < track.artist_ids.length; i++) {
          for (let j = i + 1; j < track.artist_ids.length; j++) {
            const key = [track.artist_ids[i], track.artist_ids[j]]
              .sort()
              .join("-");
            collabMap.set(key, (collabMap.get(key) || 0) + 1);
          }
        }
      }
    });

    const collaborations: Collaboration[] = Array.from(collabMap.entries())
      .map(([key, count]) => {
        const [artist1, artist2] = key.split("-");
        return { artist1, artist2, count };
      })
      .filter((collab) => collab.count >= 1); // At least 1 collaboration

    const topCollabs = [...collaborations]
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return { collaborations, topCollabs };
  }, [tracks]);

  // Build graph data
  const graphData = useMemo(() => {
    const artistMap = new Map(artists.map((a) => [a._id, a]));

    // Get artists involved in collaborations
    const collabArtistIds = new Set<string>();
    collaborations.forEach(({ artist1, artist2 }) => {
      collabArtistIds.add(artist1);
      collabArtistIds.add(artist2);
    });

    const nodes: GraphNode[] = Array.from(collabArtistIds)
      .map((id) => {
        const artist = artistMap.get(id);
        if (!artist) return null;
        return {
          id: artist._id,
          name: artist.name,
          image: artist.images[0]?.url,
          popularity: artist.popularity,
          followers: artist.followers,
          genres: artist.genres,
        };
      })
      .filter((n): n is GraphNode => n !== null)
      .slice(0, 50); // Limit to 50 nodes for performance

    const nodeIds = new Set(nodes.map((n) => n.id));
    const links: GraphLink[] = collaborations
      .filter(
        ({ artist1, artist2 }) =>
          nodeIds.has(artist1) && nodeIds.has(artist2)
      )
      .map(({ artist1, artist2, count }) => ({
        source: artist1,
        target: artist2,
        value: count,
      }));

    return { nodes, links };
  }, [artists, collaborations]);

  const handleNodeClick = (node: any) => {
    const artist = artists.find((a) => a._id === node.id);
    if (artist) {
      setSelectedArtist(artist);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-muted-foreground">Loading collaboration data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Collaboration Network</h1>
        <p className="text-muted-foreground">
          Visualizing {collaborations.length} collaborations between{" "}
          {graphData.nodes.length} artists
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Collaborations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{collaborations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Collaborative Tracks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tracks.filter((t) => t.artist_ids.length > 1).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Artists with Collabs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{graphData.nodes.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Graph and Details */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Graph */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Collaboration Graph</CardTitle>
            <CardDescription>
              Click on a node to view artist details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[600px] border rounded-lg bg-muted/20">
              {typeof window !== "undefined" && (
                <ForceGraph2D
                  ref={graphRef}
                  graphData={graphData}
                  nodeLabel="name"
                  nodeAutoColorBy="popularity"
                  nodeVal={(node: any) => node.popularity / 10}
                  linkWidth={(link: any) => Math.sqrt(link.value)}
                  linkLabel={(link: any) =>
                    `${link.value} collaboration${link.value > 1 ? "s" : ""}`
                  }
                  onNodeClick={handleNodeClick}
                  nodeCanvasObject={(node: any, ctx, globalScale) => {
                    const label = node.name;
                    const fontSize = 12 / globalScale;
                    ctx.font = `${fontSize}px Sans-Serif`;
                    const textWidth = ctx.measureText(label).width;
                    const bckgDimensions = [textWidth, fontSize].map(
                      (n) => n + fontSize * 0.2
                    );

                    // Draw node
                    ctx.fillStyle = node.color || "#2563eb";
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, node.popularity / 10, 0, 2 * Math.PI);
                    ctx.fill();

                    // Draw label
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillStyle = "#000";
                    ctx.fillText(label, node.x, node.y + node.popularity / 10 + 10);
                  }}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Selected Artist Details */}
        <Card>
          <CardHeader>
            <CardTitle>Artist Details</CardTitle>
            <CardDescription>
              {selectedArtist ? "Selected artist info" : "Click on a node"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedArtist ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-3">
                  <div className="relative h-32 w-32 rounded-full overflow-hidden bg-muted">
                    {selectedArtist.images[0]?.url ? (
                      <Image
                        src={selectedArtist.images[0].url}
                        alt={selectedArtist.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-muted" />
                    )}
                  </div>
                  <h3 className="font-bold text-lg text-center">
                    {selectedArtist.name}
                  </h3>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Popularity</span>
                    <Badge variant="outline">
                      {selectedArtist.popularity}/100
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Followers</span>
                    <span className="font-semibold">
                      {selectedArtist.followers.toLocaleString()}
                    </span>
                  </div>
                </div>

                {selectedArtist.genres.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Genres
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {selectedArtist.genres.slice(0, 5).map((genre) => (
                        <Badge key={genre} variant="secondary" className="text-xs">
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <a
                  href={selectedArtist.external_urls.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center text-sm text-primary hover:underline"
                >
                  Open in Spotify →
                </a>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Click on any artist in the graph to view their details
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Collaborations */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Collaborations</CardTitle>
          <CardDescription>
            Most frequent artist collaborations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topCollabs.map((collab, index) => {
              const artist1 = artists.find((a) => a._id === collab.artist1);
              const artist2 = artists.find((a) => a._id === collab.artist2);

              if (!artist1 || !artist2) return null;

              return (
                <div
                  key={`${collab.artist1}-${collab.artist2}`}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-xl font-bold text-muted-foreground w-6">
                      #{index + 1}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative h-10 w-10 rounded-full overflow-hidden bg-muted">
                        {artist1.images[0]?.url && (
                          <Image
                            src={artist1.images[0].url}
                            alt={artist1.name}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                      <span className="font-semibold">{artist1.name}</span>
                      <span className="text-muted-foreground">×</span>
                      <div className="relative h-10 w-10 rounded-full overflow-hidden bg-muted">
                        {artist2.images[0]?.url && (
                          <Image
                            src={artist2.images[0].url}
                            alt={artist2.name}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                      <span className="font-semibold">{artist2.name}</span>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {collab.count} track{collab.count > 1 ? "s" : ""}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
