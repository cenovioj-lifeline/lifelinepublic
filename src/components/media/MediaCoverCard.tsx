import { Book, Play, Mic, Globe } from "lucide-react";
import type { MediaType } from "@/types/media";

// Theme color mapping for covers
const themeColorMap: Record<string, { bg: string; text: string }> = {
  slate: { bg: 'bg-slate-700', text: 'text-slate-100' },
  red: { bg: 'bg-red-700', text: 'text-red-100' },
  orange: { bg: 'bg-orange-700', text: 'text-orange-100' },
  amber: { bg: 'bg-amber-700', text: 'text-amber-100' },
  yellow: { bg: 'bg-yellow-600', text: 'text-yellow-100' },
  lime: { bg: 'bg-lime-700', text: 'text-lime-100' },
  green: { bg: 'bg-green-700', text: 'text-green-100' },
  emerald: { bg: 'bg-emerald-700', text: 'text-emerald-100' },
  teal: { bg: 'bg-teal-700', text: 'text-teal-100' },
  cyan: { bg: 'bg-cyan-700', text: 'text-cyan-100' },
  sky: { bg: 'bg-sky-700', text: 'text-sky-100' },
  blue: { bg: 'bg-blue-700', text: 'text-blue-100' },
  indigo: { bg: 'bg-indigo-700', text: 'text-indigo-100' },
  violet: { bg: 'bg-violet-700', text: 'text-violet-100' },
  purple: { bg: 'bg-purple-700', text: 'text-purple-100' },
  fuchsia: { bg: 'bg-fuchsia-700', text: 'text-fuchsia-100' },
  pink: { bg: 'bg-pink-700', text: 'text-pink-100' },
  rose: { bg: 'bg-rose-700', text: 'text-rose-100' },
};

// Default colors for each media type when no theme color is set
const defaultTypeColors: Record<MediaType, string> = {
  book: 'slate',
  video: 'red',
  podcast: 'purple',
  app: 'blue',
};

interface MediaCoverCardProps {
  type: MediaType;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  themeColor?: string | null;
  onClick?: () => void;
}

const typeIcons: Record<MediaType, typeof Book> = {
  book: Book,
  video: Play,
  podcast: Mic,
  app: Globe,
};

export function MediaCoverCard({
  type,
  title,
  subtitle,
  description,
  imageUrl,
  themeColor,
  onClick,
}: MediaCoverCardProps) {
  const effectiveColor = themeColor || defaultTypeColors[type];
  const themeColors = themeColorMap[effectiveColor] || themeColorMap.slate;
  const hasImage = !!imageUrl;
  const TypeIcon = typeIcons[type];

  return (
    <div
      className="group cursor-pointer space-y-2"
      onClick={onClick}
    >
      {/* Cover with 2:3 aspect ratio */}
      <div className="relative aspect-2/3 w-full overflow-hidden rounded-lg shadow-md transition-all duration-200 group-hover:shadow-xl group-hover:scale-[1.02]">
        {hasImage ? (
          <>
            <img
              src={imageUrl}
              alt={`Cover of ${title}`}
              className="h-full w-full object-cover"
            />
            {/* Type indicator badge */}
            <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1.5">
              <TypeIcon className="h-3 w-3 text-white" />
            </div>
          </>
        ) : (
          /* Placeholder cover with theme color */
          <div className={`h-full w-full ${themeColors.bg} flex flex-col items-center justify-center p-4`}>
            {/* Decorative top bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-black/20" />
            
            {/* Type icon */}
            <TypeIcon className={`${themeColors.text}/50 h-8 w-8 mb-4`} />
            
            {/* Title on cover */}
            <h3 className={`${themeColors.text} text-center font-serif text-sm sm:text-base font-bold leading-tight line-clamp-4 px-2`}>
              {title}
            </h3>
            
            {/* Subtitle if exists */}
            {subtitle && (
              <p className={`${themeColors.text}/80 text-center text-xs mt-2 line-clamp-2 px-2`}>
                {subtitle}
              </p>
            )}
            
            {/* Decorative bottom bar */}
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-black/20" />
            
            {/* Spine effect */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-black/30" />
          </div>
        )}
      </div>

      {/* Info Below Cover */}
      <div className="space-y-0.5">
        <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors text-[hsl(var(--scheme-cards-text))]">
          {title}
        </h3>
        {description && (
          <p className="text-xs text-[hsl(var(--scheme-cards-text))] line-clamp-2">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
