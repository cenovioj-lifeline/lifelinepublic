import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CollectionLayout } from "@/components/CollectionLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CollectionLifelines() {
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

  const { data: lifelines, isLoading } = useQuery({
    queryKey: ["collection-lifelines-all", collection?.id],
    queryFn: async () => {
      if (!collection?.id) return [];

      const { data, error } = await supabase
        .from("lifelines")
        .select(`
          *,
          cover_image:media_assets!lifelines_cover_image_id_fkey(url, alt_text),
          profile:profiles!lifelines_profile_id_fkey(
            display_name,
            avatar_image:media_assets!profiles_avatar_image_id_fkey(url, alt_text)
          )
        `)
        .eq("collection_id", collection.id)
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
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
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Lifelines</h1>
          <p className="text-muted-foreground">
            All lifelines in {collection.title}
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : lifelines && lifelines.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {lifelines.map((lifeline) => (
              <Link
                key={lifeline.id}
                to={`/public/collections/${slug}/lifelines/${lifeline.slug}`}
                className="group"
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                  <div className="aspect-video relative bg-muted overflow-hidden">
                    {lifeline.cover_image?.url ? (
                      <img
                        src={lifeline.cover_image.url}
                        alt={lifeline.cover_image.alt_text || lifeline.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No image
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {lifeline.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {lifeline.subtitle || lifeline.intro || "Explore this lifeline"}
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
                No lifelines found in this collection.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </CollectionLayout>
  );
}
