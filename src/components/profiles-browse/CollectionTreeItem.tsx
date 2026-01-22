import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ProfileRow } from "./ProfileRow";
import type { CollectionWithProfiles, ProfileItem, CollectionFilters, ProfileType, ProfileSort } from "@/hooks/useProfilesBrowse";
import { useCollectionProfiles } from "@/hooks/useCollectionProfiles";

interface CollectionTreeItemProps {
  collection: CollectionWithProfiles;
  isExpanded: boolean;
  onToggle: () => void;
  filters: CollectionFilters;
  onFilterChange: (filters: Partial<CollectionFilters>) => void;
  filterProfiles: (profiles: ProfileItem[], filters: CollectionFilters, typeFilter: ProfileType) => ProfileItem[];
  typeFilter: ProfileType;
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
  filterProfiles,
  typeFilter,
  matchCount,
  hasSearchQuery,
  density,
}: CollectionTreeItemProps) {
  const [showAll, setShowAll] = useState(false);
  
  // Fetch profiles inside the component (avoids hooks-in-loop violation)
  const { data: profiles, isLoading: profilesLoading } = useCollectionProfiles(
    collection.id,
    isExpanded
  );
  
  const hasMatch = hasSearchQuery && (matchCount ?? 0) > 0;
  const isGrayedOut = hasSearchQuery && !hasMatch;

  const filteredProfiles = profiles ? filterProfiles(profiles, filters, typeFilter) : [];
  const displayedProfiles = showAll
    ? filteredProfiles
    : filteredProfiles.slice(0, SHOW_LIMIT);
  const hasMore = filteredProfiles.length > SHOW_LIMIT;

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
          <Badge variant="secondary" className="bg-green-600 text-white">
            {collection.profile_count} profiles
          </Badge>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="bg-slate-50">
          {/* In-Collection Controls - Simpler than Stories (just sort) */}
          <div className="px-4 py-3 bg-green-50 border-b border-green-100">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                Sort:
              </span>

              {/* Sort */}
              <Select
                value={filters.sort}
                onValueChange={(val: ProfileSort) =>
                  onFilterChange({ sort: val })
                }
              >
                <SelectTrigger className="w-[140px] h-8 text-sm bg-white border-green-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="az">A-Z</SelectItem>
                  <SelectItem value="recent">Recently Updated</SelectItem>
                </SelectContent>
              </Select>

              <span className="text-xs text-green-600 ml-auto">
                {filteredProfiles.length} profile{filteredProfiles.length !== 1 ? "s" : ""}
                {typeFilter !== "all" && " (filtered)"}
              </span>
            </div>
          </div>

          {/* Profiles List */}
          <div className="p-3 pl-14 space-y-2">
            {profilesLoading ? (
              // Loading skeletons
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))
            ) : displayedProfiles.length > 0 ? (
              <>
                {displayedProfiles.map((profile) => (
                  <ProfileRow
                    key={profile.id}
                    id={profile.id}
                    name={profile.name}
                    slug={profile.slug}
                    shortDescription={profile.short_description}
                    subjectType={profile.subject_type}
                    avatarUrl={profile.avatar_url}
                    density={density}
                  />
                ))}
                {hasMore && !showAll && (
                  <button
                    onClick={() => setShowAll(true)}
                    className="w-full text-center py-2 text-sm text-green-600 hover:text-green-800 hover:underline"
                  >
                    Show all {filteredProfiles.length} profiles →
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
                No profiles match your filters
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
