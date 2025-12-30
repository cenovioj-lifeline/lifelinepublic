/**
 * BookSidebar
 *
 * Filter sidebar for book content feed.
 * Displays category buttons with counts.
 */

import { Button } from "@/components/ui/button";
import { LayoutGrid, Lightbulb, PenTool, Users, Quote, Wrench } from "lucide-react";
import type { ContentType } from "@/types/book";
import { CONTENT_TYPE_CONFIG } from "@/types/book";

interface BookSidebarProps {
  activeFilter: ContentType | 'all';
  onFilterChange: (filter: ContentType | 'all') => void;
  counts: Record<ContentType, number>;
  onBackClick: () => void;
  bookTitle: string;
  authorName: string;
  hasContext?: boolean;
  backLabel?: string;
}

const FILTER_ICONS: Record<ContentType | 'all', typeof LayoutGrid> = {
  all: LayoutGrid,
  insight: Lightbulb,
  framework: PenTool,
  story: Users,
  quote: Quote,
  practical_use: Wrench,
};

export function BookSidebar({
  activeFilter,
  onFilterChange,
  counts,
  onBackClick,
  bookTitle,
  authorName,
  hasContext = false,
  backLabel = 'Back to Profile',
}: BookSidebarProps) {
  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

  const filters: Array<{ id: ContentType | 'all'; label: string; count: number }> = [
    { id: 'all', label: 'All Content', count: totalCount },
    { id: 'insight', label: CONTENT_TYPE_CONFIG.insight.pluralLabel, count: counts.insight },
    { id: 'framework', label: CONTENT_TYPE_CONFIG.framework.pluralLabel, count: counts.framework },
    { id: 'story', label: CONTENT_TYPE_CONFIG.story.pluralLabel, count: counts.story },
    { id: 'quote', label: CONTENT_TYPE_CONFIG.quote.pluralLabel, count: counts.quote },
    { id: 'practical_use', label: CONTENT_TYPE_CONFIG.practical_use.pluralLabel, count: counts.practical_use },
  ];

  return (
    <div className="w-full md:w-64 md:border-r border-border p-4 flex flex-col gap-4 sticky top-0 md:h-screen z-10 bg-background">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={onBackClick}
        className="justify-start mb-2 text-muted-foreground hover:text-foreground"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-2"
        >
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </svg>
        {backLabel}
      </Button>

      {/* Book Info */}
      <div className="px-2 mb-4">
        <p className="text-xs font-medium text-muted-foreground">Reading</p>
        <h2 className="font-bold text-sm leading-tight text-foreground">{bookTitle}</h2>
        <p className="text-xs text-muted-foreground">
          {authorName}
        </p>
      </div>

      {/* Filter Buttons */}
      <div className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
        {filters.map((filter) => {
          const Icon = FILTER_ICONS[filter.id];
          const isActive = activeFilter === filter.id;

          // Active button uses scheme accent color in collection context
          const buttonStyle: React.CSSProperties = isActive
            ? hasContext
              ? { backgroundColor: "hsl(var(--scheme-nav-button))", color: "hsl(var(--scheme-nav-text))" }
              : { backgroundColor: "hsl(220 9% 20%)", color: "white" }
            : {};

          return (
            <Button
              key={filter.id}
              variant={isActive ? "secondary" : "ghost"}
              className={`justify-start whitespace-nowrap ${isActive ? 'shadow-md font-medium' : 'text-foreground'}`}
              style={buttonStyle}
              onClick={() => onFilterChange(filter.id)}
            >
              <Icon className={`mr-2 h-4 w-4 ${filter.id === 'quote' ? 'fill-current' : ''}`} />
              {filter.label}
              {filter.count > 0 && (
                <span className="ml-auto text-xs opacity-70">{filter.count}</span>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
