import { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react';
import { MobileEntry } from '@/utils/entryDataAdapter';
import { cn } from '@/lib/utils';

interface MobileLifelineGraphProps {
  entries: MobileEntry[];
  selectedId: string | null;
  onEntryClick: (entry: MobileEntry, index: number) => void;
}

export interface MobileLifelineGraphRef {
  scrollToTop: () => void;
}

export const MobileLifelineGraph = forwardRef<MobileLifelineGraphRef, MobileLifelineGraphProps>(({
  entries,
  selectedId,
  onEntryClick,
}, ref) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const barHeight = 48;

  useImperativeHandle(ref, () => ({
    scrollToTop: () => {
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }));

  // FIX: Use state for colors so they update reactively when CSS variables change
  const [positiveColor, setPositiveColor] = useState("#16a34a");
  const [negativeColor, setNegativeColor] = useState("#dc2626");

  // FIX: Read CSS variables reactively after they're applied by useColorScheme
  useEffect(() => {
    const readColorsFromCSS = () => {
      const root = document.documentElement;
      const positiveHSL = getComputedStyle(root).getPropertyValue('--scheme-ll-graph-positive').trim();
      const negativeHSL = getComputedStyle(root).getPropertyValue('--scheme-ll-graph-negative').trim();
      
      if (positiveHSL) {
        setPositiveColor(`hsl(${positiveHSL})`);
      }
      if (negativeHSL) {
        setNegativeColor(`hsl(${negativeHSL})`);
      }
    };

    // Read immediately in case CSS vars are already set
    readColorsFromCSS();

    // Also read after a short delay to catch async color scheme loading
    const timer = setTimeout(readColorsFromCSS, 150);

    // Set up a MutationObserver to detect CSS variable changes on :root
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          readColorsFromCSS();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style']
    });
    
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []); // Run once on mount, observer handles updates

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
          
          {entries.map((entry, index) => {
            const isSelected = entry.id === selectedId;
            const score = entry.rating || 0;
            const positive = score >= 0;
            const absScore = Math.abs(score);
            const stemWidthPercent = Math.min(absScore * 10, 100);
            const barColor = positive ? positiveColor : negativeColor;
            
            return (
              <div key={entry.id}>
                {/* Entry row */}
              <div
                className={cn(
                  "grid grid-cols-2 gap-0 cursor-pointer transition-colors duration-150 py-1.5 px-0 rounded-lg mb-0.5 relative",
                  "hover:bg-gray-100/50",
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
                            className="shrink-0 w-[40px] rounded-l-lg flex items-center justify-center font-bold text-lg border-2 bg-white z-10"
                            style={{ borderColor: barColor, color: barColor, height: `${barHeight}px` }}
                          >
                            {score}
                          </div>
                          <div 
                            className="flex-1" 
                            style={{ background: barColor, height: `${barHeight}px` }}
                          />
                        </div>
                      </div>
                      
                      {/* Chat bubble on right - only title */}
                      <div className="flex items-center pl-2 relative">
                        <div
                          className={cn(
                            "relative bg-white rounded-2xl px-2 py-2 max-w-full transition-all duration-300",
                            isSelected && "border-2 shadow-lg"
                          )}
                          style={isSelected ? { borderColor: barColor } : {}}
                        >
                          <div className="absolute left-[-8px] top-[20px] w-0 h-0 border-t-10 border-b-0 border-r-10 border-transparent" style={{ borderRightColor: 'white' }} />
                          <div className="font-bold text-xs text-[hsl(var(--scheme-ll-entry-title))] line-clamp-2">
                            {entry.title}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Chat bubble on left - only title */}
                      <div className="flex items-center justify-end pr-2 relative">
                        <div
                          className={cn(
                            "relative bg-white rounded-2xl px-2 py-2 max-w-full transition-all duration-300",
                            isSelected && "border-2 shadow-lg"
                          )}
                          style={isSelected ? { borderColor: barColor } : {}}
                        >
                          <div className="absolute right-[-8px] top-[20px] w-0 h-0 border-t-10 border-b-0 border-l-10 border-transparent" style={{ borderLeftColor: 'white' }} />
                          <div className="font-bold text-xs text-[hsl(var(--scheme-ll-entry-title))] line-clamp-2">
                            {entry.title}
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
                            className="shrink-0 w-[40px] rounded-r-lg flex items-center justify-center font-bold text-lg border-2 bg-white z-10"
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
        </div>
      </div>
    </div>
  );
});

MobileLifelineGraph.displayName = 'MobileLifelineGraph';
