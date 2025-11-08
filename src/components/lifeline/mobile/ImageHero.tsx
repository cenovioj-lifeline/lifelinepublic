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
          "h-[320px] relative flex items-end p-6",
          isPositive ? "bg-gradient-to-br from-green-500/20 to-green-600/30" : "bg-gradient-to-br from-red-500/20 to-red-600/30"
        )}
      >
        <h1 className="text-3xl font-bold text-foreground drop-shadow-lg">
          {title}
        </h1>
      </div>
    );
  }

  return (
    <div className="h-[320px] relative overflow-hidden">
      {!imageLoaded && (
        <Skeleton className="absolute inset-0" />
      )}
      <img
        src={imageUrl}
        alt={title}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          imageLoaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={() => setImageLoaded(true)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h1 className="text-3xl font-bold text-white drop-shadow-lg">
          {title}
        </h1>
      </div>
    </div>
  );
};
