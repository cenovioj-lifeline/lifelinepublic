import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { LifelineItem } from "@/hooks/useStoriesBrowse";

/**
 * Fetches lifelines for a collection when expanded.
 * Moved to standalone hook to avoid hooks-in-loop violations.
 */
export function useCollectionLifelines(collectionId: string, enabled: boolean) {
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
    enabled,
  });
}
