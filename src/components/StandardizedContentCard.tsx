import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { parseLifelineTitle } from "@/lib/lifelineTitle";

interface StandardizedContentCardProps {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  linkPath: string;
  badge?: string;
  type: 'lifeline' | 'collection' | 'election';
  lifelineType?: string; // 'person' or 'list' - only for lifeline type cards
}

export function StandardizedContentCard({
  title,
  description,
  imageUrl,
  imageAlt,
  linkPath,
  badge,
  type,
  lifelineType,
}: StandardizedContentCardProps) {
  // Parse title for person-type lifelines
  const parsed = type === 'lifeline' && lifelineType 
    ? parseLifelineTitle(title, lifelineType)
    : null;

  return (
    <Link to={linkPath} className="group">
      <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full bg-[hsl(var(--scheme-card-bg))] border-[hsl(var(--scheme-card-border))]">
        {/* Standardized 16:9 aspect ratio image */}
        <div className="aspect-video relative overflow-hidden bg-white">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={imageAlt || title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No image
            </div>
          )}
        </div>
        <CardHeader className="bg-[hsl(var(--scheme-card-bg))]">
          <div className="flex items-start justify-between gap-2">
            {parsed?.isPersonType ? (
              <div className="space-y-0.5 flex-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--scheme-person-name-accent))] block">
                  {parsed.personName}
                </span>
                <span className="text-lg font-semibold transition-colors text-[hsl(var(--scheme-card-text))] block line-clamp-2">
                  {parsed.contextTitle}
                </span>
              </div>
            ) : (
              <span className="text-lg font-semibold line-clamp-2 transition-colors text-[hsl(var(--scheme-card-text))]">
                {title}
              </span>
            )}
            {badge && <Badge variant="secondary">{badge}</Badge>}
          </div>
        </CardHeader>
        {description && (
          <CardContent className="bg-[hsl(var(--scheme-card-bg))]">
            <p className="text-sm line-clamp-2 text-[hsl(var(--scheme-cards-text))]">{description}</p>
          </CardContent>
        )}
      </Card>
    </Link>
  );
}