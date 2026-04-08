import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, FileText, Image } from "lucide-react";
import { useContributionPreference } from "@/hooks/useContributionPreference";
import { ContributionWelcomeDialog, shouldShowWelcome } from "./ContributionWelcomeDialog";
import { ContributeEventDialog } from "./ContributeEventDialog";
import { QuoteSubmissionDialog } from "./QuoteSubmissionDialog";
import { useAuth } from "@/lib/auth";
import { PublicAuthModal } from "./PublicAuthModal";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ContributionButtonProps {
  context: "lifeline" | "quotes";
  lifelineId?: string;
  lifelineTitle?: string;
  collectionId?: string;
  collectionTitle?: string;
  currentEntryId?: string;
  className?: string;
  variant?: "default" | "outline-solid" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  floating?: boolean;
}

export function ContributionButton({
  context,
  lifelineId,
  lifelineTitle,
  collectionId,
  collectionTitle,
  currentEntryId,
  className,
  variant = "default",
  size = "default",
  floating = false,
}: ContributionButtonProps) {
  const { user } = useAuth();
  const { hideButton, loading, updatePreference } = useContributionPreference();
  const [showWelcome, setShowWelcome] = useState(false);
  const [showContributionMenu, setShowContributionMenu] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [contributePictureMode, setContributePictureMode] = useState(false);

  if (loading || hideButton) {
    return null;
  }

  const handleClick = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (shouldShowWelcome()) {
      setShowWelcome(true);
    } else {
      handleContinue();
    }
  };

  const handleContinue = () => {
    setShowWelcome(false);
    if (context === "lifeline") {
      setShowContributionMenu(true);
    } else if (context === "quotes") {
      setShowQuoteDialog(true);
    }
  };

  const handleEventContribution = () => {
    setShowContributionMenu(false);
    setContributePictureMode(false);
    setShowEventDialog(true);
  };

  const handlePictureContribution = () => {
    setShowContributionMenu(false);
    setContributePictureMode(true);
    setShowEventDialog(true);
  };

  const handleHideButton = (hide: boolean) => {
    updatePreference(hide);
  };

  return (
    <>
      <Button
        onClick={handleClick}
        variant={variant}
        size={size}
        className={cn(
          floating && "fixed bottom-20 right-6 z-40 shadow-lg rounded-full h-14 w-14",
          className
        )}
      >
        <PlusCircle className="h-4 w-4" />
        {!floating && <span className="ml-2">Contribute</span>}
      </Button>

      <ContributionWelcomeDialog
        open={showWelcome}
        onOpenChange={setShowWelcome}
        onContinue={handleContinue}
        onHideButton={handleHideButton}
      />

      <Dialog open={showContributionMenu} onOpenChange={setShowContributionMenu}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>What would you like to contribute?</DialogTitle>
            <DialogDescription>
              Choose the type of contribution you'd like to make
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <Button
              onClick={handleEventContribution}
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <span className="font-semibold">Add Event</span>
              </div>
              <p className="text-sm text-muted-foreground text-left">
                Submit a new event with title, score, and description
              </p>
            </Button>
            <Button
              onClick={handlePictureContribution}
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4"
            >
              <div className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                <span className="font-semibold">Add Picture</span>
              </div>
              <p className="text-sm text-muted-foreground text-left">
                Upload an image for an existing event
              </p>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {context === "lifeline" && lifelineId && (
        <ContributeEventDialog
          open={showEventDialog}
          onOpenChange={setShowEventDialog}
          lifelineId={lifelineId}
          lifelineTitle={lifelineTitle || ""}
          onSignInRequired={() => setShowAuthModal(true)}
          contributePictureMode={contributePictureMode}
          initialEntryId={currentEntryId}
        />
      )}

      {context === "quotes" && collectionId && (
        <QuoteSubmissionDialog
          open={showQuoteDialog}
          onOpenChange={setShowQuoteDialog}
          collectionId={collectionId}
          collectionTitle={collectionTitle || ""}
          onSignInRequired={() => setShowAuthModal(true)}
        />
      )}

      <PublicAuthModal
        open={showAuthModal}
        onOpenChange={(open) => {
          setShowAuthModal(open);
          if (!open && user) {
            // Auth success - continue to contribution flow
            if (shouldShowWelcome()) {
              setShowWelcome(true);
            } else {
              handleContinue();
            }
          }
        }}
      />
    </>
  );
}
