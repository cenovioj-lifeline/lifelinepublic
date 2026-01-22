import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CollectionTreeItem } from "@/components/profiles-browse/CollectionTreeItem";
import { useProfilesBrowse, type CollectionSort, type ProfileType } from "@/hooks/useProfilesBrowse";
import { useIsMobile } from "@/hooks/use-mobile";

export default function ProfilesBrowsePage() {
  const {
    collections,
    collectionsLoading,
    searchResults,
    searchQuery,
    setSearchQuery,
    collectionSort,
    setCollectionSort,
    typeFilter,
    setTypeFilter,
    density,
    setDensity,
    expandedCollections,
    toggleExpanded,
    getCollectionFilters,
    setCollectionFilter,
    filterProfiles,
  } = useProfilesBrowse();

  const isMobile = useIsMobile();
  const hasSearchQuery = searchQuery.length >= 2;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">Profiles</h1>
            <p className="text-muted-foreground">
              Browse all people and organizations • Grouped by collection
            </p>
          </div>
          {!isMobile && (
            <div className="text-sm text-muted-foreground bg-purple-50 border border-purple-200 rounded-lg p-3 max-w-xs">
              <strong>Click behavior:</strong> Opens profile detail page with
              their lifeline, collections, and more.
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
              placeholder="Search all profiles..."
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

          {/* Type Filter + Sort + Density */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Type Filter - Page Level */}
            {isMobile ? (
              // Mobile: Dropdown
              <Select
                value={typeFilter}
                onValueChange={(val: ProfileType) => setTypeFilter(val)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="person_real">Real People</SelectItem>
                  <SelectItem value="person_fictional">Fictional</SelectItem>
                  <SelectItem value="organization">Organizations</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              // Desktop: Pills
              <div className="flex bg-purple-50 rounded-lg p-0.5">
                {([
                  { value: "all", label: "All" },
                  { value: "person_real", label: "Real People" },
                  { value: "person_fictional", label: "Fictional" },
                  { value: "organization", label: "Organizations" },
                ] as { value: ProfileType; label: string }[]).map((type) => (
                  <Button
                    key={type.value}
                    variant={typeFilter === type.value ? "default" : "ghost"}
                    size="sm"
                    className={typeFilter === type.value 
                      ? "h-8 text-sm bg-purple-600 hover:bg-purple-700" 
                      : "h-8 text-sm text-purple-700 hover:bg-purple-100"
                    }
                    onClick={() => setTypeFilter(type.value)}
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
            )}

            {/* Collection Sort */}
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
                <SelectItem value="most-profiles">Sort: Most Profiles</SelectItem>
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
                  filterProfiles={filterProfiles}
                  typeFilter={typeFilter}
                  matchCount={searchResults.get(collection.id)}
                  hasSearchQuery={hasSearchQuery}
                  density={density}
                />
              );
            })
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              No collections with profiles found.
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
