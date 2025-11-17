import { Profile, hasModule } from "@/types/profile";
import { ProfileHero } from "./profile/ProfileHero";
import { ProfileQuickFacts } from "./profile/ProfileQuickFacts";
import { ProfileBiography } from "./profile/ProfileBiography";
import { ProfileRelationships } from "./profile/ProfileRelationships";
import { ProfileWorks } from "./profile/ProfileWorks";
import { ProfileLegacyImpact } from "./profile/ProfileLegacyImpact";
import { ProfilePhysicalCharacteristics } from "./profile/ProfilePhysicalCharacteristics";

interface ProfileRelationship {
  id: string;
  relationship_type: string;
  target_name: string;
  context?: string;
  related_profile?: {
    id: string;
    name: string;
    slug: string;
    subject_type: string;
  } | null;
}

interface ProfileWork {
  id: string;
  work_category: string;
  title: string;
  year?: string;
  work_type?: string;
  significance?: string;
  additional_info?: any;
}

interface ProfileWithRelations extends Profile {
  avatar_image?: { 
    url: string; 
    alt_text?: string;
    id?: string;
    position_x?: number;
    position_y?: number;
    scale?: number;
  };
  image_query?: string;
  profile_relationships: ProfileRelationship[];
  profile_works: ProfileWork[];
}

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
    <div className="space-y-8">
      <ProfileHero profile={profile} onImageUpdate={() => window.location.reload()} />

      {(hasModule(profile, 'biographical') || 
        hasModule(profile, 'fictional') || 
        hasModule(profile, 'organization')) && (
        <ProfileQuickFacts profile={profile} />
      )}

      {(hasModule(profile, 'biographical') || 
        hasModule(profile, 'fictional') || 
        hasModule(profile, 'organization')) && (
        <ProfileBiography profile={profile} />
      )}

      {profile.profile_relationships && profile.profile_relationships.length > 0 && (
        <ProfileRelationships 
          relationships={profile.profile_relationships}
          collectionSlug={collectionContext?.slug}
        />
      )}

      {profile.profile_works && profile.profile_works.length > 0 && (
        <ProfileWorks works={profile.profile_works} />
      )}

      {hasModule(profile, 'legacy') && (
        <ProfileLegacyImpact profile={profile} />
      )}

      {hasModule(profile, 'physical') && (
        <ProfilePhysicalCharacteristics profile={profile} />
      )}

      {associatedLifelines && associatedLifelines.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Associated Lifelines</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {associatedLifelines.map((lifeline: any) => (
              <div key={lifeline.id} className="p-4 border rounded-lg bg-card">
                <h3 className="font-semibold">{lifeline.title}</h3>
                <p className="text-sm text-muted-foreground">{lifeline.type}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {collections && collections.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Related Collections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {collections.map((collection: any) => (
              <div key={collection.id} className="p-4 border rounded-lg bg-card">
                <h3 className="font-semibold">{collection.title}</h3>
                {collection.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {collection.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
