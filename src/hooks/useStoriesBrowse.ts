import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams } from "react-router-dom";

export interface CollectionWithLifelines {
  id: string;
  title: string;
  slug: string;
  card_image_url: string | null;
  updated_at: string;
  lifeline_count: number;
  profiles: {
    id: string;
    name: string;
    slug: string;
    primary_image_url: string | null;
  }[];
}

export interface LifelineItem {
  id: string;
  title: string;
  slug: string;
  lifeline_type: string;
  cover_image_url: string | null;
  profile_id: string | null;
  entry_count: number;
  collection_id: string;
}

export type CollectionSort = "recent" | "az" | "most-stories";
export type LifelineType = "all" | "person" | "list";
export type LifelineSort = "default" | "entries" | "az";

export interface CollectionFilters {
  profileId: string | null;
  lifelineType: LifelineType;
  sort: LifelineSort;
}

export function useStoriesBrowse() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Page-level state
  const [searchQuery, setSearchQuery] = useState("");
  const [collectionSort, setCollectionSort] = useState<CollectionSort>("recent");
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

  // Fetch all collections with profiles
  const { data: collections, isLoading: collectionsLoading } = useQuery({
    queryKey: ["stories-browse-collections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select(`
          id,
          title,
          slug,
          card_image_url,
          updated_at,
          profiles:profiles(
            id,
            name,
            slug,
            primary_image_url
          )
        `)
        .eq("status", "published")
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Get lifeline counts for each collection
      const collectionsWithCounts = await Promise.all(
        (data || []).map(async (collection) => {
          const { count } = await supabase
            .from("lifelines")
            .select("*", { count: "exact", head: true })
            .eq("collection_id", collection.id)
            .eq("status", "published");

          return {
            ...collection,
            lifeline_count: count || 0,
          } as CollectionWithLifelines;
        })
      );

      return collectionsWithCounts;
    },
  });

  // Fetch lifelines for expanded collection (lazy load)
  const useCollectionLifelines = (collectionId: string) => {
    return useQuery({
      queryKey: ["collection-lifelines", collectionId],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("lifelines")
          .select(`
            id,
            title,
            slug,
            lifeline_type,
            cover_image_url,
            profile_id,
            collection_id
          `)
          .eq("collection_id", collectionId)
          .eq("status", "published")
          .order("title");

        if (error) throw error;

        // Get entry counts
        const lifelinesWithCounts = await Promise.all(
          (data || []).map(async (lifeline) => {
            const { count } = await supabase
              .from("entries")
              .select("*", { count: "exact", head: true })
              .eq("lifeline_id", lifeline.id);

            return {
              ...lifeline,
              entry_count: count || 0,
            } as LifelineItem;
          })
        );

        return lifelinesWithCounts;
      },
      enabled: expandedCollections.has(collectionId),
    });
  };

  // Search across all lifelines
  const { data: searchResults } = useQuery({
    queryKey: ["stories-search", searchQuery],
    queryFn: async () => {
      if (searchQuery.length < 2) return new Map<string, number>();

      const { data, error } = await supabase
        .from("lifelines")
        .select("id, title, collection_id")
        .ilike("title", `%${searchQuery}%`)
        .eq("status", "published");

      if (error) throw error;

      // Group by collection_id and count
      const countMap = new Map<string, number>();
      (data || []).forEach((lifeline) => {
        const current = countMap.get(lifeline.collection_id) || 0;
        countMap.set(lifeline.collection_id, current + 1);
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
      profileId: null,
      lifelineType: "all",
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
      case "most-stories":
        return sorted.sort((a, b) => b.lifeline_count - a.lifeline_count);
      case "recent":
      default:
        return sorted.sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
    }
  }, [collections, collectionSort]);

  // Filter lifelines within a collection
  const filterLifelines = (
    lifelines: LifelineItem[],
    filters: CollectionFilters
  ): LifelineItem[] => {
    let filtered = [...lifelines];

    // Profile filter
    if (filters.profileId) {
      filtered = filtered.filter((l) => l.profile_id === filters.profileId);
    }

    // Type filter
    if (filters.lifelineType !== "all") {
      filtered = filtered.filter((l) => l.lifeline_type === filters.lifelineType);
    }

    // Sort
    switch (filters.sort) {
      case "entries":
        filtered.sort((a, b) => b.entry_count - a.entry_count);
        break;
      case "az":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
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
    density,
    setDensity,
    
    // Collection expansion
    expandedCollections,
    toggleExpanded,
    
    // Per-collection
    useCollectionLifelines,
    getCollectionFilters,
    setCollectionFilter,
    filterLifelines,
  };
}
