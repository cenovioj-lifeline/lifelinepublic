import { MobileEntry } from '@/utils/entryDataAdapter';
import { Sheet, SheetContent, SheetHeader } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ImageHero } from '@/components/lifeline/mobile/ImageHero';
import { EntryContent } from '@/components/lifeline/mobile/EntryContent';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { ContributionStatusBadge } from '@/components/ContributionStatusBadge';

interface MobileLifelineDetailSheetProps {
  entry: MobileEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  currentIndex: number;
  totalEntries: number;
  contributionStatus?: string | null;
}

export const MobileLifelineDetailSheet = ({
  entry,
  isOpen,
  onClose,
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
  currentIndex,
  totalEntries,
  contributionStatus,
}: MobileLifelineDetailSheetProps) => {
  if (!entry) return null;

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => canGoNext && onNext(),
    onSwipedRight: () => canGoPrevious && onPrevious(),
    onSwipedDown: () => onClose(),
    trackMouse: false,
  });

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] flex flex-col p-0 [&>button]:hidden"
        {...swipeHandlers}
      >
        <SheetHeader className="flex-shrink-0 p-4 border-b border-border flex flex-row items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Button
              variant="ghost"
              size="icon"
              onClick={onPrevious}
              disabled={!canGoPrevious}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs">swipe</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onNext}
              disabled={!canGoNext}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-sm font-semibold text-muted-foreground">
            {currentIndex + 1} / {totalEntries}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Only render ImageHero if there's an image - it now returns null when no image */}
          {entry.image_url && (
            <ImageHero
              imageUrl={entry.image_url}
              title={entry.title}
              rating={entry.rating}
            />
          )}

          <div className="px-4 pt-4">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-xl font-bold text-[hsl(var(--scheme-ll-entry-title))]">
                {entry.title}
              </h2>
              {contributionStatus && contributionStatus !== 'approved' && contributionStatus !== 'auto_approved' && (
                <ContributionStatusBadge status={contributionStatus} />
              )}
            </div>
          </div>

          <EntryContent
            date={entry.date}
            description={entry.description}
            rating={entry.rating}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};
