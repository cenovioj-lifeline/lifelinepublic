import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/database';

export interface ProfileWithRelations extends Profile {
  profile_collections?: Array<{
    collection?: {
      id: string;
      slug: string;
      title: string;
    };
  }>;
  profile_lifelines?: Array<{
    lifeline?: {
      id: string;
      slug: string;
      title: string;
    };
  }>;
}

interface UseProfileDataOptions {
  slug: string;
  collectionSlug?: string;
}

export function useProfileData({ slug, collectionSlug }: UseProfileDataOptions) {
  return useQuery({
    queryKey: ['profile', slug, collectionSlug],
    queryFn: async () => {
      // First get the profile with all its data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          fictional_profiles (*),
          real_profiles (*),
          org_profiles (*)
        `)
        .eq('slug', slug)
        .single();

      if (profileError) throw profileError;
      if (!profile) throw new Error('Profile not found');

      // Merge the type-specific data into the main profile object
      const fullProfile: any = {
        ...profile,
        fictional: profile.fictional_profiles?.[0] || null,
        real: profile.real_profiles?.[0] || null,
        org: profile.org_profiles?.[0] || null,
      };

      // Remove the arrays to avoid duplication
      delete fullProfile.fictional_profiles;
      delete fullProfile.real_profiles;
      delete fullProfile.org_profiles;

      // Get collections this profile belongs to
      const { data: profileCollections, error: collectionsError } = await supabase
        .from('profile_collections')
        .select(`
          collection:collections (
            id,
            slug,
            title
          )
        `)
        .eq('profile_id', profile.id);

      if (collectionsError) throw collectionsError;

      fullProfile.profile_collections = profileCollections;

      // If collectionSlug is provided, verify profile belongs to collection
      if (collectionSlug) {
        const belongsToCollection = fullProfile.profile_collections?.some(
          (pc: any) => pc.collection?.slug === collectionSlug
        );
        
        if (!belongsToCollection) {
          throw new Error("Profile not found in this collection");
        }
      }

      // Get lifelines associated with this profile
      const { data: profileLifelines, error: lifelinesError } = await supabase
        .from('profile_lifelines')
        .select(`
          lifeline:lifelines (
            id,
            slug,
            title
          )
        `)
        .eq('profile_id', profile.id);

      if (lifelinesError) throw lifelinesError;

      fullProfile.profile_lifelines = profileLifelines;

      return fullProfile as ProfileWithRelations;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to get associated lifelines for a profile
export function useProfileLifelines(profileId: string) {
  return useQuery({
    queryKey: ['profile-lifelines', profileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profile_lifelines')
        .select(`
          lifeline:lifelines (
            id,
            slug,
            title,
            description,
            type,
            image_url
          )
        `)
        .eq('profile_id', profileId);

      if (error) throw error;
      return data?.map(item => item.lifeline).filter(Boolean) || [];
    },
    enabled: !!profileId,
    staleTime: 5 * 60 * 1000,
  });
}
