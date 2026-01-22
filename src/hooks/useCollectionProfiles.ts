import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ProfileItem } from "@/hooks/useProfilesBrowse";

/**
 * Fetches profiles for a collection when expanded.
 * Standalone hook to avoid hooks-in-loop violations.
 */
export function useCollectionProfiles(collectionId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["collection-profiles", collectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          name,
          slug,
          short_description,
          subject_type,
          primary_image_url,
          avatar_image_id,
          primary_collection_id,
          media_assets:avatar_image_id(url)
        `)
        .eq("primary_collection_id", collectionId)
        .eq("status", "published")
        .order("name");

      if (error) throw error;

      // Transform to ProfileItem format
      return (data || []).map((profile) => ({
        id: profile.id,
        name: profile.name,
        slug: profile.slug,
        short_description: profile.short_description,
        subject_type: profile.subject_type,
        primary_image_url: profile.primary_image_url,
        avatar_url: (profile.media_assets as any)?.url || profile.primary_image_url,
        primary_collection_id: profile.primary_collection_id,
      })) as ProfileItem[];
    },
    enabled,
  });
}
