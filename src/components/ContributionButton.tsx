import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useContributionPreference } from "@/hooks/useContributionPreference";
import { ContributionWelcomeDialog, shouldShowWelcome } from "./ContributionWelcomeDialog";
import { ContributeEventDialog } from "./ContributeEventDialog";
import { QuoteSubmissionDialog } from "./QuoteSubmissionDialog";
import { useAuth } from "@/lib/auth";
import { PublicAuthModal } from "./PublicAuthModal";
import { cn } from "@/lib/utils";

interface ContributionButtonProps {
  context: "lifeline" | "quotes";
  lifelineId?: string;
  lifelineTitle?: string;
  collectionId?: string;
  collectionTitle?: string;
  currentEntryId?: string;
  className?: string;
  variant?: "default" | "outline" | "ghost";
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
      setShowEventDialog(true);
      setContributePictureMode(false);
    } else if (context === "quotes") {
      setShowQuoteDialog(true);
    }
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
