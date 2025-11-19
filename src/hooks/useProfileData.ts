import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UseProfileDataOptions {
  collectionSlug?: string;
}

export function useProfileData(slug: string | undefined, options?: UseProfileDataOptions) {
  const { collectionSlug } = options || {};

  const profileQuery = useQuery({
    queryKey: ["profile-data", slug, collectionSlug],
    enabled: !!slug,
    queryFn: async () => {
      if (!slug) return null;

      // Fetch base profile without ambiguous embeds
      const { data: baseProfile, error: baseError } = await supabase
        .from("profiles")
        .select(`
          *,
          avatar_image:media_assets!profiles_avatar_image_id_fkey(
            id,
            url,
            alt_text,
            position_x,
            position_y,
            scale
          )
        `)
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

      if (baseError) throw baseError;
      if (!baseProfile) return null;

      // Fetch related resources in parallel to avoid PostgREST embed ambiguity
      const [relsRes, worksRes, lifelinesRes, collectionsRes] = await Promise.all([
        supabase
          .from("profile_relationships")
          .select(`
            id,
            relationship_type,
            target_name,
            context,
            related_profile:profiles!profile_relationships_related_profile_id_fkey(
              id,
              name,
              slug,
              subject_type
            )
          `)
          .eq("profile_id", baseProfile.id),
        supabase
          .from("profile_works")
          .select(`id, work_category, title, year, work_type, significance, additional_info`)
          .eq("profile_id", baseProfile.id),
        supabase
          .from("profile_lifelines")
          .select(`
            relationship_type,
            lifeline:lifelines!profile_lifelines_lifeline_id_fkey(id, slug, title, lifeline_type)
          `)
          .eq("profile_id", baseProfile.id),
        supabase
          .from("profile_collections")
          .select(`collection:collections!profile_collections_collection_id_fkey(id, slug, title, description)`)
          .eq("profile_id", baseProfile.id),
      ]);

      const fullProfile: any = {
        ...baseProfile,
        profile_relationships: relsRes.data ?? [],
        profile_works: worksRes.data ?? [],
        profile_lifelines: lifelinesRes.data ?? [],
        profile_collections: collectionsRes.data ?? [],
      };

      // If collectionSlug is provided, verify profile belongs to collection
      if (collectionSlug) {
        const belongsToCollection = fullProfile.profile_collections?.some(
          (pc: any) => pc.collection?.slug === collectionSlug
        );
        
        if (!belongsToCollection) {
          throw new Error("Profile not found in this collection");
        }
      }

      return fullProfile;
    },
  });

  // Fetch full lifeline details with cover images (for collection context)
  const lifelinesQuery = useQuery({
    queryKey: ["profile-lifelines-detailed", profileQuery.data?.id, collectionSlug],
    enabled: !!profileQuery.data?.id && !!collectionSlug,
    queryFn: async () => {
      if (!profileQuery.data?.id) return [];

      const { data, error } = await supabase
        .from("lifelines")
        .select(`
          id,
          title,
          slug,
          lifeline_type,
          collection_id,
          cover_image:media_assets(url, alt_text)
        `)
        .eq("profile_id", profileQuery.data.id)
        .eq("status", "published");

      if (error) throw error;

      // Filter by collection if collectionSlug provided
      if (collectionSlug) {
        const collectionId = profileQuery.data.profile_collections?.find(
          (pc: any) => pc.collection?.slug === collectionSlug
        )?.collection?.id;

        return collectionId ? data?.filter((l: any) => l.collection_id === collectionId) : data;
      }

      return data;
    },
  });

  return {
    profile: profileQuery.data,
    lifelinesData: lifelinesQuery.data,
    isLoading: profileQuery.isLoading,
    error: profileQuery.error || lifelinesQuery.error,
  };
}
