import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CollectionLayout } from "@/components/CollectionLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";
import { FavoriteButton } from "@/components/FavoriteButton";

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
      collectionId={collection.id}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'hsl(var(--scheme-title-text))' }}>Mock Elections & Results</h1>
          <p style={{ color: 'hsl(var(--scheme-cards-text))' }}>
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
                  className="flex items-center justify-between p-4 hover:bg-[hsl(var(--scheme-ch-actions-bg)/.2)] transition-colors group"
                >
                    <div className="flex-1">
                      <div className="font-medium" style={{ color: 'hsl(var(--scheme-cards-text))' }}>{election.title}</div>
                      {election.description && (
                        <div className="text-sm line-clamp-1" style={{ color: 'hsl(var(--scheme-cards-text))' }}>
                          {election.description}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <FavoriteButton itemId={election.id} itemType="election" />
                      <ArrowRight className="h-4 w-4" style={{ color: 'hsl(var(--scheme-ch-actions-icon))' }} />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card style={{ backgroundColor: 'hsl(var(--scheme-cards-bg))', borderColor: 'hsl(var(--scheme-cards-border))' }}>
            <CardContent className="py-12 text-center">
              <p style={{ color: 'hsl(var(--scheme-cards-text))' }}>
                No mock elections found in this collection.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </CollectionLayout>
  );
}
