import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useSwipeable } from "react-swipeable";
import { cn } from "@/lib/utils";
import { NavigationItem } from "@/utils/electionDataAdapter";
import { CroppedImage } from "@/components/ui/CroppedImage";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface DetailSheetProps {
  item: NavigationItem | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  canNavigatePrev: boolean;
  canNavigateNext: boolean;
  collectionSlug?: string;
}

export const DetailSheet = ({ 
  item, 
  isOpen, 
  onClose, 
  onNavigate,
  canNavigatePrev,
  canNavigateNext,
  collectionSlug,
}: DetailSheetProps) => {
  const handlers = useSwipeable({
    onSwipedDown: () => onClose(),
    onSwipedLeft: () => canNavigateNext && onNavigate('next'),
    onSwipedRight: () => canNavigatePrev && onNavigate('prev'),
    trackMouse: false,
    delta: 50,
  });

  if (!item) return null;

  // Category header view
  if (item.type === 'category-header') {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent 
          side="bottom" 
          className={cn(
            "h-[85vh] rounded-t-3xl p-0",
            "animate-slide-up"
          )}
          {...handlers}
        >
          <div className="h-full flex flex-col">
            {/* Drag handle */}
            <div className="flex justify-center py-3">
              <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-background/80 backdrop-blur-xs hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Category intro content */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 pb-6 gap-6">
              <div className="text-8xl mb-4 animate-bounce">
                {item.category.icon}
              </div>
              
              <SheetHeader className="text-center">
                <SheetTitle className="text-3xl font-bold">
                  {item.category.name}
                </SheetTitle>
              </SheetHeader>

              <div className="text-xl text-muted-foreground">
                {item.category.superlatives.length} {item.category.superlatives.length === 1 ? 'Award' : 'Awards'}
              </div>

              <div className="w-16 h-1 bg-primary/20 rounded-full" />
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-3 p-6 border-t border-border bg-background">
              <Button
                variant="outline"
                size="lg"
                onClick={() => onNavigate('prev')}
                disabled={!canNavigatePrev}
                className="flex-1"
              >
                <ChevronLeft className="h-5 w-5 mr-2" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => onNavigate('next')}
                disabled={!canNavigateNext}
                className="flex-1"
              >
                Next
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Superlative detail view
  const superlative = item.superlative;
  const profileLink = collectionSlug 
    ? `/public/collections/${collectionSlug}/profiles/${superlative.winner.slug}`
    : `/public/profiles/${superlative.winner.slug}`;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side="bottom" 
        className={cn(
          "h-[85vh] rounded-t-3xl p-0",
          "animate-slide-up"
        )}
        {...handlers}
      >
        <div className="h-full flex flex-col">
          {/* Drag handle */}
          <div className="flex justify-center py-3">
            <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-background/80 backdrop-blur-xs hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <div className="flex flex-col items-center gap-4 pt-4">
              <CroppedImage
                src={superlative.winner.photo_url || undefined}
                alt={superlative.winner.name}
                centerX={superlative.winner.position_x ?? 50}
                centerY={superlative.winner.position_y ?? 50}
                scale={superlative.winner.scale ?? 1}
                className="h-[200px] w-[200px] rounded-full"
                fallback={
                  <div className="w-full h-full rounded-full flex items-center justify-center"
                       style={{ backgroundColor: superlative.winner.color }}>
                    <span className="text-6xl font-bold text-white">
                      {superlative.winner.initials}
                    </span>
                  </div>
                }
              />

              <SheetHeader className="text-center">
                <SheetTitle className="text-2xl font-bold">
                  {superlative.title}
                </SheetTitle>
              </SheetHeader>

              <Link 
                to={profileLink}
                className="text-lg text-primary hover:underline font-medium"
                onClick={onClose}
              >
                {superlative.winner.name}
              </Link>

              {superlative.description && (
                <p className="text-base text-center text-muted-foreground leading-relaxed max-w-md">
                  {superlative.description}
                </p>
              )}

              {(superlative.votes > 0 || superlative.percentage > 0) && (
                <div className="flex gap-4 text-sm text-muted-foreground">
                  {superlative.votes > 0 && (
                    <span>{superlative.votes} votes</span>
                  )}
                  {superlative.percentage > 0 && (
                    <span>{superlative.percentage.toFixed(1)}%</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-3 p-6 border-t border-border bg-background">
            <Button
              variant="outline"
              size="lg"
              onClick={() => onNavigate('prev')}
              disabled={!canNavigatePrev}
              className="flex-1"
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => onNavigate('next')}
              disabled={!canNavigateNext}
              className="flex-1"
            >
              Next
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
