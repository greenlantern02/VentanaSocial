"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import WindowCard from "@/components/window_card";
import FilterSelect from "@/components/filter_select";
import { filterConfig } from "@/(config)/filters";
import { WindowData, PaginatedResponse, Filters } from "@/types/general";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { getWindows } from "@/actions/getWindows";

const initialFilters: Filters = {
  daytime: "",
  location: "",
  type: "",
  material: "",
  panes: "",
  covering: "",
  openState: "",
  isDuplicate: false,
  search: "",
};

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const limit = 3;

  // Initialize state from URL
  const urlPage = parseInt(searchParams.get("page") || "1", 10);
  const urlFilters: Filters = Object.fromEntries(
    Array.from(searchParams.entries())
      .filter(([_, value]) => value && value !== "all")
      .map(([key, value]) => {
        if (key === "isDuplicate") return [key, value === "true"];
        return [key, value];
      })
  ) as Filters;


  const [windows, setWindows] = useState<WindowData[]>([]);
  const [page, setPage] = useState(urlPage);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<Filters>(urlFilters);
  const [searchTerm, setSearchTerm] = useState((searchParams.get("search") as string) || "");

  const fetchData = async () => {
    try {
      const result = await getWindows({ page, limit, filters });
      setWindows(result.data || []);
      setTotal(result.total || 0);
      setPage(result.page || 1);
      setTotalPages(result.totalPages || 1);
    } catch (err) {
      setWindows([]);
      setTotal(0);
      setPage(1);
      setTotalPages(1);
    } finally {
    }
  };

  const updateURL = (newFilters: Filters, newPage: number) => {
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => params.set(k, String(v)));
    if (searchTerm) params.set("search", searchTerm);
    if (newPage > 1) params.set("page", newPage.toString());
    router.replace(`?${params.toString()}`);
  };

  // Filter change
  const handleFilterChange = (key: keyof Filters, value: string | boolean | undefined) => {
    setFilters(prev => {
      const updated: Filters = { ...prev };
      if (!value || value === "all") delete updated[key];
      else if (key === "isDuplicate") updated.isDuplicate = value === true || value === "true";
      else updated[key] = String(value);
      const newPage = 1;
      setPage(newPage);
      updateURL(updated, newPage);
      return updated;
    });
  };

  const handleSearch = () => handleFilterChange("search", searchTerm);

  const clearFilters = () => {
    setFilters(initialFilters);
    setSearchTerm("");
    const newPage = 1;
    setPage(newPage);
    router.replace("/feed");
  };

  // Fetch when page or filters change
  useEffect(() => { fetchData(); }, [page, filters]);

  return (
    <main className="flex flex-col items-center justify-center p-6 w-full">
      <div className="w-full max-w-7xl mb-8">
        <h1 className="text-3xl font-bold text-center mb-8">Windows Feed</h1>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-6 w-full">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>

          <div className="flex flex-col w-full items-center gap-3">
            {/* Search */}
            <div className="w-full flex gap-2">
              <Input
                placeholder="Search descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button onClick={handleSearch} variant="outline">Search</Button>
            </div>

            {/* Filter selects */}
            <div className="grid grid-cols-7 w-full gap-3">
              {filterConfig.map(({ key, title, options }) => (
                <FilterSelect
                  key={key}
                  title={title}
                  filterKey={key}
                  value={filters[key]?.toString() || "all"}
                  options={options}
                  onChange={handleFilterChange as (k: string, v: string) => void}
                />
              ))}
            </div>

            <Button onClick={clearFilters} variant="outline" className="w-full">Clear All Filters</Button>
          </div>

          <div className="text-sm text-gray-600 mt-2">
            Showing {windows.length} of {total} windows {Object.keys(filters).length > 0 && "(filtered)"}
          </div>
        </div>

        {/* Windows */}
        {windows.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {windows.map(w => <WindowCard key={w._id} window={w} />)}
          </div>
        ) : (
          <p>No windows for now.</p>
)}

        {/* Pagination */}
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => { const newPage = page - 1; setPage(newPage); updateURL(filters, newPage); }}
                className={page <= 1 ? "opacity-50 pointer-events-none" : ""}
              />
            </PaginationItem>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = totalPages <= 5 ? i + 1 :
                page <= 3 ? i + 1 :
                  page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    isActive={page === pageNum}
                    onClick={() => { setPage(pageNum); updateURL(filters, pageNum); }}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            <PaginationItem>
              <PaginationNext
                onClick={() => { const newPage = page + 1; setPage(newPage); updateURL(filters, newPage); }}
                className={page >= totalPages ? "opacity-50 pointer-events-none" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </main>
  );
}