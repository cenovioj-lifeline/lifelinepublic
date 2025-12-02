import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { FeedEntry } from '@/hooks/useFeedData';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MobileFeedGraphProps {
  entries: FeedEntry[];
  selectedId: string | null;
  onEntryClick: (entry: FeedEntry, index: number) => void;
  onLoadMore: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  currentYear: number;
  onYearChange: (year: number) => void;
}

export interface MobileFeedGraphRef {
  scrollToTop: () => void;
}

export const MobileFeedGraph = forwardRef<MobileFeedGraphRef, MobileFeedGraphProps>(({
  entries,
  selectedId,
  onEntryClick,
  onLoadMore,
  hasNextPage,
  isFetchingNextPage,
  currentYear,
  onYearChange,
}, ref) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const barHeight = 48; // Locked at 48px

  // Expose scrollToTop method to parent
  useImperativeHandle(ref, () => ({
    scrollToTop: () => {
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }));

  // Get colors from CSS variables
  const positiveColor = getComputedStyle(document.documentElement).getPropertyValue('--scheme-ll-graph-positive') 
    ? `hsl(${getComputedStyle(document.documentElement).getPropertyValue('--scheme-ll-graph-positive')})` 
    : "#16a34a";
  const negativeColor = getComputedStyle(document.documentElement).getPropertyValue('--scheme-ll-graph-negative')
    ? `hsl(${getComputedStyle(document.documentElement).getPropertyValue('--scheme-ll-graph-negative')})`
    : "#dc2626";
  const newCollectionColor = "#2563eb";

  // Update current year based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current) return;
      
      const container = scrollRef.current;
      const containerRect = container.getBoundingClientRect();
      
      // Check year headers first (they take precedence)
      const yearHeaders = container.querySelectorAll('[data-year-header]');
      let detectedYear: number | null = null;
      
      for (const header of Array.from(yearHeaders).reverse()) {
        const rect = header.getBoundingClientRect();
        if (rect.top <= containerRect.top + 80) {
          detectedYear = parseInt(header.getAttribute('data-year-header') || '');
          break;
        }
      }
      
      // If no year header found above viewport, check entries
      if (!detectedYear) {
        const entryElements = container.querySelectorAll('[data-entry-year]');
        for (const entry of Array.from(entryElements)) {
          const rect = entry.getBoundingClientRect();
          if (rect.top >= containerRect.top && rect.top < containerRect.top + 150) {
            detectedYear = parseInt(entry.getAttribute('data-entry-year') || '');
            break;
          }
        }
      }
      
      if (detectedYear && detectedYear !== currentYear) {
        onYearChange(detectedYear);
      }
      
      // Infinite scroll detection
      if (hasNextPage && !isFetchingNextPage) {
        const { scrollTop, scrollHeight, clientHeight } = container;
        if (scrollHeight - scrollTop - clientHeight < 500) {
          onLoadMore();
        }
      }
    };

    const container = scrollRef.current;
    container?.addEventListener('scroll', handleScroll, { passive: true });
    return () => container?.removeEventListener('scroll', handleScroll);
  }, [hasNextPage, isFetchingNextPage, onLoadMore, onYearChange, entries, currentYear]);

  // Process entries with year breaks
  const entriesWithYears = entries.map((entry, index) => {
    const year = entry.date.getFullYear();
    const prevYear = index > 0 ? entries[index - 1].date.getFullYear() : null;
    const isNewYear = year !== prevYear;
    
    return {
      ...entry,
      showYear: isNewYear,
      year
    };
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden bg-[hsl(var(--scheme-ll-graph-bg))]"
        style={{
          scrollbarWidth: 'thin',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div className="relative min-h-full px-2 py-2">
        {/* Continuous centerline */}
        <div 
          className="absolute w-[2px] bg-[#565D6D]" 
          style={{ 
            left: '50%',
            top: 0,
            bottom: 0,
            zIndex: 0
          }}
        />
        
        {entriesWithYears.map((entry, index) => {
          const isSelected = entry.id === selectedId;
          const isNewCollection = entry.type === 'new_collection';
          const positive = isNewCollection || (entry.score >= 0);
          const score = entry.score || 0;
          const absScore = Math.abs(score);
          const stemWidthPercent = Math.min(absScore * 10, 100);
          const barColor = isNewCollection ? newCollectionColor : (positive ? positiveColor : negativeColor);
          
          return (
            <div key={entry.id} data-entry-year={entry.year}>
              {/* Year break header - when year changes AND not the first entry */}
              {entry.showYear && index > 0 && (
                <div 
                  data-year-header={entry.year}
                  className="bg-gray-700 text-white font-bold py-2 px-4 text-center rounded-lg mb-2 mt-3 mx-2"
                >
                  {entry.year}
                </div>
              )}
              {/* Entry row */}
              <div
                className={cn(
                  "grid grid-cols-2 gap-0 cursor-pointer transition-colors duration-150 py-1.5 px-0 rounded-lg mb-0.5 relative",
                  isSelected && "bg-gray-100"
                )}
                onClick={() => onEntryClick(entry, index)}
              >
                {positive ? (
                  <>
                    {/* Score box + bar on left (or hero image for new collections) */}
                    <div className="flex items-center justify-end pr-0">
                      {isNewCollection && entry.collectionHeroImage ? (
                        // Hero image with vertical NEW ribbon
                        <div className="flex items-center justify-end" style={{ width: `${stemWidthPercent}%` }}>
                          <div 
                            className="flex-shrink-0 bg-[#4a5d23] flex items-center justify-center rounded-l-lg"
                            style={{ height: `${barHeight}px`, width: '24px' }}
                          >
                            <span 
                              className="text-white font-bold text-[10px] tracking-wider"
                              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                            >
                              NEW
                            </span>
                          </div>
                          <div className="flex-1 overflow-hidden" style={{ height: `${barHeight}px` }}>
                            <img 
                              src={entry.collectionHeroImage} 
                              alt={entry.collectionTitle || 'New Collection'}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      ) : (
                        // Score bar (default or fallback for collections without images)
                        <div className="flex items-center justify-end relative" style={{ width: `${stemWidthPercent}%` }}>
                          <div
                            className="flex-shrink-0 w-[40px] rounded-l-lg flex items-center justify-center font-bold text-lg border-2 bg-white z-10"
                            style={{ borderColor: barColor, color: barColor, height: `${barHeight}px` }}
                          >
                            {isNewCollection ? 'NC' : score}
                          </div>
                          <div 
                            className="flex-1 flex items-center justify-center" 
                            style={{ background: barColor, height: `${barHeight}px` }}
                          >
                            {isNewCollection && (
                              <span className="text-white font-bold text-xs whitespace-nowrap">
                                New Collection
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Chat bubble on right */}
                    <div className="flex items-center pl-2 relative">
                      <div
                        className={cn(
                          "relative bg-white rounded-2xl px-2 py-2 max-w-full transition-all duration-300",
                          isSelected && "border-2 shadow-lg"
                        )}
                        style={isSelected ? { borderColor: barColor } : {}}
                      >
                        <div className="absolute left-[-8px] top-[20px] w-0 h-0 border-t-[10px] border-b-0 border-r-[10px] border-transparent" style={{ borderRightColor: 'white' }} />
                        <div className="font-bold text-xs mb-0.5 text-[hsl(var(--scheme-ll-entry-title))]">
                          {isNewCollection ? entry.collectionTitle : (entry.collectionTitle || entry.lifelineTitle || 'News')}
                        </div>
                        <div className="text-[10px] text-[hsl(var(--scheme-cards-text))] line-clamp-2">
                          {isNewCollection ? entry.collectionDescription || 'New collection added!' : entry.entryTitle}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Chat bubble on left */}
                    <div className="flex items-center justify-end pr-2 relative">
                      <div
                        className={cn(
                          "relative bg-white rounded-2xl px-2 py-2 max-w-full transition-all duration-300",
                          isSelected && "border-2 shadow-lg"
                        )}
                        style={isSelected ? { borderColor: barColor } : {}}
                      >
                        <div className="absolute right-[-8px] top-[20px] w-0 h-0 border-t-[10px] border-b-0 border-l-[10px] border-transparent" style={{ borderLeftColor: 'white' }} />
                        <div className="font-bold text-xs mb-0.5 text-[hsl(var(--scheme-ll-entry-title))]">
                          {entry.collectionTitle || entry.lifelineTitle || 'News'}
                        </div>
                        <div className="text-[10px] text-[hsl(var(--scheme-cards-text))] line-clamp-2">
                          {entry.entryTitle}
                        </div>
                      </div>
                    </div>
                    
                    {/* Score box + bar on right */}
                    <div className="flex items-center pl-0">
                      <div className="flex items-center relative" style={{ width: `${stemWidthPercent}%` }}>
                        <div 
                          className="flex-1" 
                          style={{ background: barColor, height: `${barHeight}px` }}
                        />
                        <div
                          className="flex-shrink-0 w-[40px] rounded-r-lg flex items-center justify-center font-bold text-lg border-2 bg-white z-10"
                          style={{ borderColor: barColor, color: barColor, height: `${barHeight}px` }}
                        >
                          {score}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
        
        {/* Loading indicator */}
        {isFetchingNextPage && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        
        {/* Manual Load More button */}
        {hasNextPage && !isFetchingNextPage && (
          <div className="flex items-center justify-center py-4">
            <Button 
              variant="outline" 
              onClick={onLoadMore}
              className="w-full max-w-xs"
            >
              Load More
            </Button>
          </div>
        )}
      </div>
      </div>
    </div>
  );
});

MobileFeedGraph.displayName = 'MobileFeedGraph';
