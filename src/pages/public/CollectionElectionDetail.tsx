import { useParams } from "react-router-dom";
import { CollectionLayout } from "@/components/CollectionLayout";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileElectionViewer } from "@/components/election/MobileElectionViewer";
import { ElectionDetailView } from "@/components/election/ElectionDetailView";
import { useElectionData } from "@/hooks/useElectionData";
import { Skeleton } from "@/components/ui/skeleton";

export default function CollectionElectionDetail() {
  const isMobile = useIsMobile();
  const { collectionSlug, electionSlug } = useParams<{ collectionSlug: string; electionSlug: string }>();
  
  const { election, groupedResults, collection, isLoading } = useElectionData(electionSlug, {
    collectionSlug,
  });

  useColorScheme(collection?.id);

  // Show loading state while data is being fetched
  if (isLoading) {
    return (
      <CollectionLayout
        collectionTitle={collection?.title || "Loading..."}
        collectionSlug={collectionSlug!}
        collectionId={collection?.id}
      >
        <div className="min-h-screen bg-background p-4">
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-[200px]" />
            ))}
          </div>
        </div>
      </CollectionLayout>
    );
  }

  if (isMobile && election?.id) {
    return (
      <CollectionLayout
        collectionTitle={collection?.title || "Collection"}
        collectionSlug={collectionSlug!}
        collectionId={collection?.id}
      >
        <MobileElectionViewer electionId={election.id} collectionSlug={collectionSlug} />
      </CollectionLayout>
    );
  }

  return (
    <CollectionLayout
      collectionTitle={collection?.title || "Collection"}
      collectionSlug={collectionSlug!}
      collectionId={collection?.id}
    >
      <ElectionDetailView
        election={election}
        groupedResults={groupedResults}
        collectionContext={{
          slug: collectionSlug!,
          title: collection?.title,
        }}
      />
    </CollectionLayout>
  );
}
