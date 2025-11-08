import { useEffect, useRef } from 'react';
import { MobileEntry } from '@/utils/entryDataAdapter';
import { GraphBar } from './GraphBar';

interface GraphHeaderProps {
  entries: MobileEntry[];
  currentIndex: number;
  onEntryClick: (index: number) => void;
}

export const GraphHeader = ({ entries, currentIndex, onEntryClick }: GraphHeaderProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Center the active bar when currentIndex changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const barWidth = 48; // Width of each bar
      const gap = 8; // Gap between bars (gap-2)
      const scrollPosition = currentIndex * (barWidth + gap) - (container.clientWidth / 2) + (barWidth / 2);

      container.scrollTo({
        left: Math.max(0, scrollPosition),
        behavior: 'smooth'
      });
    }
  }, [currentIndex]);

  return (
    <div className="sticky top-0 z-50 bg-background border-b border-border">
      <div 
        ref={scrollContainerRef}
        className="h-[64px] px-4 flex items-center gap-2 overflow-x-auto scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {entries.map((entry, index) => (
          <GraphBar
            key={entry.id}
            rating={entry.rating}
            isActive={index === currentIndex}
            isPast={index < currentIndex}
            onClick={() => onEntryClick(index)}
          />
        ))}
      </div>
    </div>
  );
};
