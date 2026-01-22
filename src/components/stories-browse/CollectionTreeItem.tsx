import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { LifelineRow } from "./LifelineRow";
import type { CollectionWithLifelines, LifelineItem, CollectionFilters, LifelineType, LifelineSort } from "@/hooks/useStoriesBrowse";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCollectionLifelines } from "@/hooks/useCollectionLifelines";

interface CollectionTreeItemProps {
  collection: CollectionWithLifelines;
  isExpanded: boolean;
  onToggle: () => void;
  filters: CollectionFilters;
  onFilterChange: (filters: Partial<CollectionFilters>) => void;
  filterLifelines: (lifelines: LifelineItem[], filters: CollectionFilters) => LifelineItem[];
  matchCount?: number;
  hasSearchQuery: boolean;
  density: "compact" | "comfortable";
}

const SHOW_LIMIT = 15;

export function CollectionTreeItem({
  collection,
  isExpanded,
  onToggle,
  filters,
  onFilterChange,
  filterLifelines,
  matchCount,
  hasSearchQuery,
  density,
}: CollectionTreeItemProps) {
  const [showAll, setShowAll] = useState(false);
  const isMobile = useIsMobile();
  
  // Fetch lifelines inside the component (avoids hooks-in-loop violation)
  const { data: lifelines, isLoading: lifelinesLoading } = useCollectionLifelines(
    collection.id,
    isExpanded
  );
  
  const hasMatch = hasSearchQuery && (matchCount ?? 0) > 0;
  const isGrayedOut = hasSearchQuery && !hasMatch;

  const filteredLifelines = lifelines ? filterLifelines(lifelines, filters) : [];
  const displayedLifelines = showAll
    ? filteredLifelines
    : filteredLifelines.slice(0, SHOW_LIMIT);
  const hasMore = filteredLifelines.length > SHOW_LIMIT;

  return (
    <div
      className={cn(
        "border-b border-slate-100 last:border-b-0",
        isGrayedOut && "opacity-40 pointer-events-none"
      )}
    >
      {/* Collection Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors text-left"
        disabled={isGrayedOut}
      >
        {/* Expand Icon */}
        <span className="flex-shrink-0 text-muted-foreground">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </span>

        {/* Collection Image */}
        <div
          className="w-12 h-12 rounded-lg flex-shrink-0 bg-gradient-to-br from-slate-700 to-slate-500"
          style={
            collection.card_image_url
              ? {
                  backgroundImage: `url(${collection.card_image_url})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        />

        {/* Collection Info */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{collection.title}</div>
          <div className="text-sm text-muted-foreground">
            Updated {new Date(collection.updated_at).toLocaleDateString()}
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {hasMatch && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
              {matchCount} match{matchCount !== 1 ? "es" : ""}
            </Badge>
          )}
          <Badge variant="secondary">
            {collection.lifeline_count} stories
          </Badge>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="bg-slate-50">
          {/* In-Collection Controls */}
          <div className="px-4 py-3 bg-green-50 border-b border-green-100">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                Filter:
              </span>

              {/* Profile Filter */}
              {collection.profiles.length > 0 && (
                isMobile ? (
                  // Mobile: Dropdown with avatar
                  <Select
                    value={filters.profileId || "all"}
                    onValueChange={(val) =>
                      onFilterChange({ profileId: val === "all" ? null : val })
                    }
                  >
                    <SelectTrigger className="w-[180px] bg-white border-green-200">
                      <SelectValue placeholder="All profiles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Profiles</SelectItem>
                      {collection.profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-5 h-5">
                              <AvatarImage src={profile.primary_image_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {profile.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{profile.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  // Desktop: Avatar row with tooltips
                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-green-200">
                    <span className="text-xs text-green-700">Profiles:</span>
                    <ScrollArea className="max-w-[300px]">
                      <div className="flex items-center gap-1">
                        {collection.profiles.map((profile) => (
                          <Tooltip key={profile.id}>
                            <TooltipTrigger asChild>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onFilterChange({
                                    profileId:
                                      filters.profileId === profile.id
                                        ? null
                                        : profile.id,
                                  });
                                }}
                                className={cn(
                                  "rounded-full transition-all",
                                  filters.profileId === profile.id &&
                                    "ring-2 ring-green-600 ring-offset-1"
                                )}
                              >
                                <Avatar className="w-8 h-8 hover:scale-110 transition-transform">
                                  <AvatarImage src={profile.primary_image_url || undefined} />
                                  <AvatarFallback className="text-xs bg-green-100 text-green-700">
                                    {profile.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>{profile.name}</TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                    {filters.profileId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-green-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          onFilterChange({ profileId: null });
                        }}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                )
              )}

              {/* Type Filter */}
              <div className="flex items-center gap-1 ml-auto">
                {(["all", "person", "list"] as LifelineType[]).map((type) => (
                  <Button
                    key={type}
                    variant={filters.lifelineType === type ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "h-7 text-xs",
                      filters.lifelineType === type
                        ? "bg-green-600 hover:bg-green-700"
                        : "border-green-200 text-green-700 hover:bg-green-50"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onFilterChange({ lifelineType: type });
                    }}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                ))}
              </div>

              {/* Sort */}
              <Select
                value={filters.sort}
                onValueChange={(val: LifelineSort) =>
                  onFilterChange({ sort: val })
                }
              >
                <SelectTrigger className="w-[120px] h-7 text-xs bg-white border-green-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="entries">Most Entries</SelectItem>
                  <SelectItem value="az">A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Lifelines List */}
          <div className="p-3 pl-14 space-y-2">
            {lifelinesLoading ? (
              // Loading skeletons
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))
            ) : displayedLifelines.length > 0 ? (
              <>
                {displayedLifelines.map((lifeline) => (
                  <LifelineRow
                    key={lifeline.id}
                    id={lifeline.id}
                    title={lifeline.title}
                    slug={lifeline.slug}
                    lifelineType={lifeline.lifeline_type}
                    coverImageUrl={lifeline.cover_image_url}
                    entryCount={lifeline.entry_count}
                    collectionSlug={collection.slug}
                    density={density}
                  />
                ))}
                {hasMore && !showAll && (
                  <button
                    onClick={() => setShowAll(true)}
                    className="w-full text-center py-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Show all {filteredLifelines.length} stories →
                  </button>
                )}
                {showAll && hasMore && (
                  <button
                    onClick={() => setShowAll(false)}
                    className="w-full text-center py-2 text-sm text-slate-500 hover:text-slate-700 hover:underline"
                  >
                    Show less
                  </button>
                )}
              </>
            ) : (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No stories match your filters
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
