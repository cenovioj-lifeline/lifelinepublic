import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CollectionLayout } from "@/components/CollectionLayout";
import { ProfileDetailView } from "@/components/ProfileDetailView";

export default function CollectionProfileDetail() {
  const { collectionSlug, profileSlug } = useParams<{ collectionSlug: string; profileSlug: string }>();
  const navigate = useNavigate();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["collection-profile", collectionSlug, profileSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          avatar_image:media_assets!profiles_avatar_image_id_fkey(url, alt_text),
          profile_collections!inner(
            collection:collections!profile_collections_collection_id_fkey(
              id,
              title,
              slug,
              primary_color,
              secondary_color,
              web_primary,
              web_secondary,
              menu_text_color,
              menu_hover_color,
              menu_active_color,
              collection_bg_color,
              collection_text_color,
              collection_heading_color,
              collection_accent_color,
              collection_card_bg,
              collection_border_color,
              collection_muted_text,
              collection_badge_color
            )
          ),
          profile_relationships(
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
          ),
          profile_works(
            id,
            work_category,
            title,
            year,
            work_type,
            significance,
            additional_info
          ),
          profile_lifelines(
            lifeline:lifelines(
              id,
              title,
              slug,
              lifeline_type,
              cover_image:media_assets(url, alt_text)
            )
          )
        `)
        .eq("slug", profileSlug)
        .eq("status", "published")
        .single();

      if (error) throw error;
      
      // Verify this profile belongs to the collection
      const belongsToCollection = (data.profile_collections as any[])?.some(
        (pc: any) => pc.collection?.slug === collectionSlug
      );
      
      if (!belongsToCollection) {
        throw new Error("Profile not found in this collection");
      }
      
      return data;
    },
  });

  const { data: lifelinesData } = useQuery({
    queryKey: ["profile-lifelines", profile?.id, collectionSlug],
    enabled: !!profile?.id,
    queryFn: async () => {
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
        .eq("profile_id", (profile as any).id)
        .eq("status", "published");
      if (error) throw error;

      const cid = (profile?.profile_collections as any[])?.find((pc: any) => pc.collection?.slug === collectionSlug)?.collection?.id;
      return cid ? data?.filter((l: any) => l.collection_id === cid) : data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-base text-muted-foreground">Profile not found</p>
        <Button onClick={() => navigate(`/public/collections/${collectionSlug}/profiles`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Profiles
        </Button>
      </div>
    );
  }

  const collection = (profile.profile_collections as any[])?.[0]?.collection;
  const associatedLifelines = (profile.profile_lifelines as any[])
    ?.map((pl: any) => pl.lifeline)
    .filter(Boolean) || [];

  return (
    <CollectionLayout
      collectionTitle={collection.title}
      collectionSlug={collection.slug}
      collectionId={collection.id}
    >
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <ProfileDetailView
          profile={profile as any}
          associatedLifelines={lifelinesData ?? associatedLifelines}
          collections={[]}
          collectionContext={{
            slug: collectionSlug!,
            name: collection.title
          }}
        />
        
        <Button 
          onClick={() => navigate(`/public/collections/${collectionSlug}/profiles`)}
          variant="outline"
          className="mt-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Profiles
        </Button>
      </div>
    </CollectionLayout>
  );
}
