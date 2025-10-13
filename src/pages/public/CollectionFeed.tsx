import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CollectionLayout } from "@/components/CollectionLayout";
import { Card, CardContent } from "@/components/ui/card";

export default function CollectionFeed() {
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
          <h1 className="text-3xl font-bold mb-2">Collection Feed</h1>
          <p className="text-muted-foreground">
            Latest updates and entries from this collection
          </p>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Feed feature coming soon. This will display the latest entries and updates
              across all lifelines in this collection.
            </p>
          </CardContent>
        </Card>
      </div>
    </CollectionLayout>
  );
}
