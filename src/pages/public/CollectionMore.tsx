import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CollectionLayout } from "@/components/CollectionLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, MessageSquareQuote, Award } from "lucide-react";
import { ClaimCollectionTile } from "@/components/collection/ClaimCollectionTile";
import { ManageCollectionTile } from "@/components/collection/ManageCollectionTile";

export default function CollectionMore() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: collection, isLoading } = useQuery({
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

  // Fetch the first election for direct navigation (when media_enabled)
  const { data: firstElection } = useQuery({
    queryKey: ["collection-first-election-more", slug],
    queryFn: async () => {
      if (!collection?.id) return null;

      const { data, error } = await supabase
        .from("mock_elections")
        .select("slug")
        .eq("collection_id", collection.id)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) return null;
      return data;
    },
    enabled: !!collection?.id,
  });

  const mediaEnabled = (collection as any)?.media_enabled ?? false;

  // Base features that always show
  const baseFeatures = [
    {
      id: "contributors",
      label: "Contributors",
      icon: Trophy,
      path: `/public/collections/${slug}/contributors`,
      description: "View top contributors",
    },
    {
      id: "quotes",
      label: "Quotes",
      icon: MessageSquareQuote,
      path: `/public/collections/${slug}/quotes`,
      description: "Browse memorable quotes",
    },
  ];

  // Add Awards to More page when media_enabled is true
  const features = mediaEnabled
    ? [
        ...baseFeatures,
        {
          id: "awards",
          label: "Awards",
          icon: Award,
          path: firstElection
            ? `/public/collections/${slug}/elections/${firstElection.slug}`
            : `/public/collections/${slug}/elections`,
          description: "View collection awards",
        },
      ]
    : baseFeatures;

  if (isLoading || !collection) {
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
      collectionId={collection.id}
    >
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-4 text-[hsl(var(--scheme-title-text))]">More Features</h1>
          <p className="text-lg text-[hsl(var(--scheme-cards-text))]">
            Explore additional features and options
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((feature) => (
            <Card
              key={feature.id}
              className="cursor-pointer hover:shadow-lg transition-shadow bg-[hsl(var(--scheme-card-bg))] border-[hsl(var(--scheme-card-border))]"
              onClick={() => navigate(feature.path)}
            >
              <CardContent className="pt-6 text-center">
                <feature.icon
                  className="h-8 w-8 mx-auto mb-2 text-[hsl(var(--scheme-cards-text))]"
                />
                <div className="text-sm font-medium mb-1 text-[hsl(var(--scheme-card-text))]">{feature.label}</div>
                <div className="text-xs text-[hsl(var(--scheme-cards-text))]">
                  {feature.description}
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Manage Collection tile - only shows for owners/editors */}
          <ManageCollectionTile 
            collectionSlug={collection.slug} 
            collectionId={collection.id} 
          />
          
          {/* Claim Collection tile - only shows for logged in users without a role */}
          <ClaimCollectionTile 
            collectionSlug={collection.slug} 
            collectionId={collection.id} 
          />
        </div>
      </div>
    </CollectionLayout>
  );
}
