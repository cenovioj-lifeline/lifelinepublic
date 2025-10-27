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
          <h1 className="text-4xl font-bold mb-4">More Features</h1>
          <p className="text-lg text-muted-foreground">
            Explore additional features and options
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((feature) => (
            <Card
              key={feature.id}
              style={{ borderColor: collection.primary_color || undefined }}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(feature.path)}
            >
              <CardContent className="pt-6 text-center">
                <feature.icon
                  className="h-8 w-8 mx-auto mb-2"
                  style={{ color: collection.primary_color || undefined }}
                />
                <div className="text-sm font-medium mb-1">{feature.label}</div>
                <div className="text-xs text-muted-foreground">
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
