/**
 * BookCategoryModal
 * 
 * Modal showing category explanation with icon, description, count.
 * "View [Category]" button navigates to list view.
 */

import { X } from 'lucide-react';
import type { ContentType } from '@/types/book';
import { CATEGORY_INFO } from './BookMobileDashboard';

interface BookCategoryModalProps {
  category: ContentType;
  count: number;
  onClose: () => void;
  onViewCategory: () => void;
  hasContext?: boolean;
}

export function BookCategoryModal({
  category,
  count,
  onClose,
  onViewCategory,
  hasContext = false,
}: BookCategoryModalProps) {
  const { label, Icon, description } = CATEGORY_INFO[category];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-t-2xl w-full max-w-lg p-6 pb-8 animate-in slide-in-from-bottom duration-300">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center pt-4">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ 
              backgroundColor: hasContext 
                ? 'hsl(var(--scheme-nav-button) / 0.1)' 
                : 'rgba(30, 58, 95, 0.1)'
            }}
          >
            <Icon 
              className="h-8 w-8" 
              style={{ 
                color: hasContext ? 'hsl(var(--scheme-nav-button))' : '#1e3a5f'
              }}
            />
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 mb-1">{label}</h2>
          <p className="text-sm text-gray-500 mb-2">{count} items</p>
          <p className="text-gray-600 mb-6">{description}</p>
          
          <button
            onClick={onViewCategory}
            className="w-full py-3 px-6 rounded-xl font-semibold text-white transition-colors"
            style={{ 
              backgroundColor: hasContext ? 'hsl(var(--scheme-nav-button))' : '#1e3a5f'
            }}
          >
            View {label}
          </button>
        </div>
      </div>
    </div>
  );
}
