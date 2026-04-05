import { useCallback } from "react";
import { Link } from "react-router-dom";
import { useSwipeable } from "react-swipeable";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CroppedImage } from "@/components/ui/CroppedImage";
import { ChevronLeft, ChevronRight, X, ExternalLink } from "lucide-react";
import { ProfileAward } from "@/hooks/useProfileAwardNavigation";

interface ProfileAwardDetailSheetProps {
  award: ProfileAward | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  canNavigatePrev: boolean;
  canNavigateNext: boolean;
  currentIndex: number;
  totalCount: number;
  collectionSlug?: string;
  winnerAvatar?: {
    url?: string;
    position_x?: number;
    position_y?: number;
    scale?: number;
  };
  winnerInitials?: string;
}

export function ProfileAwardDetailSheet({
  award,
  isOpen,
  onClose,
  onNavigate,
  canNavigatePrev,
  canNavigateNext,
  currentIndex,
  totalCount,
  collectionSlug,
  winnerAvatar,
  winnerInitials,
}: ProfileAwardDetailSheetProps) {
  const handleSwipe = useCallback((direction: 'Left' | 'Right') => {
    if (direction === 'Left' && canNavigateNext) {
      onNavigate('next');
    } else if (direction === 'Right' && canNavigatePrev) {
      onNavigate('prev');
    }
  }, [canNavigateNext, canNavigatePrev, onNavigate]);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleSwipe('Left'),
    onSwipedRight: () => handleSwipe('Right'),
    onSwipedDown: onClose,
    preventScrollOnSwipe: true,
    trackMouse: false,
  });

  if (!award) return null;

  const electionPath = collectionSlug
    ? `/public/collections/${collectionSlug}/elections/${award.election.slug}`
    : `/public/elections/${award.election.slug}`;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] rounded-t-3xl p-0 bg-[hsl(var(--scheme-cards-bg,var(--card)))] border-[hsl(var(--scheme-cards-border,var(--border)))]"
      >
        <div {...swipeHandlers} className="h-full flex flex-col">
          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
          </div>

          {/* Header with close button */}
          <div className="flex items-center justify-between px-4 pb-2">
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} of {totalCount}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Award Content */}
          <div className="flex-1 overflow-y-auto px-6 pb-24">
            <div className="flex flex-col items-center text-center space-y-4 pt-4">
              {/* Winner Avatar */}
              <CroppedImage
                src={winnerAvatar?.url}
                alt={award.winner_name || "Winner"}
                centerX={winnerAvatar?.position_x ?? 50}
                centerY={winnerAvatar?.position_y ?? 50}
                scale={winnerAvatar?.scale ?? 1}
                className="h-[200px] w-[200px] rounded-full border-4 border-amber-200"
                fallback={
                  <span className="text-6xl font-bold text-white">
                    {winnerInitials || award.winner_name?.slice(0, 2).toUpperCase() || "?"}
                  </span>
                }
                fallbackClassName="rounded-full bg-amber-500"
              />

              {/* Category Title */}
              <h2 
                className="text-2xl font-bold"
                style={{ color: 'hsl(var(--scheme-profile-label-text, var(--foreground)))' }}
              >
                {award.category}
              </h2>

              {/* Election Link */}
              <Link 
                to={electionPath}
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <span>{award.election.title}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>

              {/* Winner Name */}
              {award.winner_name && (
                <div className="pt-2">
                  <p 
                    className="text-sm text-muted-foreground"
                    style={{ color: 'hsl(var(--scheme-profile-label-text, var(--muted-foreground)))', opacity: 0.7 }}
                  >
                    Winner
                  </p>
                  <p 
                    className="text-lg font-semibold"
                    style={{ color: 'hsl(var(--scheme-profile-label-text, var(--foreground)))' }}
                  >
                    {award.winner_name}
                  </p>
                </div>
              )}

              {/* Notes */}
              {award.notes && (
                <blockquote 
                  className="italic text-base px-4 py-3 border-l-4 border-amber-400 bg-amber-50/50 text-left w-full rounded-r-lg"
                  style={{ color: 'hsl(var(--scheme-profile-label-text, var(--foreground)))' }}
                >
                  {award.notes}
                </blockquote>
              )}

              {/* Vote Statistics */}
              {(award.percentage || award.vote_count) && (
                <div className="flex items-center gap-6 pt-4">
                  {award.percentage && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-amber-600">{award.percentage}%</p>
                      <p className="text-xs text-muted-foreground">of votes</p>
                    </div>
                  )}
                  {award.vote_count && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-amber-600">{award.vote_count}</p>
                      <p className="text-xs text-muted-foreground">total votes</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[hsl(var(--scheme-cards-bg,var(--card)))] via-[hsl(var(--scheme-cards-bg,var(--card)))] to-transparent pt-12">
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="outline"
                onClick={() => onNavigate('prev')}
                disabled={!canNavigatePrev}
                className="flex-1"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => onNavigate('next')}
                disabled={!canNavigateNext}
                className="flex-1"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
