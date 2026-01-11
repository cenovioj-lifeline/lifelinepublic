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
            scale,
            card_position_x,
            card_position_y,
            card_scale
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
          .select(`relationship_type, lifeline:lifelines!profile_lifelines_lifeline_id_fkey(id, slug, title, lifeline_type)`)
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

  // Fetch full lifeline details with cover images
  const lifelinesQuery = useQuery({
    queryKey: ["profile-lifelines-detailed", profileQuery.data?.id, collectionSlug],
    enabled: !!profileQuery.data?.id,
    queryFn: async () => {
      if (!profileQuery.data?.id) return [];

      // Query through the junction table since lifelines don't have profile_id
      let query = supabase
        .from("profile_lifelines")
        .select(`
          relationship_type,
          lifeline:lifelines!inner(
            id,
            title,
            slug,
            lifeline_type,
            collection_id,
            status,
            cover_image:media_assets(url, alt_text)
          )
        `)
        .eq("profile_id", profileQuery.data.id)
        .eq("lifelines.status", "published");

      // Filter by collection if collectionSlug provided
      if (collectionSlug) {
        const collectionId = profileQuery.data.profile_collections?.find(
          (pc: any) => pc.collection?.slug === collectionSlug
        )?.collection?.id;

        if (collectionId) {
          query = query.eq("lifelines.collection_id", collectionId);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      // Extract the lifeline objects from the junction table results, including relationship_type
      return data?.map((item: any) => ({ ...item.lifeline, relationship_type: item.relationship_type })).filter(Boolean) ?? [];
    },
  });

  // Fetch election awards where this profile won
  const awardsQuery = useQuery({
    queryKey: ["profile-awards", profileQuery.data?.id, collectionSlug],
    enabled: !!profileQuery.data?.id,
    queryFn: async () => {
      if (!profileQuery.data?.id) return [];

      // Get collection IDs to filter by
      const collectionIds = collectionSlug 
        ? [profileQuery.data.profile_collections?.find(
            (pc: any) => pc.collection?.slug === collectionSlug
          )?.collection?.id].filter(Boolean)
        : profileQuery.data.profile_collections?.map(
            (pc: any) => pc.collection?.id
          ).filter(Boolean) ?? [];

      if (collectionIds.length === 0) return [];

      // Query election results where profile is winner (check both singular and array fields)
      const { data, error } = await supabase
        .from("election_results")
        .select(`
          id,
          category,
          superlative_category,
          notes,
          winner_name,
          percentage,
          vote_count,
          election:mock_elections!inner(
            id,
            title,
            slug,
            collection_id
          )
        `)
        .in("mock_elections.collection_id", collectionIds)
        .eq("mock_elections.status", "published")
        .or(`winner_profile_id.eq.${profileQuery.data.id},winner_profile_ids.cs.{${profileQuery.data.id}}`);

      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch quotes where this profile is the author
  const quotesQuery = useQuery({
    queryKey: ["profile-quotes", profileQuery.data?.id, collectionSlug],
    enabled: !!profileQuery.data?.id,
    queryFn: async () => {
      if (!profileQuery.data?.id) return [];

      // Get collection IDs to filter by
      const collectionIds = collectionSlug 
        ? [profileQuery.data.profile_collections?.find(
            (pc: any) => pc.collection?.slug === collectionSlug
          )?.collection?.id].filter(Boolean)
        : profileQuery.data.profile_collections?.map(
            (pc: any) => pc.collection?.id
          ).filter(Boolean) ?? [];

      if (collectionIds.length === 0) return [];

      // Query collection quotes where profile is author (check both singular and array fields)
      const { data, error } = await supabase
        .from("collection_quotes")
        .select(`
          id,
          quote,
          context,
          author
        `)
        .in("collection_id", collectionIds)
        .or(`author_profile_id.eq.${profileQuery.data.id},author_profile_ids.cs.{${profileQuery.data.id}}`)
        .in("contribution_status", ["approved", "auto_approved"]);

      if (error) throw error;
      return data ?? [];
    },
  });

  return {
    profile: profileQuery.data,
    lifelinesData: lifelinesQuery.data,
    awards: awardsQuery.data,
    quotes: quotesQuery.data,
    isLoading: profileQuery.isLoading,
    error: profileQuery.error || lifelinesQuery.error || awardsQuery.error || quotesQuery.error,
  };
}
