import { useRef, useEffect } from 'react';
import { FeedEntry } from '@/hooks/useFeedData';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileFeedGraphProps {
  entries: FeedEntry[];
  selectedId: string | null;
  onEntryClick: (entry: FeedEntry, index: number) => void;
  onLoadMore: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
}

export const MobileFeedGraph = ({
  entries,
  selectedId,
  onEntryClick,
  onLoadMore,
  hasNextPage,
  isFetchingNextPage,
}: MobileFeedGraphProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get colors from CSS variables
  const positiveColor = getComputedStyle(document.documentElement).getPropertyValue('--scheme-ll-graph-positive') 
    ? `hsl(${getComputedStyle(document.documentElement).getPropertyValue('--scheme-ll-graph-positive')})` 
    : "#16a34a";
  const negativeColor = getComputedStyle(document.documentElement).getPropertyValue('--scheme-ll-graph-negative')
    ? `hsl(${getComputedStyle(document.documentElement).getPropertyValue('--scheme-ll-graph-negative')})`
    : "#dc2626";
  const newCollectionColor = "#2563eb";

  // Infinite scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current || !hasNextPage || isFetchingNextPage) return;
      
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      if (scrollHeight - scrollTop - clientHeight < 500) {
        onLoadMore();
      }
    };

    const container = scrollRef.current;
    container?.addEventListener('scroll', handleScroll);
    return () => container?.removeEventListener('scroll', handleScroll);
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

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
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto overflow-x-hidden bg-[hsl(var(--scheme-ll-graph-bg))]"
      style={{
        scrollbarWidth: 'thin',
      }}
    >
      <div className="relative min-h-full px-3 py-4">
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
            <div key={entry.id}>
              {/* Year header */}
              {entry.showYear && (
                <div className="bg-gray-700 text-white font-bold py-2 px-4 text-center rounded-lg mb-3 mt-2 z-10 relative">
                  {entry.year}
                </div>
              )}
              
              {/* Entry row */}
              <div
                className={cn(
                  "grid grid-cols-2 gap-0 cursor-pointer transition-colors duration-150 py-3 px-2 rounded-lg mb-2 relative",
                  isSelected && "bg-gray-100"
                )}
                onClick={() => onEntryClick(entry, index)}
              >
                {positive ? (
                  <>
                    {/* Score box + bar on left */}
                    <div className="flex items-center justify-end pr-0">
                      <div className="flex items-center justify-end relative" style={{ width: `${stemWidthPercent}%` }}>
                        <div
                          className="flex-shrink-0 w-[40px] h-[40px] rounded-l-lg flex items-center justify-center font-bold text-lg border-2 bg-white z-10"
                          style={{ borderColor: barColor, color: barColor }}
                        >
                          {isNewCollection ? 'NC' : score}
                        </div>
                        <div 
                          className="flex-1 h-[40px] flex items-center justify-center" 
                          style={{ background: barColor }}
                        >
                          {isNewCollection && (
                            <span className="text-white font-bold text-xs whitespace-nowrap">
                              New Collection
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Chat bubble on right */}
                    <div className="flex items-center pl-3 relative">
                      <div
                        className={cn(
                          "relative bg-white rounded-2xl px-3 py-2 max-w-[95%] transition-all duration-300",
                          isSelected && "border-2 shadow-lg"
                        )}
                        style={isSelected ? { borderColor: barColor } : {}}
                      >
                        <div className="absolute left-[-8px] top-[20px] w-0 h-0 border-t-[10px] border-b-0 border-r-[10px] border-transparent" style={{ borderRightColor: 'white' }} />
                        <div className="font-bold text-xs mb-0.5 text-[hsl(var(--scheme-ll-entry-title))]">
                          {isNewCollection ? `🎉 ${entry.collectionTitle}` : (entry.collectionTitle || entry.lifelineTitle || 'News')}
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
                    <div className="flex items-center justify-end pr-3 relative">
                      <div
                        className={cn(
                          "relative bg-white rounded-2xl px-3 py-2 max-w-[95%] transition-all duration-300",
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
                          className="flex-1 h-[40px]" 
                          style={{ background: barColor }}
                        />
                        <div
                          className="flex-shrink-0 w-[40px] h-[40px] rounded-r-lg flex items-center justify-center font-bold text-lg border-2 bg-white z-10"
                          style={{ borderColor: barColor, color: barColor }}
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
      </div>
    </div>
  );
};
