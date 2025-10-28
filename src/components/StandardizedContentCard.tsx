import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StandardizedContentCardProps {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  imagePositionX?: number;
  imagePositionY?: number;
  linkPath: string;
  badge?: string;
  type: 'lifeline' | 'collection' | 'election';
}

export function StandardizedContentCard({
  title,
  description,
  imageUrl,
  imageAlt,
  imagePositionX = 50,
  imagePositionY = 50,
  linkPath,
  badge,
}: StandardizedContentCardProps) {
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
              style={{
                objectPosition: `${imagePositionX}% ${imagePositionY}%`,
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No image
            </div>
          )}
        </div>
        <CardHeader className="bg-[hsl(var(--scheme-card-bg))]">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg line-clamp-2 transition-colors text-[hsl(var(--scheme-card-text))]">
              {title}
            </CardTitle>
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