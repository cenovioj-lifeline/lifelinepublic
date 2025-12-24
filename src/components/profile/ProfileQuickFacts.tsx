import { Profile, formatDate } from "@/types/profile";
import { Calendar, MapPin, Briefcase, Users, Building2, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ProfileQuickFactsProps {
  profile: Profile;
  collectionContext?: {
    slug: string;
    name: string;
  };
}

export function ProfileQuickFacts({ profile, collectionContext }: ProfileQuickFactsProps) {
  const facts: Array<{ icon: React.ReactNode; label: string; value: string }> = [];

  const bio = profile.extended_data?.biographical;
  const fictional = profile.extended_data?.fictional;
  const org = profile.extended_data?.organization;

  // Biographical facts
  if (bio?.birth_date) {
    facts.push({
      icon: <Calendar className="h-4 w-4" />,
      label: "Born",
      value: formatDate(bio.birth_date) + (bio.birth_place ? ` in ${bio.birth_place}` : ''),
    });
  }

  if (bio?.death_date) {
    facts.push({
      icon: <Calendar className="h-4 w-4" />,
      label: "Died",
      value: formatDate(bio.death_date) + (bio.death_place ? ` in ${bio.death_place}` : ''),
    });
  }

  if (bio?.nationality) {
    const nationality = Array.isArray(bio.nationality) ? bio.nationality.join(', ') : bio.nationality;
    facts.push({
      icon: <MapPin className="h-4 w-4" />,
      label: "Nationality",
      value: nationality,
    });
  }

  const rawOccupation: any = bio?.occupation as any;
  const occupations = Array.isArray(rawOccupation)
    ? rawOccupation
    : typeof rawOccupation === 'string'
      ? rawOccupation.split(/[|,]/).map((s: string) => s.trim()).filter(Boolean)
      : [];
  if (occupations.length > 0) {
    facts.push({
      icon: <Briefcase className="h-4 w-4" />,
      label: "Occupation",
      value: occupations.join(', '),
    });
  }

  // Fictional character facts
  if (fictional?.universe) {
    facts.push({
      icon: <Sparkles className="h-4 w-4" />,
      label: "Universe",
      value: fictional.universe,
    });
  }

  if (fictional?.creators) {
    const rawCreators: any = fictional.creators as any;
    const creators = Array.isArray(rawCreators)
      ? rawCreators
      : typeof rawCreators === 'string'
        ? rawCreators.split(/[|,]/).map((s: string) => s.trim()).filter(Boolean)
        : [];
    if (creators.length > 0) {
      facts.push({
        icon: <Users className="h-4 w-4" />,
        label: "Created by",
        value: creators.join(', '),
      });
    }
  }

  if (fictional?.portrayed_by) {
    const portrayed = Array.isArray(fictional.portrayed_by) 
      ? fictional.portrayed_by.join(', ') 
      : fictional.portrayed_by;
    facts.push({
      icon: <Users className="h-4 w-4" />,
      label: "Portrayed by",
      value: portrayed,
    });
  }

  if (fictional?.first_appearance) {
    facts.push({
      icon: <Calendar className="h-4 w-4" />,
      label: "First appearance",
      value: fictional.first_appearance,
    });
  }

  // Organization facts
  if (org?.founded_date) {
    facts.push({
      icon: <Calendar className="h-4 w-4" />,
      label: "Founded",
      value: formatDate(org.founded_date),
    });
  }

  if (org?.headquarters) {
    facts.push({
      icon: <Building2 className="h-4 w-4" />,
      label: "Headquarters",
      value: org.headquarters,
    });
  }

  if (facts.length === 0) return null;

  return (
    <Card className={`p-6 ${
      collectionContext
        ? 'bg-[hsl(var(--scheme-cards-bg))] border-[hsl(var(--scheme-cards-border))]'
        : ''
    }`}>
      <h2 className="text-xl font-bold mb-4">Quick Facts</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {facts.map((fact, index) => (
          <div key={index} className="flex gap-3 items-start">
            <div 
              className={collectionContext ? 'mt-0.5' : 'text-primary mt-0.5'}
              style={collectionContext ? { color: 'hsl(var(--scheme-profile-text))', opacity: 0.7 } : undefined}
            >
              {fact.icon}
            </div>
            <div className="flex-1">
              <div 
                className={`text-sm font-medium ${collectionContext ? '' : 'text-muted-foreground'}`}
                style={collectionContext ? { color: 'hsl(var(--scheme-profile-text))', opacity: 0.7 } : undefined}
              >
                {fact.label}
              </div>
              <div 
                className="text-sm"
                style={collectionContext ? { color: 'hsl(var(--scheme-profile-text))' } : undefined}
              >
                {fact.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
