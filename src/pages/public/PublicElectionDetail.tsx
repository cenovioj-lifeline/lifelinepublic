import { useParams } from "react-router-dom";
import { PublicLayout } from "@/components/PublicLayout";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileElectionViewer } from "@/components/election/MobileElectionViewer";
import { ElectionDetailView } from "@/components/election/ElectionDetailView";
import { useElectionData } from "@/hooks/useElectionData";

export default function PublicElectionDetail() {
  const isMobile = useIsMobile();
  const { slug } = useParams<{ slug: string }>();
  const { election, results, groupedResults, categoryOrdering, isLoading } = useElectionData(slug);

  // Apply color scheme based on collection - will load default first, then collection-specific when election loads
  useColorScheme(election?.collection_id);

  if (isMobile && election?.id) {
    return (
      <PublicLayout>
        <MobileElectionViewer 
          electionId={election.id} 
          election={election}
          results={results || []}
          categoryOrdering={categoryOrdering}
        />
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <ElectionDetailView
        election={election}
        groupedResults={groupedResults}
      />
    </PublicLayout>
  );
}
