/**
 * BookDetailModal
 * 
 * Full-screen modal for viewing a single item.
 * Supports swipe left/right and arrow key navigation.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import type { BookContent, ContentType } from '@/types/book';
import { CATEGORY_INFO } from './BookMobileDashboard';

interface BookDetailModalProps {
  item: BookContent;
  category: ContentType;
  authorName: string;
  authorImageUrl?: string;
  positionLabel: string;
  canGoNext: boolean;
  canGoPrev: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasContext?: boolean;
}

const SWIPE_THRESHOLD = 50;

// Section header patterns to make bold + underlined
const SECTION_HEADERS = [
  'Context:',
  'The Challenge:',
  'The Action:',
  'The Outcome:',
  'The Moral:',
  'The Setup:',
  'The Lesson:',
  'The Result:',
  'The Problem:',
  'The Solution:',
  'Background:',
  'Key Point:',
  'Takeaway:',
];

// Format content with bold+underlined section headers
function formatContentWithHeaders(content: string): React.ReactNode {
  // Create a regex pattern from all headers
  const headerPattern = new RegExp(
    `(${SECTION_HEADERS.map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
    'g'
  );
  
  const parts = content.split(headerPattern);
  
  return parts.map((part, index) => {
    if (SECTION_HEADERS.includes(part)) {
      return (
        <span key={index} className="font-bold underline">
          {part}
        </span>
      );
    }
    return part;
  });
}

export function BookDetailModal({
  item,
  category,
  authorName,
  authorImageUrl,
  positionLabel,
  canGoNext,
  canGoPrev,
  onClose,
  onNext,
  onPrev,
  hasContext = false,
}: BookDetailModalProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const { label: categoryLabel } = CATEGORY_INFO[category];

  // Reset scroll position when item changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [item.id]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && canGoNext) {
        onNext();
      } else if (e.key === 'ArrowLeft' && canGoPrev) {
        onPrev();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canGoNext, canGoPrev, onNext, onPrev, onClose]);

  // Swipe handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isSwipeLeft = distance > SWIPE_THRESHOLD;
    const isSwipeRight = distance < -SWIPE_THRESHOLD;

    if (isSwipeLeft && canGoNext) {
      onNext();
    } else if (isSwipeRight && canGoPrev) {
      onPrev();
    }
  }, [touchStart, touchEnd, canGoNext, canGoPrev, onNext, onPrev]);

  // Author initials fallback
  const authorInitials = authorName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  // Determine if content should have section header formatting
  const shouldFormatHeaders = category === 'story' || category === 'insight';

  return (
    <div 
      className="fixed inset-0 z-50 bg-white flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <header className="flex items-center gap-3 p-4 border-b border-gray-200">
        <button
          onClick={onClose}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>
        
        {/* Author avatar */}
        {authorImageUrl ? (
          <img
            src={authorImageUrl}
            alt={authorName}
            className="w-9 h-9 rounded-full object-cover"
          />
        ) : (
          <div 
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white"
            style={{ backgroundColor: hasContext ? 'hsl(var(--scheme-nav-button))' : '#1e3a5f' }}
          >
            {authorInitials}
          </div>
        )}
        
        {/* Category badge */}
        <span 
          className="text-xs font-medium px-2 py-1 rounded-full"
          style={{ 
            backgroundColor: hasContext 
              ? 'hsl(var(--scheme-nav-button) / 0.1)' 
              : 'rgba(30, 58, 95, 0.1)',
            color: hasContext ? 'hsl(var(--scheme-nav-button))' : '#1e3a5f'
          }}
        >
          {categoryLabel}
        </span>
        
        {/* Position */}
        <span className="ml-auto text-sm text-gray-500">{positionLabel}</span>
      </header>

      {/* Content */}
      <div ref={contentRef} className="flex-1 overflow-y-auto p-6">
        {item.contentType === 'quote' ? (
          <div className="flex flex-col items-center justify-center min-h-full text-center py-8">
            <Quote 
              className="h-10 w-10 mb-6" 
              style={{ color: hasContext ? 'hsl(var(--scheme-nav-button))' : '#1e3a5f' }}
            />
            <p className="text-2xl font-serif italic leading-relaxed text-gray-900">
              "{item.content}"
            </p>
          </div>
        ) : (
          <>
            {item.title && (
              <h1 className="text-2xl font-bold text-gray-900 mb-3">{item.title}</h1>
            )}
            {item.chapterReference && (
              <p className="text-sm text-gray-500 mb-4">{item.chapterReference}</p>
            )}
            <p className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
              {shouldFormatHeaders ? formatContentWithHeaders(item.content) : item.content}
            </p>
            
            {/* Extended data for frameworks */}
            {item.contentType === 'framework' && item.extendedData?.items && (
              <div className="mt-6 space-y-3">
                {(item.extendedData.items as Array<{id?: number; title: string; desc: string}>).map((sub, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-semibold text-gray-900">{sub.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{sub.desc}</p>
                  </div>
                ))}
              </div>
            )}
            
            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6">
                {item.tags.map((tag, i) => (
                  <span 
                    key={i}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer with navigation */}
      <footer className="border-t border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onPrev}
            disabled={!canGoPrev}
            className="p-3 rounded-full disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: canGoPrev 
                ? (hasContext ? 'hsl(var(--scheme-nav-button))' : '#1e3a5f')
                : '#e5e7eb',
              color: canGoPrev ? 'white' : '#9ca3af'
            }}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <span className="text-xs text-gray-400">Swipe or use arrows</span>
          
          <button
            onClick={onNext}
            disabled={!canGoNext}
            className="p-3 rounded-full disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: canGoNext 
                ? (hasContext ? 'hsl(var(--scheme-nav-button))' : '#1e3a5f')
                : '#e5e7eb',
              color: canGoNext ? 'white' : '#9ca3af'
            }}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </footer>
    </div>
  );
}
