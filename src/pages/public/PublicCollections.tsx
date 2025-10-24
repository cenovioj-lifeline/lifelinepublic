import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/FavoriteButton";

export default function PublicCollections() {
  const { data: collections, isLoading } = useQuery({
    queryKey: ["public-collections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select(`
          *,
          hero_image:media_assets!collections_hero_image_id_fkey(url, alt_text)
        `)
        .eq("status", "published")
        .order("is_featured", { ascending: false })
        .order("title");

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  const featuredCollections = collections?.filter((c) => c.is_featured) || [];
  const otherCollections = collections?.filter((c) => !c.is_featured) || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Collections</h1>
        <p className="text-muted-foreground">
          Explore curated collections of lifelines, stories, and elections
        </p>
      </div>

      {featuredCollections.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-4">Featured Collections</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredCollections.map((collection) => (
              <Link
                key={collection.id}
                to={`/public/collections/${collection.slug}`}
                className="group relative"
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                  <div className="absolute top-2 right-2 z-10">
                    <FavoriteButton itemId={collection.id} itemType="collection" />
                  </div>
                  <div className="aspect-video relative bg-muted overflow-hidden">
                    {collection.hero_image?.url ? (
                      <img
                        src={collection.hero_image.url}
                        alt={collection.hero_image.alt_text || collection.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No image
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {collection.title}
                      </CardTitle>
                      <Badge variant="secondary">Featured</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground line-clamp-3">
                      {collection.description || "Explore this collection"}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {otherCollections.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">All Collections</h2>
            <Link to="/public/collections/all">
              <Button variant="outline">View All</Button>
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {otherCollections.slice(0, 6).map((collection) => (
              <Link
                key={collection.id}
                to={`/public/collections/${collection.slug}`}
                className="group relative"
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                  <div className="absolute top-2 right-2 z-10">
                    <FavoriteButton itemId={collection.id} itemType="collection" />
                  </div>
                  <div className="aspect-video relative bg-muted overflow-hidden">
                    {collection.hero_image?.url ? (
                      <img
                        src={collection.hero_image.url}
                        alt={collection.hero_image.alt_text || collection.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No image
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {collection.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground line-clamp-3">
                      {collection.description || "Explore this collection"}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {collections?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No collections available yet</p>
        </div>
      )}
    </div>
  );
}
