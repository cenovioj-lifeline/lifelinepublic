import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ProfileDetailView } from "@/components/profile/ProfileDetailView";
import { useProfileData } from "@/hooks/useProfileData";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";

export default function CollectionProfileDetail() {
  const { collectionSlug, profileSlug } = useParams<{
    collectionSlug: string;
    profileSlug: string;
  }>();

  // Get collection info
  const { data: collection, isLoading: collectionLoading, error: collectionError } = useQuery({
    queryKey: ['collection', collectionSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collections')
        .select('id, slug, title, description')
        .eq('slug', collectionSlug)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!collectionSlug,
  });

  // Get profile with collection context
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError
  } = useProfileData({
    slug: profileSlug!,
    collectionSlug,
  });

  // Get associated lifelines for this profile within this collection
  const { data: associatedLifelines = [] } = useQuery({
    queryKey: ['collection-profile-lifelines', collectionSlug, profile?.id],
    queryFn: async () => {
      if (!profile?.id || !collection?.id) return [];

      const { data, error } = await supabase
        .from('lifelines')
        .select('id, slug, title, description, type, image_url')
        .eq('collection_id', collection.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id && !!collection?.id,
  });

  if (collectionLoading || profileLoading) {
    return <LoadingState message="Loading profile..." />;
  }

  if (collectionError || profileError) {
    return <ErrorState message="Failed to load profile" />;
  }

  if (!profile || !collection) {
    return <ErrorState message="Profile not found" />;
  }

  return (
    <ProfileDetailView
      profile={profile as any}
      associatedLifelines={associatedLifelines}
      collectionContext={{
        slug: collectionSlug!,
        name: collection.title
      }}
    />
  );
}
