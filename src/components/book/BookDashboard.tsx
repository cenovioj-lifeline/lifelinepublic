/**
 * BookDashboard
 *
 * Grid view of content categories with counts.
 * Shown when "All Content" filter is selected.
 */

import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, PenTool, Users, Quote, Wrench } from "lucide-react";
import type { ContentType } from "@/types/book";
import { CONTENT_TYPE_CONFIG } from "@/types/book";

interface BookDashboardProps {
  counts: Record<ContentType, number>;
  onSelectType: (type: ContentType) => void;
  bookTitle: string;
  hasContext?: boolean;
}

const TYPE_ICONS: Record<ContentType, typeof Lightbulb> = {
  insight: Lightbulb,
  framework: PenTool,
  story: Users,
  quote: Quote,
  practical_use: Wrench,
};

export function BookDashboard({ counts, onSelectType, bookTitle, hasContext = false }: BookDashboardProps) {
  const categories: Array<{
    type: ContentType;
    label: string;
    count: number;
  }> = [
    { type: 'insight', label: CONTENT_TYPE_CONFIG.insight.pluralLabel, count: counts.insight },
    { type: 'framework', label: CONTENT_TYPE_CONFIG.framework.pluralLabel, count: counts.framework },
    { type: 'story', label: CONTENT_TYPE_CONFIG.story.pluralLabel, count: counts.story },
    { type: 'quote', label: CONTENT_TYPE_CONFIG.quote.pluralLabel, count: counts.quote },
    { type: 'practical_use', label: CONTENT_TYPE_CONFIG.practical_use.pluralLabel, count: counts.practical_use },
  ];

  // Filter out categories with 0 items
  const nonEmptyCategories = categories.filter(cat => cat.count > 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 
          className="text-2xl font-bold mb-2"
          style={{ color: hasContext ? "hsl(var(--scheme-title-text))" : undefined }}
        >
          Content Dashboard
        </h1>
        <p style={{ color: hasContext ? "hsl(var(--scheme-cards-text))" : "hsl(var(--muted-foreground))" }}>
          Explore all available Insights, Frameworks, Stories, and more from {bookTitle}.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {nonEmptyCategories.map((cat) => {
          const Icon = TYPE_ICONS[cat.type];
          const config = CONTENT_TYPE_CONFIG[cat.type];

          return (
            <Card
              key={cat.type}
              className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-1"
              style={{ 
                backgroundColor: hasContext ? "hsl(var(--scheme-cards-bg))" : undefined,
                borderColor: hasContext ? "hsl(var(--scheme-cards-border))" : "hsl(var(--muted) / 0.6)"
              }}
              onClick={() => onSelectType(cat.type)}
            >
              <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                <div className={`p-4 rounded-full ${config.bgColor}`}>
                  <Icon className={`h-8 w-8 ${config.color}`} />
                </div>
                <div>
                  <h3 
                    className="font-bold text-lg"
                    style={{ color: hasContext ? "hsl(var(--scheme-title-text))" : undefined }}
                  >
                    {cat.label}
                  </h3>
                  <p 
                    className="font-medium"
                    style={{ color: hasContext ? "hsl(var(--scheme-cards-text))" : "hsl(var(--muted-foreground))" }}
                  >
                    {cat.count} {cat.count === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {nonEmptyCategories.length === 0 && (
        <div 
          className="text-center py-12"
          style={{ color: hasContext ? "hsl(var(--scheme-cards-text))" : "hsl(var(--muted-foreground))" }}
        >
          <p>No content available for this book yet.</p>
        </div>
      )}
    </div>
  );
}
