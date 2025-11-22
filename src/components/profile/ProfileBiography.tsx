import { Profile } from "@/types/profile";
import { Card } from "@/components/ui/card";

interface ProfileBiographyProps {
  profile: Profile;
  collectionContext?: {
    slug: string;
    name: string;
  };
}

export function ProfileBiography({ profile, collectionContext }: ProfileBiographyProps) {
  const fictional = profile.extended_data?.fictional;
  const legacy = profile.extended_data?.legacy;
  const org = profile.extended_data?.organization;

  const content = fictional?.character_arc_summary || 
                  legacy?.historical_significance || 
                  org?.mission_purpose;

  if (!content) return null;

  return (
    <Card className={`p-6 ${
      collectionContext
        ? 'bg-[hsl(var(--scheme-cards-bg))] border-[hsl(var(--scheme-cards-border))] text-[hsl(var(--scheme-cards-text))]'
        : ''
    }`}>
      <h2 className="text-xl font-bold mb-4">
        {fictional?.character_arc_summary ? "Character Arc" :
         org?.mission_purpose ? "Mission" : "Overview"}
      </h2>
      <p className={`leading-relaxed whitespace-pre-wrap ${collectionContext ? 'opacity-90' : 'text-muted-foreground'}`}>
        {content}
      </p>
    </Card>
  );
}
