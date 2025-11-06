import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { PublicLayout } from "@/components/PublicLayout";
import { ProfileDetailView } from "@/components/ProfileDetailView";
import { Skeleton } from "@/components/ui/skeleton";

export default function PublicProfileDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["public-profile", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          avatar_image:media_assets!profiles_avatar_image_id_fkey(
            url,
            alt_text
          ),
          profile_relationships!profile_relationships_profile_id_fkey(
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
              slug,
              title,
              type
            )
          ),
          profile_collections(
            collection:collections(
              id,
              slug,
              title,
              description
            )
          )
        `)
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (error) throw error;
      return data;
    },
  });


  if (isLoading) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="space-y-8">
            <div className="flex gap-6">
              <Skeleton className="h-32 w-32 rounded-full" />
              <div className="space-y-4 flex-1">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!profile) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-8 max-w-6xl text-center">
          <h1 className="text-2xl font-bold mb-4">Profile not found</h1>
          <Button onClick={() => navigate("/public/profiles")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profiles
          </Button>
        </div>
      </PublicLayout>
    );
  }

  const associatedLifelines = profile.profile_lifelines?.map(
    (pl: any) => pl.lifeline
  ).filter(Boolean) || [];

  const collections = profile.profile_collections?.map(
    (pc: any) => pc.collection
  ).filter(Boolean) || [];

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/public/profiles")}
          className="mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Profiles
        </Button>

        <ProfileDetailView
          profile={profile as any}
          associatedLifelines={associatedLifelines}
          collections={collections}
        />
      </div>
    </PublicLayout>
  );
}
