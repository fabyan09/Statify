"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Artist, Track } from "@/lib/types";
import { useArtists, useTracks } from "@/lib/hooks";
import { Badge } from "@/components/ui/badge";
import NextImage from "next/image";
import dynamic from "next/dynamic";
import ElasticSlider from "./ElasticSlider";
import { Users, Minus, Network, Zap } from "lucide-react";

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
  const { data: artists, isLoading: artistsLoading, error: artistsError } = useArtists();
  const { data: tracks, isLoading: tracksLoading, error: tracksError } = useTracks();

  const isLoading = artistsLoading || tracksLoading;
  const error = artistsError || tracksError;

  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [highlightedNode, setHighlightedNode] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphRef = useRef<any>(null);
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const hasZoomedRef = useRef(false);

  // Graph customization options
  const [maxNodes, setMaxNodes] = useState(50);
  const [linkDistance, setLinkDistance] = useState(150);
  const [chargeStrength, setChargeStrength] = useState(-500);
  const [minCollabCount, setMinCollabCount] = useState(1);

  // Calculate collaborations
  const { collaborations, topCollabs } = useMemo(() => {
    if (!tracks) return { collaborations: [], topCollabs: [] };

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
      .filter((collab) => collab.count >= minCollabCount);

    const topCollabs = [...collaborations]
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return { collaborations, topCollabs };
  }, [tracks, minCollabCount]);

  // Build graph data
  const graphData = useMemo(() => {
    if (!artists) return { nodes: [], links: [] };

    const artistMap = new Map(artists.map((a) => [a._id, a]));

    // Get artists involved in collaborations
    const collabArtistIds = new Set<string>();
    collaborations.forEach(({ artist1, artist2 }) => {
      collabArtistIds.add(artist1);
      collabArtistIds.add(artist2);
    });

    const nodes = Array.from(collabArtistIds)
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
        } as GraphNode;
      })
      .filter((n): n is GraphNode => n !== null)
      .slice(0, maxNodes);

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
  }, [artists, collaborations, maxNodes]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleNodeClick = (node: any) => {
    if (!artists) return;
    const artist = artists.find((a) => a._id === node.id);
    if (artist) {
      setSelectedArtist(artist);
      setHighlightedNode(node.id === highlightedNode ? null : node.id);
    }
  };

  const handleArtistSelect = (artist: Artist) => {
    setSelectedArtist(artist);
    setHighlightedNode(artist._id);
  };

  // Center graph on load and configure forces
  useEffect(() => {
    if (graphRef.current && graphData.nodes.length > 0) {
      if (!hasZoomedRef.current) {
        setTimeout(() => {
          graphRef.current?.zoomToFit(600, 600);
          hasZoomedRef.current = true;
        }, 100);
      }

      // Configure link distance
      graphRef.current?.d3Force('link')?.distance(linkDistance);
      graphRef.current?.d3Force('charge')?.strength(chargeStrength);
    }
  }, [graphData, linkDistance, chargeStrength]);

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

  if (isLoading || !artists || !tracks) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading collaboration data...</p>
        </div>
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

      {/* Graph Customization */}
      <Card>
        <CardHeader>
          <CardTitle>Graph Settings</CardTitle>
          <CardDescription>Customize the visualization parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <ElasticSlider
              label="Max Artists"
              description="10-200 nodes"
              defaultValue={maxNodes}
              startingValue={10}
              maxValue={200}
              isStepped
              stepSize={10}
              leftIcon={<Users size={20} />}
              rightIcon={<Users size={20} />}
              onChange={setMaxNodes}
            />

            <ElasticSlider
              label="Min Collaborations"
              description="Filter by track count"
              defaultValue={minCollabCount}
              startingValue={1}
              maxValue={10}
              isStepped
              stepSize={1}
              leftIcon={<Minus size={20} />}
              rightIcon={<Network size={20} />}
              onChange={setMinCollabCount}
            />

            <ElasticSlider
              label="Link Distance"
              description="50-500 px"
              defaultValue={linkDistance}
              startingValue={50}
              maxValue={500}
              isStepped
              stepSize={10}
              leftIcon={<Minus size={20} />}
              rightIcon={<Network size={20} />}
              onChange={setLinkDistance}
            />

            <ElasticSlider
              label="Repulsion Strength"
              description="-2000 to -50"
              defaultValue={chargeStrength}
              startingValue={-2000}
              maxValue={-50}
              isStepped
              stepSize={50}
              leftIcon={<Zap size={20} />}
              rightIcon={<Zap size={20} />}
              onChange={setChargeStrength}
            />
          </div>
        </CardContent>
      </Card>

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
            <div className="w-full h-[600px] border rounded-lg bg-muted/20 overflow-hidden relative">
              {typeof window !== "undefined" && (
                <>
                {/* eslint-disable @typescript-eslint/no-explicit-any */}
                <ForceGraph2D
                  ref={graphRef}
                  graphData={graphData}
                  width={undefined}
                  height={600}
                  nodeLabel="name"
                  nodeAutoColorBy="popularity"
                  nodeVal={(node: any) => node.popularity / 10}
                  linkWidth={(link: any) => Math.sqrt(link.value)}
                  d3VelocityDecay={0.3}
                  linkColor={(link: any) => {
                    if (!highlightedNode) return "#6b7280"; // Gris par défaut
                    const linkSource = typeof link.source === 'object' ? link.source.id : link.source;
                    const linkTarget = typeof link.target === 'object' ? link.target.id : link.target;
                    if (linkSource === highlightedNode || linkTarget === highlightedNode) {
                      return "#ffffff"; // Blanc pour les liens connectés au nœud sélectionné
                    }
                    return "#6b7280"; // Gris pour les autres
                  }}
                  linkLabel={(link: any) =>
                    `${link.value} collaboration${link.value > 1 ? "s" : ""}`
                  }
                  onNodeClick={handleNodeClick}
                  enableNodeDrag={true}
                  enableZoomInteraction={true}
                  enablePanInteraction={true}
                  nodeCanvasObject={(node: any, ctx, globalScale) => {
                    const label = node.name;
                    const fontSize = 12 / globalScale;
                    const nodeRadius = Math.max(node.popularity / 10, 5);

                    // Draw node with image or fallback to circle
                    if (node.image) {
                      let img = imageCache.current.get(node.image);
                      if (!img) {
                        img = new Image();
                        img.crossOrigin = "anonymous";
                        img.src = node.image;
                        imageCache.current.set(node.image, img);
                      }

                      if (img.complete) {
                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
                        ctx.closePath();
                        ctx.clip();

                        // Calculate aspect ratio to maintain image proportions
                        const imgAspect = img.width / img.height;
                        let drawWidth = nodeRadius * 2;
                        let drawHeight = nodeRadius * 2;
                        let offsetX = 0;
                        let offsetY = 0;

                        if (imgAspect > 1) {
                          // Image is wider than tall
                          drawWidth = drawHeight * imgAspect;
                          offsetX = -(drawWidth - nodeRadius * 2) / 2;
                        } else {
                          // Image is taller than wide
                          drawHeight = drawWidth / imgAspect;
                          offsetY = -(drawHeight - nodeRadius * 2) / 2;
                        }

                        ctx.drawImage(
                          img,
                          node.x - nodeRadius + offsetX,
                          node.y - nodeRadius + offsetY,
                          drawWidth,
                          drawHeight
                        );
                        ctx.restore();

                        // Add border
                        ctx.strokeStyle = "#ffffff";
                        ctx.lineWidth = 2 / globalScale;
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
                        ctx.stroke();
                      } else {
                        // Fallback while loading
                        ctx.fillStyle = "#2563eb";
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
                        ctx.fill();
                      }
                    } else {
                      // Fallback if no image
                      ctx.fillStyle = "#2563eb";
                      ctx.beginPath();
                      ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
                      ctx.fill();
                    }

                    // Draw label
                    ctx.font = `${fontSize}px Sans-Serif`;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillStyle = "#ffffff";
                    ctx.fillText(label, node.x, node.y + nodeRadius + 10 / globalScale);
                  }}
                />
                {/* eslint-enable @typescript-eslint/no-explicit-any */}
                </>
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
                      <NextImage
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

                {selectedArtist.external_urls?.spotify && (
                  <a
                    href={selectedArtist.external_urls.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center px-4 py-2 bg-[#1DB954] text-white rounded-md hover:bg-[#1ed760] transition-colors font-medium text-sm"
                  >
                    Open in Spotify
                  </a>
                )}

                {/* Collaborators List */}
                {(() => {
                  const artistCollabs = collaborations
                    .filter(
                      (c) =>
                        c.artist1 === selectedArtist._id ||
                        c.artist2 === selectedArtist._id
                    )
                    .map((c) => {
                      const collabId =
                        c.artist1 === selectedArtist._id ? c.artist2 : c.artist1;
                      return {
                        artist: artists.find((a) => a._id === collabId),
                        count: c.count,
                      };
                    })
                    .filter((c) => c.artist)
                    .sort((a, b) => b.count - a.count);

                  if (artistCollabs.length === 0) return null;

                  return (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Collaborators ({artistCollabs.length})
                      </p>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {artistCollabs.map(({ artist, count }) => {
                          if (!artist) return null;
                          return (
                            <div
                              key={artist._id}
                              onClick={() => handleArtistSelect(artist)}
                              className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                            >
                              <div className="relative h-8 w-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
                                {artist.images[0]?.url && (
                                  <NextImage
                                    src={artist.images[0].url}
                                    alt={artist.name}
                                    fill
                                    className="object-cover"
                                  />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {artist.name}
                                </p>
                              </div>
                              <Badge variant="secondary" className="text-xs flex-shrink-0">
                                {count}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
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
                          <NextImage
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
                          <NextImage
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
