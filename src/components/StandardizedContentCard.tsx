import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CroppedImage } from "@/components/ui/CroppedImage";
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
  cardLabel?: string | null; // Custom label for card banner (e.g., "Investor Tour / Sales Pitch")
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
  cardLabel,
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
    <Link to={linkPath} className="group h-full" onMouseEnter={handleMouseEnter}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col bg-[hsl(var(--scheme-cards-bg))] border-[hsl(var(--scheme-cards-border))]">
        {/* Standardized 16:9 aspect ratio image */}
        <CroppedImage
          src={imageUrl}
          alt={imageAlt || title}
          centerX={imagePositionX ?? 50}
          centerY={imagePositionY ?? 50}
          scale={imageScale ?? 1}
          className="aspect-video bg-white"
          fallback={
            <span className="text-gray-400">No image</span>
          }
        />
        
        {/* Banner - separate section below image */}
        <ContentTypeBanner type={badge || type} cardLabel={cardLabel} />
        
        <CardHeader className="bg-[hsl(var(--scheme-cards-bg))] flex-1">
          <div className="flex items-start justify-between gap-2">
            {parsed?.isPersonType ? (
              <div className="space-y-0.5 flex-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--scheme-person-name-accent))] block">
                  {parsed.personName}
                </span>
                <span className="text-lg font-semibold transition-colors text-[hsl(var(--scheme-cards-text))] block line-clamp-2">
                  {parsed.contextTitle}
                </span>
              </div>
            ) : (
              <span className="text-lg font-semibold line-clamp-2 transition-colors text-[hsl(var(--scheme-cards-text))]">
                {title}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="bg-[hsl(var(--scheme-cards-bg))]">
          <p className="text-sm line-clamp-3 text-[hsl(var(--scheme-cards-text))] min-h-[3.75rem]">
            {description || '\u00A0'}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}