"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Artist } from "@/lib/types";
import { Search, ArrowUpDown, Users, ExternalLink } from "lucide-react";
import Image from "next/image";

type SortField = "name" | "popularity" | "followers";
type SortDirection = "asc" | "desc";

export default function ArtistBoardPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [genreFilter, setGenreFilter] = useState<string>("all");
  const [popularityFilter, setPopularityFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("popularity");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/artists");
        const data = await response.json();
        setArtists(data);
      } catch (error) {
        console.error("Error fetching artists:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Get all unique genres
  const allGenres = Array.from(
    new Set(artists.flatMap((artist) => artist.genres))
  ).sort();

  // Filter and sort artists
  const filteredAndSortedArtists = artists
    .filter((artist) => {
      const matchesSearch = artist.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesGenre =
        genreFilter === "all" || artist.genres.includes(genreFilter);

      const matchesPopularity =
        popularityFilter === "all" ||
        (popularityFilter === "high" && artist.popularity >= 70) ||
        (popularityFilter === "medium" &&
          artist.popularity >= 40 &&
          artist.popularity < 70) ||
        (popularityFilter === "low" && artist.popularity < 40);

      return matchesSearch && matchesGenre && matchesPopularity;
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <p className="text-muted-foreground">Loading artists...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Artist Board</h1>
        <p className="text-muted-foreground">
          Browse and analyze {artists.length} artists
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Refine your artist search</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by artist name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={genreFilter} onValueChange={setGenreFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Genre filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All genres</SelectItem>
              {allGenres.slice(0, 50).map((genre) => (
                <SelectItem key={genre} value={genre}>
                  {genre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={popularityFilter}
            onValueChange={setPopularityFilter}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Popularity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All popularity</SelectItem>
              <SelectItem value="high">High (70-100)</SelectItem>
              <SelectItem value="medium">Medium (40-69)</SelectItem>
              <SelectItem value="low">Low (0-39)</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>
            Artists ({filteredAndSortedArtists.length.toLocaleString()})
          </CardTitle>
          <CardDescription>
            {filteredAndSortedArtists.length === artists.length
              ? "Showing all artists"
              : `Showing ${filteredAndSortedArtists.length} of ${artists.length} artists`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>
                  <button
                    className="flex items-center gap-1 hover:text-primary"
                    onClick={() => handleSort("name")}
                  >
                    Name
                    {sortField === "name" && <ArrowUpDown className="h-4 w-4" />}
                  </button>
                </TableHead>
                <TableHead>Genres</TableHead>
                <TableHead>
                  <button
                    className="flex items-center gap-1 hover:text-primary"
                    onClick={() => handleSort("popularity")}
                  >
                    Popularity
                    {sortField === "popularity" && (
                      <ArrowUpDown className="h-4 w-4" />
                    )}
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    className="flex items-center gap-1 hover:text-primary"
                    onClick={() => handleSort("followers")}
                  >
                    Followers
                    {sortField === "followers" && (
                      <ArrowUpDown className="h-4 w-4" />
                    )}
                  </button>
                </TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedArtists.slice(0, 100).map((artist) => (
                <TableRow key={artist._id}>
                  <TableCell>
                    <div className="relative h-10 w-10 rounded-full overflow-hidden bg-muted">
                      {artist.images[0]?.url ? (
                        <Image
                          src={artist.images[0].url}
                          alt={artist.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full w-full">
                          <Users className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{artist.name}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {artist.genres.slice(0, 3).map((genre) => (
                        <Badge key={genre} variant="secondary" className="text-xs">
                          {genre}
                        </Badge>
                      ))}
                      {artist.genres.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{artist.genres.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{artist.popularity}/100</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {artist.followers.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <a
                      href={artist.external_urls.spotify}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
                    >
                      Spotify
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredAndSortedArtists.length > 100 && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              Showing first 100 results. Use filters to narrow down your search.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
