import { useParams } from "react-router-dom";
import { CollectionLayout } from "@/components/CollectionLayout";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileElectionViewer } from "@/components/election/MobileElectionViewer";
import { ElectionDetailView } from "@/components/election/ElectionDetailView";
import { useElectionData } from "@/hooks/useElectionData";

export default function CollectionElectionDetail() {
  const isMobile = useIsMobile();
  const { collectionSlug, electionSlug } = useParams<{ collectionSlug: string; electionSlug: string }>();
  
  const { election, groupedResults, collection, isLoading } = useElectionData(electionSlug, {
    collectionSlug,
  });

  useColorScheme(collection?.id);

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
