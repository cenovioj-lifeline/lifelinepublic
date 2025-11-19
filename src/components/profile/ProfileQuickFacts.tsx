import { Card } from "@/components/ui/card";
import type { Profile } from "@/types/database";

interface ProfileQuickFactsProps {
  profile: Profile;
  collectionContext?: {
    slug: string;
    name: string;
  };
}

export function ProfileQuickFacts({ profile, collectionContext }: ProfileQuickFactsProps) {
  const { fictional, real, org } = profile;

  const facts: { label: string; value: string | null }[] = [];

  // Fictional character facts
  if (fictional) {
    if (fictional.portrayed_by) facts.push({ label: "Portrayed By", value: fictional.portrayed_by });
    if (fictional.species) facts.push({ label: "Species", value: fictional.species });
    if (fictional.affiliation) facts.push({ label: "Affiliation", value: fictional.affiliation });
    if (fictional.occupation) facts.push({ label: "Occupation", value: fictional.occupation });
    if (fictional.status) facts.push({ label: "Status", value: fictional.status });
    if (fictional.first_appearance) facts.push({ label: "First Appearance", value: fictional.first_appearance });
    if (fictional.last_appearance) facts.push({ label: "Last Appearance", value: fictional.last_appearance });
  }

  // Real person facts
  if (real) {
    if (real.birth_date) facts.push({ label: "Born", value: real.birth_date });
    if (real.death_date) facts.push({ label: "Died", value: real.death_date });
    if (real.nationality) facts.push({ label: "Nationality", value: real.nationality });
    if (real.occupation) facts.push({ label: "Occupation", value: real.occupation });
    if (real.known_for) facts.push({ label: "Known For", value: real.known_for });
  }

  // Organization facts
  if (org) {
    if (org.founded) facts.push({ label: "Founded", value: org.founded });
    if (org.headquarters) facts.push({ label: "Headquarters", value: org.headquarters });
    if (org.industry) facts.push({ label: "Industry", value: org.industry });
    if (org.key_people) facts.push({ label: "Key People", value: org.key_people });
  }

  // Event facts (if applicable)
  // Note: Event-specific fields would be added here if needed

  if (facts.length === 0) {
    return null;
  }

  return (
    <Card className={`p-6 ${
      collectionContext
        ? 'bg-[hsl(var(--scheme-cards-bg))] border-[hsl(var(--scheme-cards-border))] text-[hsl(var(--scheme-cards-text))]'
        : ''
    }`}>
      <h2 className="text-xl font-bold mb-4">Quick Facts</h2>
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {facts.map((fact, index) => (
          <div key={index} className="space-y-1">
            <dt className="text-sm font-medium opacity-70">{fact.label}</dt>
            <dd className={collectionContext ? 'opacity-90' : 'text-muted-foreground'}>
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
