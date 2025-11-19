import { ProfileQuickFacts } from "./profile/ProfileQuickFacts";
import { ProfileBiography } from "./profile/ProfileBiography";
import { ProfileLegacyImpact } from "./profile/ProfileLegacyImpact";
import { Card } from "@/components/ui/card";
import type { ProfileWithRelations } from "@/types/profile";

interface ProfileDetailViewProps {
  profile: ProfileWithRelations;
  associatedLifelines?: any[];
  collections?: any[];
  collectionContext?: {
    slug: string;
    name: string;
  };
}

export function ProfileDetailView({
  profile,
  associatedLifelines = [],
  collections = [],
  collectionContext,
}: ProfileDetailViewProps) {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <ProfileQuickFacts profile={profile} collectionContext={collectionContext} />
      <ProfileBiography profile={profile} collectionContext={collectionContext} />
      <ProfileLegacyImpact profile={profile} collectionContext={collectionContext} />
    </div>
  );
}
