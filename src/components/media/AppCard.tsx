import { Globe, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppCardProps {
  title: string;
  description?: string | null;
  appUrl: string;
  thumbnailUrl?: string | null;
}

export function AppCard({ title, description, appUrl, thumbnailUrl }: AppCardProps) {
  const handleClick = () => {
    if (appUrl) {
      window.open(appUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className="flex flex-col overflow-hidden rounded-lg border border-[hsl(var(--scheme-cards-border))] bg-[hsl(var(--scheme-cards-bg))] cursor-pointer hover:shadow-lg transition-shadow"
      onClick={handleClick}
    >
      {/* Thumbnail */}
      <div className="aspect-2/3 w-full bg-muted relative overflow-hidden">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-blue-500/20 to-purple-500/20">
            <Globe className="h-16 w-16 text-[hsl(var(--scheme-cards-text))] opacity-50" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 space-y-3">
        <h3 className="font-semibold text-sm text-[hsl(var(--scheme-cards-text))] line-clamp-2">
          {title}
        </h3>
        
        {description && (
          <p className="text-xs text-[hsl(var(--scheme-cards-text))] opacity-70 line-clamp-3 flex-1">
            {description}
          </p>
        )}

        <Button
          size="sm"
          variant="secondary"
          className="w-full mt-auto"
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          Visit App
        </Button>
      </div>
    </div>
  );
}