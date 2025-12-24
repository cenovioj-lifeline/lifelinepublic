import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Heart, Briefcase, User } from "lucide-react";
import { Link } from "react-router-dom";

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

interface ProfileRelationshipsProps {
  relationships: ProfileRelationship[];
  collectionSlug?: string;
}

function getRelationshipIcon(type: string) {
  const lowerType = type.toLowerCase();
  if (lowerType.includes('family') || lowerType.includes('parent') || lowerType.includes('sibling')) {
    return <Users className="h-4 w-4" />;
  }
  if (lowerType.includes('lover') || lowerType.includes('spouse') || lowerType.includes('romantic')) {
    return <Heart className="h-4 w-4" />;
  }
  if (lowerType.includes('colleague') || lowerType.includes('mentor') || lowerType.includes('professional')) {
    return <Briefcase className="h-4 w-4" />;
  }
  return <User className="h-4 w-4" />;
}

function groupRelationships(relationships: ProfileRelationship[]) {
  const groups: Record<string, ProfileRelationship[]> = {};
  
  relationships.forEach(rel => {
    if (!groups[rel.relationship_type]) {
      groups[rel.relationship_type] = [];
    }
    groups[rel.relationship_type].push(rel);
  });
  
  return groups;
}

export function ProfileRelationships({ relationships, collectionSlug }: ProfileRelationshipsProps) {
  const grouped = groupRelationships(relationships);
  const hasContext = !!collectionSlug;

  const textStyle = hasContext ? { color: 'hsl(var(--scheme-profile-text))' } : undefined;

  return (
    <Card className={`p-6 ${hasContext ? 'bg-[hsl(var(--scheme-cards-bg))] border-[hsl(var(--scheme-cards-border))]' : ''}`}>
      <h2 className="text-xl font-bold mb-4" style={textStyle}>Relationships</h2>
      <div className="space-y-6">
        {Object.entries(grouped).map(([type, rels]) => (
          <div key={type} className="space-y-3">
            <div className="flex items-center gap-2">
              <span style={hasContext ? { color: 'hsl(var(--scheme-profile-text))' } : undefined}>
                {getRelationshipIcon(type)}
              </span>
              <h3 
                className="font-semibold"
                style={hasContext ? { color: 'hsl(var(--scheme-profile-text))' } : undefined}
              >
                {type}
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-6">
              {rels.map((rel) => {
                const content = (
                  <div 
                    className="p-3 border rounded-lg hover:bg-accent transition-colors"
                    style={hasContext ? { borderColor: 'hsl(var(--scheme-cards-border))' } : undefined}
                  >
                    <div 
                      className="font-medium"
                      style={hasContext ? { color: 'hsl(var(--scheme-profile-text))' } : undefined}
                    >
                      {rel.target_name}
                    </div>
                    {rel.context && (
                      <p 
                        className={`text-sm mt-1 ${hasContext ? '' : 'text-muted-foreground'}`}
                        style={hasContext ? { color: 'hsl(var(--scheme-profile-text))', opacity: 0.7 } : undefined}
                      >
                        {rel.context}
                      </p>
                    )}
                    {rel.related_profile && (
                      <Badge variant="outline" className="mt-2">
                        {rel.related_profile.subject_type}
                      </Badge>
                    )}
                  </div>
                );

                if (rel.related_profile) {
                  const linkPath = collectionSlug 
                    ? `/collections/${collectionSlug}/profiles/${rel.related_profile.slug}`
                    : `/public/profiles/${rel.related_profile.slug}`;
                  
                  return (
                    <Link key={rel.id} to={linkPath}>
                      {content}
                    </Link>
                  );
                }

                return <div key={rel.id}>{content}</div>;
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
