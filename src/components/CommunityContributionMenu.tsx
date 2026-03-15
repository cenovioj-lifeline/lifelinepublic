import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Image, FileText, Pencil, ArrowUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ContributeEventDialog } from "@/components/ContributeEventDialog";
import { useAuth } from "@/lib/auth";
import { PublicAuthModal } from "@/components/PublicAuthModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CommunityContributionMenuProps {
  lifelineId: string;
  lifelineTitle: string;
  currentEntryId?: string;
  className?: string;
}

export function CommunityContributionMenu({
  lifelineId,
  lifelineTitle,
  currentEntryId,
  className,
}: CommunityContributionMenuProps) {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [contributePictureMode, setContributePictureMode] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [constructionOpen, setConstructionOpen] = useState(false);

  const handleButtonClick = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setIsExpanded(true);
  };

  const handleClose = () => {
    setIsExpanded(false);
  };

  const handlePictureClick = () => {
    setIsExpanded(false);
    setContributePictureMode(true);
    setShowEventDialog(true);
  };

  const handleEventClick = () => {
    setIsExpanded(false);
    setContributePictureMode(false);
    setShowEventDialog(true);
  };

  const handleUnderConstruction = () => {
    setConstructionOpen(true);
  };

  if (isExpanded) {
    return (
      <>
        <div 
          className={cn(
            "relative rounded-lg p-4 shadow-lg transition-all duration-300",
            "bg-[hsl(var(--scheme-ch-actions-bg))] border-2 border-[hsl(var(--scheme-ch-actions-border))]",
            className
          )}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/5 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" style={{ color: 'hsl(var(--scheme-ch-actions-icon))' }} />
          </button>

          {/* Title */}
          <div className="mb-4 pr-6">
            <h3 
              className="text-lg font-semibold"
              style={{ color: 'hsl(var(--scheme-ch-actions-text))' }}
            >
              Community Contribution Menu
            </h3>
          </div>

          {/* Menu Options Grid */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handlePictureClick}
              variant="outline"
              className="h-auto flex-col gap-2 p-4 border-[hsl(var(--scheme-ch-actions-border))] hover:bg-[hsl(var(--scheme-ch-actions-bg))]/80"
            >
              <Image className="h-6 w-6" style={{ color: 'hsl(var(--scheme-ch-actions-icon))' }} />
              <span className="text-sm font-semibold" style={{ color: 'hsl(var(--scheme-ch-actions-text))' }}>
                Pictures
              </span>
            </Button>

            <Button
              onClick={handleEventClick}
              variant="outline"
              className="h-auto flex-col gap-2 p-4 border-[hsl(var(--scheme-ch-actions-border))] hover:bg-[hsl(var(--scheme-ch-actions-bg))]/80"
            >
              <FileText className="h-6 w-6" style={{ color: 'hsl(var(--scheme-ch-actions-icon))' }} />
              <span className="text-sm font-semibold" style={{ color: 'hsl(var(--scheme-ch-actions-text))' }}>
                Events
              </span>
            </Button>

            <Button
              onClick={handleUnderConstruction}
              variant="outline"
              className="h-auto flex-col gap-2 p-4 border-[hsl(var(--scheme-ch-actions-border))] hover:bg-[hsl(var(--scheme-ch-actions-bg))]/80"
            >
              <Pencil className="h-6 w-6" style={{ color: 'hsl(var(--scheme-ch-actions-icon))' }} />
              <span className="text-sm font-semibold" style={{ color: 'hsl(var(--scheme-ch-actions-text))' }}>
                Corrections/Edits
              </span>
            </Button>

            <Button
              onClick={handleUnderConstruction}
              variant="outline"
              className="h-auto flex-col gap-2 p-4 border-[hsl(var(--scheme-ch-actions-border))] hover:bg-[hsl(var(--scheme-ch-actions-bg))]/80"
            >
              <ArrowUpDown className="h-6 w-6" style={{ color: 'hsl(var(--scheme-ch-actions-icon))' }} />
              <span className="text-sm font-semibold" style={{ color: 'hsl(var(--scheme-ch-actions-text))' }}>
                Score/Order
              </span>
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Button
        onClick={handleButtonClick}
        className={cn(
          "shadow-md transition-all duration-200",
          "bg-[hsl(var(--scheme-ll-entry-contributor))] hover:bg-[hsl(var(--scheme-ll-entry-contributor))]/90",
          "text-white",
          className
        )}
      >
        Community Contribution Menu
      </Button>

      <ContributeEventDialog
        open={showEventDialog}
        onOpenChange={setShowEventDialog}
        lifelineId={lifelineId}
        lifelineTitle={lifelineTitle}
        initialEntryId={currentEntryId}
        contributePictureMode={contributePictureMode}
        onSignInRequired={() => {
          setShowEventDialog(false);
          setShowAuthModal(true);
        }}
      />

      <AlertDialog open={constructionOpen} onOpenChange={setConstructionOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Site Under Construction</AlertDialogTitle>
            <AlertDialogDescription>
              This feature is still under construction and will be available soon.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PublicAuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </>
  );
}