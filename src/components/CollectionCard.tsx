import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/FavoriteButton";

interface CollectionCardProps {
  collection: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    hero_image_url: string | null;
    card_image_position_x: number | null;
    card_image_position_y: number | null;
    is_featured?: boolean | null;
  };
  showFeaturedBadge?: boolean;
}

export function CollectionCard({ collection, showFeaturedBadge = false }: CollectionCardProps) {
  return (
    <Link
      to={`/public/collections/${collection.slug}`}
      className="group relative block h-full"
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full bg-[hsl(var(--scheme-card-bg))] border-[hsl(var(--scheme-card-border))]">
        <div className="absolute top-2 right-2 z-10">
          <FavoriteButton itemId={collection.id} itemType="collection" />
        </div>
        <div className="aspect-video relative bg-white overflow-hidden">
          {collection.hero_image_url ? (
            <img
              src={collection.hero_image_url}
              alt={collection.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              style={{
                objectPosition: `${collection.card_image_position_x ?? 50}% ${collection.card_image_position_y ?? 50}%`,
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
            <CardTitle className="text-xl transition-colors text-[hsl(var(--scheme-card-text))]">
              {collection.title}
            </CardTitle>
            {showFeaturedBadge && collection.is_featured && (
              <Badge variant="secondary">Featured</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="bg-[hsl(var(--scheme-card-bg))]">
          <p className="text-[hsl(var(--scheme-cards-text))] line-clamp-3">
            {collection.description || "Explore this collection"}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
