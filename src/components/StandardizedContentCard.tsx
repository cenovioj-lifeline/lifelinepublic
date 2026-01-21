import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { parseLifelineTitle } from "@/lib/lifelineTitle";
import { ContentTypeBanner } from "@/components/ContentTypeBanner";
import { fetchColorScheme } from "@/hooks/useColorScheme";

interface StandardizedContentCardProps {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  imagePositionX?: number | null;
  imagePositionY?: number | null;
  imageScale?: number | null;
  linkPath: string;
  badge?: string;
  type: 'lifeline' | 'collection' | 'election' | 'profile' | 'book';
  lifelineType?: string; // 'person' or 'list' - only for lifeline type cards
  collectionId?: string; // For prefetching color schemes on hover
  collectionSlug?: string; // For custom banner text (e.g., lifeline-inc)
}

export function StandardizedContentCard({
  title,
  description,
  imageUrl,
  imageAlt,
  imagePositionX,
  imagePositionY,
  imageScale,
  linkPath,
  badge,
  type,
  lifelineType,
  collectionId,
  collectionSlug,
}: StandardizedContentCardProps) {
  const queryClient = useQueryClient();
  
  // Parse title for person-type lifelines
  const parsed = type === 'lifeline' && lifelineType 
    ? parseLifelineTitle(title, lifelineType)
    : null;

  // Determine the label to show - use badge if provided, otherwise derive from type
  const showBanner = badge || type;

  // Prefetch color scheme on hover for collection cards
  const handleMouseEnter = () => {
    if (type === 'collection' && collectionId) {
      queryClient.prefetchQuery({
        queryKey: ["color-scheme", collectionId],
        queryFn: () => fetchColorScheme(collectionId),
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    }
  };

  return (
    <Link to={linkPath} className="group" onMouseEnter={handleMouseEnter}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow bg-[hsl(var(--scheme-card-bg))] border-[hsl(var(--scheme-card-border))]">
        {/* Standardized 16:9 aspect ratio image */}
        <div className="aspect-video relative overflow-hidden bg-white">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={imageAlt || title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              style={{
                objectPosition: `${imagePositionX ?? 50}% ${imagePositionY ?? 50}%`,
                transform: `scale(${imageScale ?? 1})`,
                transformOrigin: `${imagePositionX ?? 50}% ${imagePositionY ?? 50}%`
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No image
            </div>
          )}
        </div>
        
        {/* Banner - separate section below image */}
        <ContentTypeBanner type={badge || type} collectionSlug={collectionSlug} />
        
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
          </div>
        </CardHeader>
        {description && (
          <CardContent className="bg-[hsl(var(--scheme-card-bg))]">
            <p className="text-sm line-clamp-3 text-[hsl(var(--scheme-cards-text))]">{description}</p>
          </CardContent>
        )}
      </Card>
    </Link>
  );
}