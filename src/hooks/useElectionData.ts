import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

interface UseElectionDataOptions {
  collectionSlug?: string;
}

export function useElectionData(slug: string | undefined, options?: UseElectionDataOptions) {
  const { collectionSlug } = options || {};

  // Fetch collection if collectionSlug is provided
  const { data: collection } = useQuery({
    queryKey: ["collection", collectionSlug],
    enabled: !!collectionSlug,
    queryFn: async () => {
      if (!collectionSlug) return null;
      const { data } = await supabase
        .from("collections")
        .select("id, slug, title")
        .eq("slug", collectionSlug)
        .single();
      return data;
    },
  });

  // Fetch election
  const { data: election, isLoading } = useQuery({
    queryKey: ["election", slug, collectionSlug],
    enabled: !!slug,
    queryFn: async () => {
      if (!slug) return null;

      const { data, error } = await supabase
        .from("mock_elections")
        .select(`
          *,
          collections(id, slug, title),
          election_tags(tags(name))
        `)
        .eq("slug", slug)
        .eq("status", "published")
        .eq("visibility", "public")
        .single();

      if (error) throw error;

      // Verify election belongs to collection if collectionSlug provided
      if (collectionSlug && data.collections?.slug !== collectionSlug) {
        throw new Error("Election not found in this collection");
      }

      return data;
    },
  });

  // Fetch results with profiles and avatars
  const { data: results } = useQuery({
    queryKey: ["election-results", election?.id],
    enabled: !!election?.id,
    queryFn: async () => {
      if (!election?.id) return [];

      const { data: resultsData, error: resultsError } = await supabase
        .from("election_results")
        .select("*")
        .eq("election_id", election.id);

      if (resultsError) throw resultsError;
      if (!resultsData) return [];

      // Fetch profiles for winners - handle both singular and array fields
      const profileIds = resultsData
        .flatMap(r => {
          const ids = [];
          if (r.winner_profile_id) ids.push(r.winner_profile_id);
          if (r.winner_profile_ids && r.winner_profile_ids.length > 0) {
            ids.push(...r.winner_profile_ids);
          }
          return ids;
        })
        .filter((id, index, self) => id && self.indexOf(id) === index); // Remove duplicates

      let profilesMap: Record<string, any> = {};
      if (profileIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, name, slug, avatar_image_id, primary_image_url")
          .in("id", profileIds);

        if (profilesData) {
          const avatarIds = profilesData
            .filter(p => p.avatar_image_id)
            .map(p => p.avatar_image_id);

          let avatarsMap: Record<string, any> = {};
          if (avatarIds.length > 0) {
            const { data: avatarsData } = await supabase
              .from("media_assets")
              .select("id, url, position_x, position_y, scale")
              .in("id", avatarIds);

            if (avatarsData) {
              avatarsMap = avatarsData.reduce((acc, avatar) => {
                acc[avatar.id] = avatar;
                return acc;
              }, {} as Record<string, any>);
            }
          }

          profilesMap = profilesData.reduce((acc, profile) => {
            acc[profile.id] = {
              ...profile,
              avatar: profile.avatar_image_id ? avatarsMap[profile.avatar_image_id] : null
            };
            return acc;
          }, {} as Record<string, any>);
        }
      }

      return resultsData.map(result => {
        const profiles = [];
        const addedIds = new Set<string>();
        
        // Add profile from singular field
        if (result.winner_profile_id && profilesMap[result.winner_profile_id]) {
          profiles.push(profilesMap[result.winner_profile_id]);
          addedIds.add(result.winner_profile_id);
        }
        
        // Add profiles from array field (only if not already added)
        if (result.winner_profile_ids) {
          result.winner_profile_ids.forEach(id => {
            if (profilesMap[id] && !addedIds.has(id)) {
              profiles.push(profilesMap[id]);
              addedIds.add(id);
            }
          });
        }
        
        return {
          ...result,
          profiles: profiles.filter(Boolean)
        };
      });
    },
  });

  // Fetch category ordering
  const { data: categoryOrdering } = useQuery({
    queryKey: ["election-category-order"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("election_category_order")
        .select("*");

      if (error) throw error;

      return data?.reduce((acc, item) => {
        acc[item.category] = item.display_order;
        return acc;
      }, {} as Record<string, number>) || {};
    },
  });

  // Group and sort results
  const groupedResults = useMemo(() => {
    if (!results || !categoryOrdering) return [];

    const grouped = results.reduce((acc, result) => {
      const category = result.superlative_category || "Other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(result);
      return acc;
    }, {} as Record<string, any[]>);

    return Object.entries(grouped)
      .sort(([catA], [catB]) => {
        const orderA = categoryOrdering[catA] ?? 999;
        const orderB = categoryOrdering[catB] ?? 999;
        if (orderA !== orderB) return orderA - orderB;
        return catA.localeCompare(catB);
      })
      .map(([category, results]) => ({ category, results }));
  }, [results, categoryOrdering]);

  return {
    election,
    results,
    groupedResults,
    collection,
    isLoading,
  };
}
