import { Profile } from "@/types/profile";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, Sparkles, TrendingUp, AlertCircle } from "lucide-react";

interface ProfileLegacyImpactProps {
  profile: Profile;
  collectionContext?: {
    slug: string;
    name: string;
  };
}

export function ProfileLegacyImpact({ profile, collectionContext }: ProfileLegacyImpactProps) {
  const legacy = profile.extended_data?.legacy;
  
  if (!legacy) return null;

  const sections = [];

  if (legacy.major_accomplishments && legacy.major_accomplishments.length > 0) {
    sections.push({
      id: "accomplishments",
      label: "Accomplishments",
      icon: <Award className="h-4 w-4" />,
      content: legacy.major_accomplishments,
    });
  }

  if (legacy.cultural_impact && legacy.cultural_impact.length > 0) {
    sections.push({
      id: "impact",
      label: "Cultural Impact",
      icon: <Sparkles className="h-4 w-4" />,
      content: legacy.cultural_impact,
    });
  }

  if (legacy.awards_honors && legacy.awards_honors.length > 0) {
    sections.push({
      id: "awards",
      label: "Awards & Honors",
      icon: <TrendingUp className="h-4 w-4" />,
      content: legacy.awards_honors,
    });
  }

  if (legacy.controversies && legacy.controversies.length > 0) {
    sections.push({
      id: "controversies",
      label: "Controversies",
      icon: <AlertCircle className="h-4 w-4" />,
      content: legacy.controversies,
    });
  }

  if (sections.length === 0) return null;

  const textStyle = collectionContext ? { color: 'hsl(var(--scheme-profile-text))' } : undefined;
  const mutedStyle = collectionContext ? { color: 'hsl(var(--scheme-profile-text))', opacity: 0.7 } : undefined;

  return (
    <Card className={`p-6 ${
      collectionContext
        ? 'bg-[hsl(var(--scheme-cards-bg))] border-[hsl(var(--scheme-cards-border))]'
        : ''
    }`}>
      <h2 className="text-xl font-bold mb-4" style={textStyle}>Legacy & Impact</h2>
      <Tabs defaultValue={sections[0].id} className="w-full">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${sections.length}, 1fr)` }}>
          {sections.map((section) => (
            <TabsTrigger key={section.id} value={section.id} className="flex items-center gap-2">
              <span style={mutedStyle}>{section.icon}</span>
              <span className="hidden sm:inline" style={textStyle}>{section.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        {sections.map((section) => (
          <TabsContent key={section.id} value={section.id} className="mt-4">
            <ul className="space-y-2">
              {(Array.isArray(section.content)
                ? section.content
                : typeof section.content === 'string'
                  ? section.content.split(/[|,]/).map((s: string) => s.trim()).filter(Boolean)
                  : []
              ).map((item: any, index: number) => (
                <li key={index} className="flex gap-3">
                  <span 
                    className={collectionContext ? 'mt-1.5' : 'text-primary mt-1.5'}
                    style={mutedStyle}
                  >•</span>
                  <span className="flex-1" style={textStyle}>{String(item)}</span>
                </li>
              ))}
            </ul>
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  );
}
