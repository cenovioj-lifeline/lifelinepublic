import { Link } from "react-router-dom";
import { User, Building2, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProfileRowProps {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  subjectType: string;
  avatarUrl: string | null;
  isMatched?: boolean;
  density?: "compact" | "comfortable";
}

export function ProfileRow({
  name,
  slug,
  shortDescription,
  subjectType,
  avatarUrl,
  isMatched = false,
  density = "compact",
}: ProfileRowProps) {
  const isCompact = density === "compact";
  const isMobile = useIsMobile();

  // Get type badge styling
  const getTypeBadge = () => {
    switch (subjectType) {
      case "person_real":
        return {
          icon: <User className="w-3 h-3" />,
          label: isMobile ? "Real" : "Real Person",
          className: "bg-blue-100 text-blue-700",
        };
      case "person_fictional":
        return {
          icon: <Sparkles className="w-3 h-3" />,
          label: isMobile ? "Fict" : "Fictional",
          className: "bg-pink-100 text-pink-700",
        };
      case "organization":
        return {
          icon: <Building2 className="w-3 h-3" />,
          label: isMobile ? "Org" : "Organization",
          className: "bg-purple-100 text-purple-700",
        };
      default:
        return {
          icon: <User className="w-3 h-3" />,
          label: subjectType,
          className: "bg-slate-100 text-slate-700",
        };
    }
  };

  const badge = getTypeBadge();

  return (
    <Link
      to={`/public/profiles/${slug}`}
      className={cn(
        "flex items-center gap-3 rounded-lg bg-white transition-all hover:shadow-md hover:bg-slate-50 group",
        isCompact ? "p-2" : "p-3",
        isMatched && "bg-amber-50 border border-amber-200"
      )}
    >
      {/* Avatar */}
      <Avatar className={cn(isCompact ? "w-9 h-9" : "w-11 h-11", "shrink-0")}>
        <AvatarImage src={avatarUrl || undefined} alt={name} />
        <AvatarFallback
          className={cn(
            "text-sm font-medium",
            subjectType === "organization"
              ? "bg-purple-100 text-purple-700"
              : subjectType === "person_fictional"
              ? "bg-pink-100 text-pink-700"
              : "bg-blue-100 text-blue-700"
          )}
        >
          {name.charAt(0)}
        </AvatarFallback>
      </Avatar>

      {/* Type Badge */}
      <span
        className={cn(
          "shrink-0 rounded px-1.5 py-0.5 text-xs font-medium flex items-center gap-1",
          badge.className
        )}
      >
        {badge.icon}
        {!isCompact && <span>{badge.label}</span>}
      </span>

      {/* Name */}
      <span
        className={cn(
          "font-medium truncate",
          isCompact ? "text-sm" : "text-base",
          isMobile ? "flex-1" : "shrink-0 min-w-[120px]"
        )}
      >
        {name}
      </span>

      {/* Description - hidden on mobile */}
      {!isMobile && shortDescription && (
        <span className="flex-1 text-sm text-muted-foreground truncate min-w-0">
          {shortDescription}
        </span>
      )}

      {/* Hover hint (desktop only) */}
      <span className="hidden md:block text-xs bg-purple-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        Open →
      </span>
    </Link>
  );
}
