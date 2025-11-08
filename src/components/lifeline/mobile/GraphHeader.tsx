import { MobileEntry } from '@/utils/entryDataAdapter';
import { GraphBar } from './GraphBar';

interface GraphHeaderProps {
  entries: MobileEntry[];
  currentIndex: number;
  onEntryClick: (index: number) => void;
}

export const GraphHeader = ({ entries, currentIndex, onEntryClick }: GraphHeaderProps) => {
  return (
    <div className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="h-[60px] px-4 flex items-end justify-center gap-1 pb-2">
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
