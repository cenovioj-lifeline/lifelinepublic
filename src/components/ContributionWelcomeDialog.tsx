import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ContributionWelcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
  onHideButton: (hide: boolean) => void;
}

const WELCOME_SEEN_KEY = "contribution-welcome-seen";

export function ContributionWelcomeDialog({
  open,
  onOpenChange,
  onContinue,
  onHideButton,
}: ContributionWelcomeDialogProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [hideButton, setHideButton] = useState(false);

  const handleContinue = () => {
    if (dontShowAgain) {
      localStorage.setItem(WELCOME_SEEN_KEY, "true");
    }
    if (hideButton) {
      onHideButton(true);
    }
    onContinue();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contribute to This Collection</DialogTitle>
          <DialogDescription className="space-y-3 pt-2">
            <p>
              Your contributions help make this better! You can submit events, images, and quotes.
            </p>
            <p>
              All contributions go through a quick review before going live. You can always see and edit your submissions until they're approved.
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="dont-show"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
            />
            <Label htmlFor="dont-show" className="text-sm cursor-pointer">
              Don't show this intro again
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hide-button"
              checked={hideButton}
              onCheckedChange={(checked) => setHideButton(checked as boolean)}
            />
            <Label htmlFor="hide-button" className="text-sm cursor-pointer">
              Hide contribute button (you can re-enable it in your profile)
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleContinue}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function shouldShowWelcome(): boolean {
  return !localStorage.getItem(WELCOME_SEEN_KEY);
}
