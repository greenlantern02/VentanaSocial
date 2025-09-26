"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";

interface WindowData {
  id: string;
  hash: string;
  isDuplicate: boolean;
  imageUrl: string;
  createdAt: number;
  description?: string;
  structured_data: {
    daytime?: string;
    location?: string;
    type?: string;
    material?: string;
    panes?: string;
    covering?: string;
    openState?: string;
  };
}

interface PaginatedResponse {
  data: WindowData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface Filters {
  daytime?: string;
  location?: string;
  type?: string;
  material?: string;
  panes?: string;
  covering?: string;
  openState?: string;
  isDuplicate?: boolean;
  search?: string;
}

export default function Home() {
  const [windows, setWindows] = useState<WindowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(12);

  // Filter states
  const [filters, setFilters] = useState<Filters>({});
  const [searchTerm, setSearchTerm] = useState("");

  const fetchWindows = async (currentPage: number, currentFilters: Filters) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });

      // Add filters to query params
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== "" && value !== null) {
          params.append(key, value.toString());
        }
      });

      const res = await fetch(`http://localhost:8000/api/windows?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error(`Error en el servidor (${res.status})`);
      }

      const result: PaginatedResponse = await res.json();

      // Server-side pagination - use API response directly
      if (result && result.data && Array.isArray(result.data)) {
        setWindows(result.data);
        setTotal(result.total || 0);
        setPage(result.page || 1);
        setTotalPages(result.totalPages || 1);
      } else {
        console.error("Unexpected API response format:", result);
        setWindows([]);
        setTotal(0);
        setPage(1);
        setTotalPages(1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setWindows([]);
      setTotal(0);
      setPage(1);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWindows(page, filters);
  }, [page, filters]);

  const handleFilterChange = (key: keyof Filters, value: string | boolean | undefined) => {
    const newFilters = { ...filters };
    if (value === "" || value === undefined || value === "all") {
      delete newFilters[key];
    } else {
      // Type-safe assignment based on the key
      if (key === 'isDuplicate') {
        newFilters[key] = value as boolean;
      } else {
        newFilters[key] = value as string;
      }
    }
    setFilters(newFilters);
    setPage(1); // Reset to first page when filtering
  };

  const handleSearch = () => {
    handleFilterChange("search", searchTerm);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm("");
    setPage(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading windows...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
          <Button onClick={() => fetchWindows(page, filters)} className="mt-4">
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center p-6 w-full">
      <div className="w-full max-w-7xl mb-8">
        <h1 className="text-3xl font-bold text-center mb-8">Windows Feed</h1>

        {/* Filters Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6 w-full">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>

          <div className="flex flex-col w-full items-center gap-3">
            {/* Search */}
            <div className="w-full">
              <div className="flex gap-2">
                <Input
                  placeholder="Search descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} variant="outline">
                  Search
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-8 w-full gap-3">
              {/* Daytime Filter */}
              <div className=" flex flex-col items-center">
                <h3 className="font-light">Daytime</h3>
                <Select
                  value={filters.daytime || "all"}
                  onValueChange={(value) => handleFilterChange("daytime", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Daytime" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="night">Night</SelectItem>
                    <SelectItem value="unkwon">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Location Filter */}
              <div className="flex flex-col items-center">
                <h3 className="font-light">Location</h3>
                <Select
                  value={filters.location || "all"}

                  onValueChange={(value) => handleFilterChange("location", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="interior">Interior</SelectItem>
                    <SelectItem value="exterior">Exterior</SelectItem>
                    <SelectItem value="unkwon">Unknown</SelectItem>

                  </SelectContent>
                </Select>
              </div>

              {/* Type Filter */}
              <div className="flex flex-col items-center">
                <h3 className="font-light">Window Type</h3>
                <Select
                  value={filters.type || "all"}
                  onValueChange={(value) => {
                    handleFilterChange("type", value);
                  }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Window Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="fixed">Fixed</SelectItem>
                    <SelectItem value="sliding">Sliding</SelectItem>
                    <SelectItem value="casement">Casement</SelectItem>
                    <SelectItem value="awning">Awning</SelectItem>
                    <SelectItem value="hung">Hung</SelectItem>
                    <SelectItem value="pivot">Pivot</SelectItem>
                    <SelectItem value="unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>


              {/* material Filter */}
              <div className="flex flex-col items-center">
                <h3 className="font-light">Material</h3>
                <Select
                  value={filters.material || "all"}
                  onValueChange={(value) => {
                    handleFilterChange("material", value);
                  }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Material" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="wood">wood</SelectItem>
                    <SelectItem value="aluminum">aluminum</SelectItem>
                    <SelectItem value="pvc">pvc</SelectItem>
                    <SelectItem value="unknown">unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>

                            {/* panes Filter */}
              <div className="flex flex-col items-center">
                <h3 className="font-light">Panes</h3>
                <Select
                  value={filters.panes || "all"}
                  onValueChange={(value) => {
                    handleFilterChange("panes", value);
                  }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="panes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="unknown">unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>

                                          {/* covering Filter */}
              <div className="flex flex-col items-center">
                <h3 className="font-light">Covering</h3>
                <Select
                  value={filters.covering || "all"}
                  onValueChange={(value) => {
                    handleFilterChange("covering", value);
                  }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="covering" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="curtains">curtains</SelectItem>
                    <SelectItem value="blins">blins</SelectItem>
                    <SelectItem value="none">none</SelectItem>
                    <SelectItem value="unknown">unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Open State Filter */}
              <div className="flex flex-col items-center">
                <h3 className="font-light">Open State</h3>
                <Select
                  value={filters.openState || "all"}

                  onValueChange={(value) => handleFilterChange("openState", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Open State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="partially-open">Partially Open</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Duplicate Filter */}
              <div className="flex flex-col items-center">
                <h3 className="font-light">Duplicate</h3>
                <Select
                  value={filters!.isDuplicate?.toString() || "all"}

                  onValueChange={(value) => handleFilterChange("isDuplicate", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Duplicates" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="true">Duplicates Only</SelectItem>
                    <SelectItem value="false">Non-Duplicates Only</SelectItem>
                  </SelectContent>
                </Select>
              </div></div>

            <Button onClick={clearFilters} variant="outline" className="w-full">
              Clear All Filters
            </Button>
          </div>

          {/* Results Summary */}
          <div className="text-sm text-gray-600">
            Showing {windows?.length || 0} of {total} windows
            {Object.keys(filters).length > 0 && " (filtered)"}
          </div>
        </div>

        {/* Windows Grid */}
        {!loading && windows && windows.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {windows.map((item) => {
              return (
                <Card key={item.id}>
                  <CardHeader>
                    <CardTitle>{item.description || "No description available"}</CardTitle>
                    <CardDescription>
                      {new Date(item.createdAt * 1000).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Image
                      src={item.imageUrl}
                      alt={item.description || "Ventana"}
                      className="w-full h-auto rounded mb-4"
                      width={400}
                      height={300}
                    />
                    <Table>
                      <TableCaption>Structured Data</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">Field</TableHead>
                          <TableHead>Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(item.structured_data || {}).map(([key, value]) => (
                          <TableRow key={key}>
                            <TableCell className="font-medium capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </TableCell>
                            <TableCell>{value || "N/A"}</TableCell>
                          </TableRow>
                        ))}
                        {(!item.structured_data || Object.keys(item.structured_data).length === 0) && (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center text-muted-foreground">
                              No structured data available
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      ID: {item.id.substring(0, 8)}...
                    </p>
                    {item.isDuplicate && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                        Duplicate
                      </span>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && windows.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No windows found</h3>
            <p className="text-gray-600 mb-4">
              {Object.keys(filters).length > 0
                ? "Try adjusting your filters to see more results."
                : "No windows available at the moment."}
            </p>
            {Object.keys(filters).length > 0 && (
              <Button onClick={clearFilters} variant="outline">
                Clear Filters
              </Button>
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {page} of {totalPages} • {total} total results
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                variant="outline"
              >
                Previous
              </Button>

              {/* Page Numbers */}
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                variant="outline"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}