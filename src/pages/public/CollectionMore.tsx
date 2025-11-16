import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CollectionLayout } from "@/components/CollectionLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, MessageSquareQuote } from "lucide-react";

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

  const features = [
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

        <div className="grid grid-cols-4 gap-2 md:gap-4">
          {features.map((feature) => (
            <Card
              key={feature.id}
              className="cursor-pointer hover:shadow-lg transition-shadow bg-[hsl(var(--scheme-card-bg))] border-[hsl(var(--scheme-card-border))]"
              onClick={() => navigate(feature.path)}
            >
              <CardContent className="pt-3 md:pt-6 text-center px-1 md:px-6">
                <feature.icon
                  className="h-5 w-5 md:h-8 md:w-8 mx-auto mb-1 md:mb-2 text-[hsl(var(--scheme-cards-text))]"
                />
                <div className="text-[10px] md:text-sm font-medium mb-0.5 md:mb-1 text-[hsl(var(--scheme-card-text))]">{feature.label}</div>
                <div className="text-[8px] md:text-xs text-[hsl(var(--scheme-cards-text))] hidden md:block">
                  {feature.description}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </CollectionLayout>
  );
}
