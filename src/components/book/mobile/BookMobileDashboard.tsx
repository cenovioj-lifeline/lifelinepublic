/**
 * BookMobileDashboard
 * 
 * Dashboard view with 2x2 grid of category tiles + full-width bottom tile.
 * Tap opens category explanation modal.
 */

import { Lightbulb, LayoutGrid, BookOpen, Quote, Wrench } from 'lucide-react';
import type { ContentType } from '@/types/book';

interface BookMobileDashboardProps {
  counts: Record<ContentType, number>;
  onSelectTile: (category: ContentType) => void;
  bookTitle: string;
  hasContext?: boolean;
}

const CATEGORY_INFO: Record<ContentType, {
  label: string;
  Icon: typeof Lightbulb;
  description: string;
}> = {
  insight: {
    label: 'Insights',
    Icon: Lightbulb,
    description: 'Key ideas and principles from the book',
  },
  framework: {
    label: 'Models',
    Icon: LayoutGrid,
    description: 'Mental models and structured thinking tools',
  },
  story: {
    label: 'Stories',
    Icon: BookOpen,
    description: 'Examples, case studies, and narratives',
  },
  quote: {
    label: 'Quotes',
    Icon: Quote,
    description: 'Memorable lines and passages',
  },
  practical_use: {
    label: 'Practical',
    Icon: Wrench,
    description: 'Exercises and real-world applications',
  },
};

export function BookMobileDashboard({
  counts,
  onSelectTile,
  bookTitle,
  hasContext = false,
}: BookMobileDashboardProps) {
  const topCategories: ContentType[] = ['insight', 'framework', 'story', 'quote'];
  const bottomCategory: ContentType = 'practical_use';

  return (
    <div className="p-4 pb-20">
      {/* Book title header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 line-clamp-2">{bookTitle}</h1>
        <p className="text-sm text-gray-500 mt-1">Tap a category to explore</p>
      </div>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {topCategories.map((type) => {
          const { label, Icon } = CATEGORY_INFO[type];
          const count = counts[type] || 0;
          
          return (
            <button
              key={type}
              onClick={() => onSelectTile(type)}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-left hover:shadow-md transition-shadow"
            >
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                style={{ 
                  backgroundColor: hasContext 
                    ? 'hsl(var(--scheme-nav-button) / 0.1)' 
                    : 'rgba(30, 58, 95, 0.1)'
                }}
              >
                <Icon 
                  className="h-5 w-5" 
                  style={{ 
                    color: hasContext ? 'hsl(var(--scheme-nav-button))' : '#1e3a5f'
                  }}
                />
              </div>
              <p className="font-semibold text-gray-900">{label}</p>
              <p className="text-sm text-gray-500">{count} items</p>
            </button>
          );
        })}
      </div>

      {/* Full-width bottom tile */}
      <button
        onClick={() => onSelectTile(bottomCategory)}
        className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-left hover:shadow-md transition-shadow flex items-center gap-4"
      >
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ 
            backgroundColor: hasContext 
              ? 'hsl(var(--scheme-nav-button) / 0.1)' 
              : 'rgba(30, 58, 95, 0.1)'
          }}
        >
          <CATEGORY_INFO.practical_use.Icon 
            className="h-5 w-5" 
            style={{ 
              color: hasContext ? 'hsl(var(--scheme-nav-button))' : '#1e3a5f'
            }}
          />
        </div>
        <div>
          <p className="font-semibold text-gray-900">{CATEGORY_INFO.practical_use.label}</p>
          <p className="text-sm text-gray-500">{counts[bottomCategory] || 0} items</p>
        </div>
      </button>
    </div>
  );
}

export { CATEGORY_INFO };
