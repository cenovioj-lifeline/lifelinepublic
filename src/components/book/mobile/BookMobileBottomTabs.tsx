/**
 * BookMobileBottomTabs
 * 
 * Fixed bottom navigation with 5 category tabs.
 * Shows count badges and highlights active category.
 */

import { Lightbulb, LayoutGrid, BookOpen, Quote, Wrench } from 'lucide-react';
import type { ContentType } from '@/types/book';

interface BookMobileBottomTabsProps {
  activeCategory: ContentType | null;
  counts: Record<ContentType, number>;
  onSelectCategory: (category: ContentType) => void;
  hasContext?: boolean;
}

const TABS: { type: ContentType; label: string; Icon: typeof Lightbulb }[] = [
  { type: 'insight', label: 'Insights', Icon: Lightbulb },
  { type: 'framework', label: 'Models', Icon: LayoutGrid },
  { type: 'story', label: 'Stories', Icon: BookOpen },
  { type: 'quote', label: 'Quotes', Icon: Quote },
  { type: 'practical_use', label: 'Practical', Icon: Wrench },
];

export function BookMobileBottomTabs({
  activeCategory,
  counts,
  onSelectCategory,
  hasContext = false,
}: BookMobileBottomTabsProps) {
  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex justify-around items-center h-16">
        {TABS.map(({ type, label, Icon }) => {
          const isActive = activeCategory === type;
          const count = counts[type] || 0;
          
          return (
            <button
              key={type}
              onClick={() => onSelectCategory(type)}
              className="flex flex-col items-center justify-center flex-1 h-full relative"
              style={isActive ? {
                color: hasContext ? 'hsl(var(--scheme-nav-button))' : '#1e3a5f'
              } : {
                color: '#6b7280'
              }}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {count > 0 && (
                  <span 
                    className="absolute -top-1.5 -right-2 text-[10px] font-bold text-white rounded-full min-w-[16px] h-4 flex items-center justify-center px-1"
                    style={{ 
                      backgroundColor: hasContext ? 'hsl(var(--scheme-nav-button))' : '#1e3a5f'
                    }}
                  >
                    {count}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 font-medium">{label}</span>
              {isActive && (
                <div 
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ 
                    backgroundColor: hasContext ? 'hsl(var(--scheme-nav-button))' : '#1e3a5f'
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
