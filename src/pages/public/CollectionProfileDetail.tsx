import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CollectionLayout } from "@/components/CollectionLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

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
              menu_active_color
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <CollectionLayout
      collectionTitle={collection.title}
      collectionSlug={collection.slug}
      primaryColor={collection.primary_color}
      secondaryColor={collection.secondary_color}
      webPrimary={collection.web_primary}
      webSecondary={collection.web_secondary}
      menuTextColor={collection.menu_text_color}
      menuHoverColor={collection.menu_hover_color}
      menuActiveColor={collection.menu_active_color}
    >
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <Avatar className="h-32 w-32 mx-auto md:mx-0">
                <AvatarImage src={profile.avatar_image?.url} alt={profile.display_name} />
                <AvatarFallback className="text-3xl">
                  {getInitials(profile.display_name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-3xl font-bold">{profile.display_name}</h1>
                  {profile.occupation && (
                    <p className="text-lg text-muted-foreground">{profile.occupation}</p>
                  )}
                </div>

                {profile.summary && (
                  <p className="text-base leading-relaxed">{profile.summary}</p>
                )}

                {profile.long_bio && (
                  <div className="prose prose-sm max-w-none">
                    <p>{profile.long_bio}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {profile.nationality && (
                    <Badge variant="secondary">{profile.nationality}</Badge>
                  )}
                  {profile.birth_date && (
                    <Badge variant="outline">Born: {new Date(profile.birth_date).getFullYear()}</Badge>
                  )}
                  {profile.death_date && (
                    <Badge variant="outline">Died: {new Date(profile.death_date).getFullYear()}</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CollectionLayout>
  );
}
