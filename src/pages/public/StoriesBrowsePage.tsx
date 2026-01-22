import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CollectionTreeItem } from "@/components/stories-browse/CollectionTreeItem";
import { useStoriesBrowse, type CollectionSort } from "@/hooks/useStoriesBrowse";
import { useIsMobile } from "@/hooks/use-mobile";

export default function StoriesBrowsePage() {
  const {
    collections,
    collectionsLoading,
    searchResults,
    searchQuery,
    setSearchQuery,
    collectionSort,
    setCollectionSort,
    density,
    setDensity,
    expandedCollections,
    toggleExpanded,
    getCollectionFilters,
    setCollectionFilter,
    filterLifelines,
  } = useStoriesBrowse();

  const isMobile = useIsMobile();
  const hasSearchQuery = searchQuery.length >= 2;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">Stories</h1>
            <p className="text-muted-foreground">
              Browse all stories • Click opens in collection context
            </p>
          </div>
          {!isMobile && (
            <div className="text-sm text-muted-foreground bg-green-50 border border-green-200 rounded-lg p-3 max-w-xs">
              <strong>Click behavior:</strong> Opens story with collection theme,
              breadcrumbs, and related content.
            </div>
          )}
        </div>

        {/* Page-Level Controls */}
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search all stories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {hasSearchQuery && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 text-white text-xs p-2 rounded-md z-10">
                Collections with matches show a badge. Non-matching collections
                are grayed out.
              </div>
            )}
          </div>

          {/* Sort + Density */}
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={collectionSort}
              onValueChange={(val: CollectionSort) => setCollectionSort(val)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Sort collections..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Sort: Recently Updated</SelectItem>
                <SelectItem value="az">Sort: A-Z</SelectItem>
                <SelectItem value="most-stories">Sort: Most Stories</SelectItem>
              </SelectContent>
            </Select>

            {/* Density Toggle (desktop only) */}
            {!isMobile && (
              <div className="flex bg-slate-100 rounded-lg p-0.5 ml-auto">
                <Button
                  variant={density === "compact" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setDensity("compact")}
                >
                  Compact
                </Button>
                <Button
                  variant={density === "comfortable" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setDensity("comfortable")}
                >
                  Comfortable
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Collection Tree */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {collectionsLoading ? (
            // Loading skeletons
            <div className="p-4 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : collections.length > 0 ? (
          collections.map((collection) => {
              const isExpanded = expandedCollections.has(collection.slug);

              return (
                <CollectionTreeItem
                  key={collection.id}
                  collection={collection}
                  isExpanded={isExpanded}
                  onToggle={() => toggleExpanded(collection.slug)}
                  filters={getCollectionFilters(collection.id)}
                  onFilterChange={(f) => setCollectionFilter(collection.id, f)}
                  filterLifelines={filterLifelines}
                  matchCount={searchResults.get(collection.id)}
                  hasSearchQuery={hasSearchQuery}
                  density={density}
                />
              );
            })
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              No collections found.
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
