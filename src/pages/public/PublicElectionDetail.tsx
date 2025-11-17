import { useParams } from "react-router-dom";
import { PublicLayout } from "@/components/PublicLayout";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileElectionViewer } from "@/components/election/MobileElectionViewer";
import { ElectionDetailView } from "@/components/election/ElectionDetailView";
import { useElectionData } from "@/hooks/useElectionData";

export default function PublicElectionDetail() {
  useColorScheme();
  const isMobile = useIsMobile();
  const { slug } = useParams<{ slug: string }>();
  const { election, groupedResults, isLoading } = useElectionData(slug);

  if (isMobile && election?.id) {
    return (
      <PublicLayout>
        <MobileElectionViewer electionId={election.id} />
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
