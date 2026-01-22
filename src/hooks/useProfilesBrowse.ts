import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams } from "react-router-dom";

export interface CollectionWithProfiles {
  id: string;
  title: string;
  slug: string;
  card_image_url: string | null;
  updated_at: string;
  profile_count: number;
}

export interface ProfileItem {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  subject_type: string;
  primary_image_url: string | null;
  avatar_url: string | null;
  primary_collection_id: string;
}

export type CollectionSort = "recent" | "az" | "most-profiles";
export type ProfileType = "all" | "person_real" | "person_fictional" | "organization";
export type ProfileSort = "default" | "az" | "recent";

export interface CollectionFilters {
  sort: ProfileSort;
}

export function useProfilesBrowse() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Page-level state
  const [searchQuery, setSearchQuery] = useState("");
  const [collectionSort, setCollectionSort] = useState<CollectionSort>("recent");
  const [typeFilter, setTypeFilter] = useState<ProfileType>("all");
  const [density, setDensity] = useState<"compact" | "comfortable">("compact");
  
  // Expanded collections from URL state
  const expandedParam = searchParams.get("expanded") || "";
  const expandedCollections = useMemo(
    () => new Set(expandedParam.split(",").filter(Boolean)),
    [expandedParam]
  );
  
  // Per-collection filters
  const [collectionFilters, setCollectionFilters] = useState<Map<string, CollectionFilters>>(
    new Map()
  );

  // Fetch all collections with profile counts
  const { data: collections, isLoading: collectionsLoading } = useQuery({
    queryKey: ["profiles-browse-collections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select(`
          id,
          title,
          slug,
          card_image_url,
          updated_at
        `)
        .eq("status", "published")
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Get profile counts for each collection
      const collectionsWithCounts = await Promise.all(
        (data || []).map(async (collection) => {
          const { count } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("primary_collection_id", collection.id)
            .eq("status", "published");

          return {
            ...collection,
            profile_count: count || 0,
          } as CollectionWithProfiles;
        })
      );

      // Filter out collections with no profiles
      return collectionsWithCounts.filter(c => c.profile_count > 0);
    },
  });

  // Search across all profiles
  const { data: searchResults } = useQuery({
    queryKey: ["profiles-search", searchQuery, typeFilter],
    queryFn: async () => {
      if (searchQuery.length < 2) return new Map<string, number>();

      let query = supabase
        .from("profiles")
        .select("id, name, primary_collection_id")
        .or(`name.ilike.%${searchQuery}%,short_description.ilike.%${searchQuery}%`)
        .eq("status", "published");

      if (typeFilter !== "all") {
        query = query.eq("subject_type", typeFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Group by primary_collection_id and count
      const countMap = new Map<string, number>();
      (data || []).forEach((profile) => {
        if (profile.primary_collection_id) {
          const current = countMap.get(profile.primary_collection_id) || 0;
          countMap.set(profile.primary_collection_id, current + 1);
        }
      });

      return countMap;
    },
    enabled: searchQuery.length >= 2,
  });

  // Toggle collection expansion
  const toggleExpanded = (collectionSlug: string) => {
    const newExpanded = new Set(expandedCollections);
    if (newExpanded.has(collectionSlug)) {
      newExpanded.delete(collectionSlug);
    } else {
      newExpanded.add(collectionSlug);
    }
    setSearchParams({ expanded: Array.from(newExpanded).join(",") });
  };

  // Get/set filters for a collection
  const getCollectionFilters = (collectionId: string): CollectionFilters => {
    return collectionFilters.get(collectionId) || {
      sort: "default",
    };
  };

  const setCollectionFilter = (
    collectionId: string,
    filters: Partial<CollectionFilters>
  ) => {
    setCollectionFilters((prev) => {
      const newMap = new Map(prev);
      const current = getCollectionFilters(collectionId);
      newMap.set(collectionId, { ...current, ...filters });
      return newMap;
    });
  };

  // Sort collections
  const sortedCollections = useMemo(() => {
    if (!collections) return [];
    const sorted = [...collections];
    switch (collectionSort) {
      case "az":
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case "most-profiles":
        return sorted.sort((a, b) => b.profile_count - a.profile_count);
      case "recent":
      default:
        return sorted.sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
    }
  }, [collections, collectionSort]);

  // Filter profiles within a collection
  const filterProfiles = (
    profiles: ProfileItem[],
    filters: CollectionFilters,
    pageTypeFilter: ProfileType
  ): ProfileItem[] => {
    let filtered = [...profiles];

    // Page-level type filter
    if (pageTypeFilter !== "all") {
      filtered = filtered.filter((p) => p.subject_type === pageTypeFilter);
    }

    // Sort
    switch (filters.sort) {
      case "az":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "recent":
        // Keep default order (already sorted by updated_at from query)
        break;
      default:
        // Keep default order
        break;
    }

    return filtered;
  };

  return {
    // Data
    collections: sortedCollections,
    collectionsLoading,
    searchResults: searchResults || new Map<string, number>(),
    
    // Page-level state
    searchQuery,
    setSearchQuery,
    collectionSort,
    setCollectionSort,
    typeFilter,
    setTypeFilter,
    density,
    setDensity,
    
    // Collection expansion
    expandedCollections,
    toggleExpanded,
    
    // Per-collection
    getCollectionFilters,
    setCollectionFilter,
    filterProfiles,
  };
}
