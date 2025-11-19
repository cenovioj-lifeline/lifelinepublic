import { Link } from "react-router-dom";
import { ProfileQuickFacts } from "./profile/ProfileQuickFacts";
import { ProfileBiography } from "./profile/ProfileBiography";
import { ProfileLegacyImpact } from "./profile/ProfileLegacyImpact";
import { Card } from "@/components/ui/card";
import type { ProfileWithRelations } from "@/hooks/useProfileData";

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
  const myLifeline = associatedLifelines.find((l) => l.relationship_type === 'subject');
  const appearsInLifelines = associatedLifelines.filter((l) => l.relationship_type !== 'subject');

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <ProfileQuickFacts profile={profile} collectionContext={collectionContext} />
      <ProfileBiography profile={profile} collectionContext={collectionContext} />
      <ProfileLegacyImpact profile={profile} collectionContext={collectionContext} />

      {myLifeline && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">My Lifeline</h2>
          <Link
            to={collectionContext 
              ? `/public/collections/${collectionContext.slug}/lifelines/${myLifeline.slug}`
              : `/public/lifelines/${myLifeline.slug}`}
            className="block p-4 rounded-lg border hover:border-primary transition-colors"
          >
            <h3 className="text-lg font-semibold">{myLifeline.title}</h3>
            {myLifeline.description && (
              <p className="text-sm text-muted-foreground mt-2">{myLifeline.description}</p>
            )}
          </Link>
        </Card>
      )}

      {appearsInLifelines.length > 0 && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Appears in Lifelines</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {appearsInLifelines.map((lifeline: any) => (
              <Link
                key={lifeline.id}
                to={collectionContext 
                  ? `/public/collections/${collectionContext.slug}/lifelines/${lifeline.slug}`
                  : `/public/lifelines/${lifeline.slug}`}
                className="block p-4 rounded-lg border hover:border-primary transition-colors"
              >
                <h3 className="text-lg font-semibold">{lifeline.title}</h3>
                {lifeline.description && (
                  <p className="text-sm text-muted-foreground mt-2">{lifeline.description}</p>
                )}
              </Link>
            ))}
          </div>
        </Card>
      )}

      {collections && collections.length > 0 && (
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Related Collections</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {collections.map((collection: any) => (
              <Link
                key={collection.id}
                to={`/public/collections/${collection.slug}`}
                className="block p-4 rounded-lg border hover:border-primary transition-colors"
              >
                <h3 className="text-lg font-semibold">{collection.title}</h3>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
