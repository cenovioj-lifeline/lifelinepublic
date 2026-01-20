import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CollectionLayout } from "@/components/CollectionLayout";
import { FeedViewer } from "@/components/feed/FeedViewer";
import { MobileFeedViewer } from "@/components/feed/MobileFeedViewer";
import { useCollectionFeedData } from "@/hooks/useCollectionFeedData";
import { useIsMobile } from "@/hooks/use-mobile";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function CollectionFeed() {
  const { slug } = useParams<{ slug: string }>();
  const isMobile = useIsMobile();

  // Fetch collection data
  const { data: collection, isLoading: collectionLoading } = useQuery({
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

  // Fetch feed data for this collection
  const feedQuery = useCollectionFeedData(collection?.id);
  const allEntries = feedQuery.data?.pages?.flatMap(page => page.entries) || [];

  // Loading state
  if (collectionLoading) {
    return (
      <CollectionLayout collectionTitle="Loading..." collectionSlug={slug || ""}>
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </CollectionLayout>
    );
  }

  if (!collection) {
    return (
      <CollectionLayout collectionTitle="Not Found" collectionSlug={slug || ""}>
        <Card className="p-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Collection Not Found</h2>
          <p className="text-muted-foreground">
            The collection you're looking for doesn't exist or isn't published.
          </p>
        </Card>
      </CollectionLayout>
    );
  }

  // Count lifelines for subtitle
  const entryCount = allEntries.length;

  // Mobile view
  if (isMobile) {
    return (
      <CollectionLayout
        collectionTitle={collection.title}
        collectionSlug={collection.slug}
        collectionId={collection.id}
      >
        <MobileFeedViewer
          entries={allEntries}
          isLoading={feedQuery.isLoading}
          hasNextPage={feedQuery.hasNextPage || false}
          isFetchingNextPage={feedQuery.isFetchingNextPage}
          fetchNextPage={feedQuery.fetchNextPage}
          seenIds={new Set()}
          seenFilter="all"
          onToggleSeen={() => {}}
          existingSubscriptions={[]}
          showSettingsOnMount={false}
        />
      </CollectionLayout>
    );
  }

  return (
    <CollectionLayout
      collectionTitle={collection.title}
      collectionSlug={collection.slug}
      collectionId={collection.id}
    >
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Feed</h1>
        <p className="text-muted-foreground">
          {feedQuery.isLoading 
            ? "Loading events..." 
            : `${entryCount} event${entryCount !== 1 ? 's' : ''} from ${collection.title}`
          }
        </p>
      </div>

      <FeedViewer
        entries={allEntries}
        isLoading={feedQuery.isLoading}
        hasNextPage={feedQuery.hasNextPage || false}
        isFetchingNextPage={feedQuery.isFetchingNextPage}
        fetchNextPage={feedQuery.fetchNextPage}
        seenIds={new Set()}
        seenFilter="all"
        onToggleSeen={() => {}}
      />
    </CollectionLayout>
  );
}
