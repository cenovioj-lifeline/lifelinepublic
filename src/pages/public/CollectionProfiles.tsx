import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CollectionLayout } from "@/components/CollectionLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export default function CollectionProfiles() {
  const { slug } = useParams<{ slug: string }>();

  const { data: collection } = useQuery({
    queryKey: ["public-collection", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["collection-profiles", collection?.id],
    queryFn: async () => {
      if (!collection?.id) return [];

      const { data, error } = await supabase
        .from("profile_collections")
        .select(`
          profile_id,
          role_in_collection,
          profiles!inner(
            *,
            avatar_image:media_assets!profiles_avatar_image_id_fkey(url, alt_text)
          )
        `)
        .eq("collection_id", collection.id);

      if (error) throw error;
      return data.map((pc) => pc.profiles);
    },
    enabled: !!collection?.id,
  });

  if (!collection) {
    return (
      <CollectionLayout collectionTitle="Loading..." collectionSlug={slug || ""}>
        <div>Loading...</div>
      </CollectionLayout>
    );
  }

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
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Profiles</h1>
          <p className="text-muted-foreground">
            People featured in {collection.title}
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : profiles && profiles.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {profiles.map((profile) => (
              <Link
                key={profile.id}
                to={`/public/profiles/${profile.slug}`}
                className="group"
              >
                <Card className="hover:shadow-lg transition-shadow h-full">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        {profile.avatar_image?.url && (
                          <AvatarImage
                            src={profile.avatar_image.url}
                            alt={profile.display_name}
                          />
                        )}
                        <AvatarFallback>
                          {getInitials(profile.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {profile.display_name}
                        </CardTitle>
                        {profile.occupation && (
                          <p className="text-sm text-muted-foreground">
                            {profile.occupation}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {profile.summary || "View profile for more details"}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No profiles found in this collection.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </CollectionLayout>
  );
}
