import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CollectionLayout } from "@/components/CollectionLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";

export default function CollectionElections() {
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

  const { data: elections, isLoading } = useQuery({
    queryKey: ["collection-elections-all", collection?.id],
    queryFn: async () => {
      if (!collection?.id) return [];

      const { data, error } = await supabase
        .from("mock_elections")
        .select("*")
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
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Mock Elections & Results</h1>
          <p className="text-muted-foreground">
            All elections in {collection.title}
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : elections && elections.length > 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {elections.map((election) => (
                  <Link
                    key={election.id}
                    to={`/public/collections/${slug}/elections/${election.slug}`}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{election.title}</div>
                      {election.description && (
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {election.description}
                        </div>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No mock elections found in this collection.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </CollectionLayout>
  );
}
