import { ReactNode } from "react";
import { BookOpen, Play, Mic, Globe, LucideIcon } from "lucide-react";
import type { MediaType } from "@/types/media";

interface MediaSectionProps {
  type: MediaType;
  count: number;
  children: ReactNode;
}

const SECTION_CONFIG: Record<MediaType, { icon: LucideIcon; label: string }> = {
  video: { icon: Play, label: "Videos" },
  book: { icon: BookOpen, label: "Books" },
  podcast: { icon: Mic, label: "Podcasts" },
  app: { icon: Globe, label: "Apps" },
};

export function MediaSection({ type, count, children }: MediaSectionProps) {
  const { icon: Icon, label } = SECTION_CONFIG[type];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-[hsl(var(--scheme-cards-border))]">
        <Icon className="h-5 w-5 text-[hsl(var(--scheme-title-text))]" />
        <h2 className="text-lg font-semibold text-[hsl(var(--scheme-title-text))]">
          {label}
        </h2>
        <span className="text-sm text-[hsl(var(--scheme-cards-text))] opacity-70">
          ({count})
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {children}
      </div>
    </div>
  );
}