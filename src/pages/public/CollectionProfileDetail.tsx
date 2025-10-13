import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, User, List, Vote, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CollectionLayout } from "@/components/CollectionLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

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

  const getLifelineIcon = (type: string) => {
    switch (type) {
      case "family":
        return Users;
      case "person":
        return User;
      case "list":
        return List;
      case "election":
        return Vote;
      default:
        return TrendingUp;
    }
  };

  const getLifelineTypeColor = (type: string) => {
    switch (type) {
      case "family":
        return "text-blue-500";
      case "person":
        return "text-green-500";
      case "list":
        return "text-purple-500";
      case "election":
        return "text-orange-500";
      default:
        return "text-gray-500";
    }
  };

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
      collectionBgColor={collection.collection_bg_color}
      collectionTextColor={collection.collection_text_color}
      collectionHeadingColor={collection.collection_heading_color}
      collectionAccentColor={collection.collection_accent_color}
      collectionCardBg={collection.collection_card_bg}
      collectionBorderColor={collection.collection_border_color}
      collectionMutedText={collection.collection_muted_text}
      collectionBadgeColor={collection.collection_badge_color}
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

        {(lifelinesData?.length ?? associatedLifelines.length) > 0 && (
          <>
            <Separator className="my-8" />
            <Card>
              <CardHeader>
                <CardTitle>Associated Lifelines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {(lifelinesData ?? associatedLifelines).map((lifeline: any) => {
                    const Icon = getLifelineIcon(lifeline.lifeline_type);
                    return (
                      <Card
                        key={lifeline.id}
                        className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => navigate(`/public/collections/${collectionSlug}/lifelines/${lifeline.slug}`)}
                      >
                        {lifeline.cover_image && (
                          <div className="aspect-video w-full overflow-hidden">
                            <img
                              src={lifeline.cover_image.url}
                              alt={lifeline.cover_image.alt_text || lifeline.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            <Icon className={`h-5 w-5 ${getLifelineTypeColor(lifeline.lifeline_type)}`} />
                            <h3 className="font-semibold">{lifeline.title}</h3>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </CollectionLayout>
  );
}
