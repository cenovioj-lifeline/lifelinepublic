import { Profile } from "@/types/profile";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, Sparkles, TrendingUp, AlertCircle } from "lucide-react";

interface ProfileLegacyImpactProps {
  profile: Profile;
}

export function ProfileLegacyImpact({ profile }: ProfileLegacyImpactProps) {
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

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold mb-4">Legacy & Impact</h2>
      <Tabs defaultValue={sections[0].id} className="w-full">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${sections.length}, 1fr)` }}>
          {sections.map((section) => (
            <TabsTrigger key={section.id} value={section.id} className="flex items-center gap-2">
              {section.icon}
              <span className="hidden sm:inline">{section.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        {sections.map((section) => (
          <TabsContent key={section.id} value={section.id} className="mt-4">
            <ul className="space-y-2">
              {section.content.map((item, index) => (
                <li key={index} className="flex gap-3">
                  <span className="text-primary mt-1.5">•</span>
                  <span className="flex-1">{item}</span>
                </li>
              ))}
            </ul>
          </TabsContent>
        ))}
      </Tabs>
    </Card>
  );
}
