import { Link } from "react-router-dom";
import { User, List } from "lucide-react";
import { cn } from "@/lib/utils";

interface LifelineRowProps {
  id: string;
  title: string;
  slug: string;
  lifelineType: string;
  coverImageUrl: string | null;
  entryCount: number;
  collectionSlug: string;
  isMatched?: boolean;
  density?: "compact" | "comfortable";
}

export function LifelineRow({
  title,
  slug,
  lifelineType,
  coverImageUrl,
  entryCount,
  collectionSlug,
  isMatched = false,
  density = "compact",
}: LifelineRowProps) {
  const isCompact = density === "compact";

  return (
    <Link
      to={`/public/collections/${collectionSlug}/lifelines/${slug}`}
      className={cn(
        "flex items-center gap-3 rounded-lg bg-white transition-all hover:shadow-md hover:bg-slate-50 group",
        isCompact ? "p-2" : "p-3",
        isMatched && "bg-amber-50 border border-amber-200"
      )}
    >
      {/* Thumbnail */}
      <div
        className={cn(
          "rounded flex-shrink-0 bg-gradient-to-br from-slate-200 to-slate-300",
          isCompact ? "w-8 h-8" : "w-12 h-12"
        )}
        style={
          coverImageUrl
            ? {
                backgroundImage: `url(${coverImageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined
        }
      />

      {/* Type Icon */}
      <span
        className={cn(
          "flex-shrink-0 rounded px-1.5 py-0.5 text-xs font-medium uppercase tracking-wide",
          lifelineType === "person"
            ? "bg-green-100 text-green-700"
            : "bg-orange-100 text-orange-700"
        )}
      >
        {lifelineType === "person" ? (
          <User className="w-3 h-3 inline-block" />
        ) : (
          <List className="w-3 h-3 inline-block" />
        )}
        {!isCompact && <span className="ml-1">{lifelineType}</span>}
      </span>

      {/* Title */}
      <span
        className={cn(
          "flex-1 font-medium truncate min-w-0",
          isCompact ? "text-sm" : "text-base"
        )}
      >
        {title}
      </span>

      {/* Entry Count */}
      <span className="text-xs text-muted-foreground flex-shrink-0">
        {entryCount} {isCompact ? "" : "entries"}
      </span>

      {/* Hover hint (desktop only) */}
      <span className="hidden md:block text-xs bg-slate-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        Open →
      </span>
    </Link>
  );
}
