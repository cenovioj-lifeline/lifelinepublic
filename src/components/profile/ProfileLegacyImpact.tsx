import { Card } from "@/components/ui/card";
import type { Profile } from "@/types/database";

interface ProfileLegacyImpactProps {
  profile: Profile;
  collectionContext?: {
    slug: string;
    name: string;
  };
}

export function ProfileLegacyImpact({ profile, collectionContext }: ProfileLegacyImpactProps) {
  const { fictional, real, org } = profile;

  const legacyData: { label: string; content: string }[] = [];

  if (fictional?.legacy_impact) {
    legacyData.push({
      label: "Legacy & Impact",
      content: fictional.legacy_impact
    });
  }

  if (fictional?.iconic_moments) {
    legacyData.push({
      label: "Iconic Moments",
      content: fictional.iconic_moments
    });
  }

  if (real?.legacy) {
    legacyData.push({
      label: "Legacy",
      content: real.legacy
    });
  }

  if (real?.accomplishments) {
    legacyData.push({
      label: "Key Accomplishments",
      content: real.accomplishments
    });
  }

  if (org?.impact) {
    legacyData.push({
      label: "Impact",
      content: org.impact
    });
  }

  if (org?.key_achievements) {
    legacyData.push({
      label: "Key Achievements",
      content: org.key_achievements
    });
  }

  if (legacyData.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {legacyData.map((item, index) => (
        <Card key={index} className={`p-6 ${
          collectionContext
            ? 'bg-[hsl(var(--scheme-cards-bg))] border-[hsl(var(--scheme-cards-border))] text-[hsl(var(--scheme-cards-text))]'
            : ''
        }`}>
          <h2 className="text-xl font-bold mb-4">{item.label}</h2>
          <div className={`space-y-2 ${
            collectionContext ? 'opacity-90' : 'text-muted-foreground'
          }`}>
            {item.content.split('\n').map((paragraph, idx) => (
              paragraph.trim() && (
                <p key={idx} className="leading-relaxed">
                  {paragraph}
                </p>
              )
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
