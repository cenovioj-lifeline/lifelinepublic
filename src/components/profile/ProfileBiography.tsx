import { Card } from "@/components/ui/card";
import type { ProfileWithRelations } from "@/hooks/useProfileData";

type Profile = ProfileWithRelations;

interface ProfileBiographyProps {
  profile: Profile;
  collectionContext?: {
    slug: string;
    name: string;
  };
}

export function ProfileBiography({ profile, collectionContext }: ProfileBiographyProps) {
  const { fictional, real, org } = profile;

  const content = 
    fictional?.character_arc_summary ||
    real?.biography ||
    org?.history ||
    "No biography available";

  if (content === "No biography available") {
    return null;
  }

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
