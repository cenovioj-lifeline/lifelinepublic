import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useSwipeable } from "react-swipeable";
import { cn } from "@/lib/utils";
import { MobileSuperlative } from "@/utils/electionDataAdapter";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface DetailSheetProps {
  superlative: MobileSuperlative | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  canNavigatePrev: boolean;
  canNavigateNext: boolean;
  collectionSlug?: string;
}

export const DetailSheet = ({ 
  superlative, 
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

  if (!superlative) return null;

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
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <div className="flex flex-col items-center gap-4 pt-4">
              <Avatar className="h-[200px] w-[200px]">
                <AvatarImage 
                  src={superlative.winner.photo_url || undefined} 
                  alt={superlative.winner.name}
                  className="object-cover"
                  style={{
                    objectPosition: `${superlative.winner.position_x ?? 50}% ${superlative.winner.position_y ?? 50}%`,
                    transform: `scale(${superlative.winner.scale ?? 1})`,
                    transformOrigin: `${superlative.winner.position_x ?? 50}% ${superlative.winner.position_y ?? 50}%`
                  }}
                />
                <AvatarFallback 
                  className="text-6xl font-bold text-white"
                  style={{ backgroundColor: superlative.winner.color }}
                >
                  {superlative.winner.initials}
                </AvatarFallback>
              </Avatar>

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
