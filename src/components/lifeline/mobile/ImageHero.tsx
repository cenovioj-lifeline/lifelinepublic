import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface ImageHeroProps {
  imageUrl: string | null;
  title: string;
  rating: number;
}

export const ImageHero = ({ imageUrl, title, rating }: ImageHeroProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const isPositive = rating >= 0;

  if (!imageUrl) {
    // Gradient fallback
    return (
      <div 
        className={cn(
          "h-[320px] relative",
          isPositive ? "bg-gradient-to-br from-green-500/20 to-green-600/30" : "bg-gradient-to-br from-red-500/20 to-red-600/30"
        )}
      />
    );
  }

  return (
    <div className="h-[320px] relative overflow-hidden bg-muted">
      {!imageLoaded && (
        <div className="absolute inset-0">
          <Skeleton className="w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/20" />
        </div>
      )}
      <img
        src={imageUrl}
        alt={title}
        className={cn(
          "w-full h-full object-cover transition-all duration-300",
          imageLoaded ? "opacity-100 blur-0" : "opacity-0 blur-sm"
        )}
        onLoad={() => setImageLoaded(true)}
      />
      <div className="absolute bottom-4 right-4">
        <div className={cn(
          "rounded-md px-3 py-1.5 border-2 shadow-lg",
          isPositive ? "bg-green-500 border-green-600" : "bg-red-500 border-red-600"
        )}>
          <span className="text-sm font-bold text-white">
            {rating >= 0 ? '+' : ''}{rating}
          </span>
        </div>
      </div>
    </div>
  );
};
