import { Link } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CroppedImage } from "@/components/ui/CroppedImage";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { ProfileAward } from "@/hooks/useProfileAwardNavigation";

interface ProfileAwardDialogProps {
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

export function ProfileAwardDialog({
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
}: ProfileAwardDialogProps) {
  if (!award) return null;

  const electionPath = collectionSlug
    ? `/public/collections/${collectionSlug}/elections/${award.election.slug}`
    : `/public/elections/${award.election.slug}`;

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && canNavigatePrev) {
      onNavigate('prev');
    } else if (e.key === 'ArrowRight' && canNavigateNext) {
      onNavigate('next');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="max-w-md p-0 overflow-hidden bg-[hsl(var(--scheme-cards-bg,var(--card)))] border-[hsl(var(--scheme-cards-border,var(--border)))]" 
        onKeyDown={handleKeyDown}
      >
        {/* Header with counter */}
        <div className="flex items-center justify-between px-4 pt-4">
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} of {totalCount}
          </span>
        </div>

        {/* Award Content */}
        <div className="px-6 pb-6">
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Winner Avatar */}
            <CroppedImage
              src={winnerAvatar?.url}
              alt={award.winner_name || "Winner"}
              centerX={winnerAvatar?.position_x ?? 50}
              centerY={winnerAvatar?.position_y ?? 50}
              scale={winnerAvatar?.scale ?? 1}
              className="h-[160px] w-[160px] rounded-full border-4 border-amber-200"
              fallback={
                <span className="text-5xl font-bold text-white">
                  {winnerInitials || award.winner_name?.slice(0, 2).toUpperCase() || "?"}
                </span>
              }
              fallbackClassName="rounded-full bg-amber-500"
            />

            {/* Category Title */}
            <h2 
              className="text-xl font-bold"
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
              <div className="flex items-center gap-6 pt-2">
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
        <div className="flex items-center justify-between gap-4 p-4 border-t border-[hsl(var(--scheme-cards-border,var(--border)))]">
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
      </DialogContent>
    </Dialog>
  );
}
