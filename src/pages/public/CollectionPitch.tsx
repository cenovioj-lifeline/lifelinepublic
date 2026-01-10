import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CollectionLayout } from "@/components/CollectionLayout";
import { Skeleton } from "@/components/ui/skeleton";

export default function CollectionPitch() {
  const { slug } = useParams<{ slug: string }>();

  const { data: collection, isLoading } = useQuery({
    queryKey: ["collection-pitch", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("id, title, slug, description")
        .eq("slug", slug)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <CollectionLayout collectionTitle="Loading..." collectionSlug={slug || ""}>
        <div className="space-y-6">
          <Skeleton className="h-64 w-full" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </CollectionLayout>
    );
  }

  if (!collection) {
    return (
      <CollectionLayout collectionTitle="Not Found" collectionSlug={slug || ""}>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Collection not found</h2>
        </div>
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
        {/* Hero Section */}
        <div className="text-center py-12 px-4 rounded-lg" style={{ backgroundColor: 'hsl(var(--scheme-card-bg))' }}>
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: 'hsl(var(--scheme-title-text))' }}>
            Help us build something that matters.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Lifeline Public is a new kind of platform - where understanding people replaces performing for algorithms.
          </p>
        </div>

        {/* Placeholder for Book Grid */}
        <div className="text-center py-16 border-2 border-dashed rounded-lg" style={{ borderColor: 'hsl(var(--scheme-card-border))' }}>
          <p className="text-lg text-muted-foreground">
            Pitch book content coming soon...
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            The interactive book UI with filters and consolidated view will be added here.
          </p>
        </div>
      </div>
    </CollectionLayout>
  );
}
