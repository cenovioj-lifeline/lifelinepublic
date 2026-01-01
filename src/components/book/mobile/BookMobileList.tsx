/**
 * BookMobileList
 * 
 * List view for a single category.
 * Shows back link, category header (clickable for info), and scrollable card list.
 */

import { ChevronLeft } from 'lucide-react';
import type { BookContent, ContentType } from '@/types/book';
import { CATEGORY_INFO } from './BookMobileDashboard';

interface BookMobileListProps {
  category: ContentType;
  items: BookContent[];
  onBack: () => void;
  onSelectItem: (index: number) => void;
  onTitleClick?: () => void;
  hasContext?: boolean;
}

export function BookMobileList({
  category,
  items,
  onBack,
  onSelectItem,
  onTitleClick,
  hasContext = false,
}: BookMobileListProps) {
  const { label, Icon } = CATEGORY_INFO[category];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="flex items-center p-4">
          {/* Back button - separate from title group */}
          <button
            onClick={onBack}
            className="p-1 -ml-1 rounded-lg hover:bg-gray-100 mr-4"
          >
            <ChevronLeft className="h-6 w-6 text-gray-600" />
          </button>
          
          {/* Title group - clickable to show info */}
          <button
            onClick={onTitleClick}
            className="flex items-center gap-3 hover:bg-gray-50 rounded-lg px-2 py-1 -mx-2 transition-colors"
          >
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ 
                backgroundColor: hasContext 
                  ? 'hsl(var(--scheme-nav-button) / 0.1)' 
                  : 'rgba(30, 58, 95, 0.1)'
              }}
            >
              <Icon 
                className="h-4 w-4" 
                style={{ 
                  color: hasContext ? 'hsl(var(--scheme-nav-button))' : '#1e3a5f'
                }}
              />
            </div>
            <div className="text-left">
              <h1 className="font-bold text-gray-900">{label}</h1>
              <p className="text-xs text-gray-500">{items.length} items • Tap for info</p>
            </div>
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="p-4 space-y-3">
        {items.map((item, index) => (
          <button
            key={item.id}
            onClick={() => onSelectItem(index)}
            className="w-full bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-left hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
              {item.title || 'Untitled'}
            </h3>
            {item.chapterReference && (
              <p className="text-xs text-gray-500 mb-2">{item.chapterReference}</p>
            )}
            <p className="text-sm text-gray-600 line-clamp-3">{item.content}</p>
          </button>
        ))}

        {items.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No {label.toLowerCase()} content yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
