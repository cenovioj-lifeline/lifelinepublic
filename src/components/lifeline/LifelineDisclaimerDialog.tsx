import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LifelineDisclaimerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAuthenticated: boolean;
}

export function LifelineDisclaimerDialog({
  open,
  onOpenChange,
  isAuthenticated,
}: LifelineDisclaimerDialogProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleCheckboxChange = (checked: boolean) => {
    if (checked && !isAuthenticated) {
      toast.error("Please create a free account to save your preferences");
      return;
    }
    setDontShowAgain(checked);
  };

  const handleContinue = async () => {
    if (dontShowAgain && isAuthenticated) {
      setIsSaving(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Use upsert to insert or update in one operation
          const { error } = await supabase
            .from("user_preferences")
            .upsert(
              {
                user_id: user.id,
                hide_person_lifeline_disclaimer: true,
              },
              {
                onConflict: 'user_id'
              }
            );

          if (error) {
            console.error("Error saving preference:", error);
            toast.error("Failed to save preference");
          }
        }
      } catch (error) {
        console.error("Error saving preference:", error);
        toast.error("Failed to save preference");
      } finally {
        setIsSaving(false);
      }
    }
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Important Notice</AlertDialogTitle>
          <AlertDialogDescription className="text-base space-y-4">
            <p>
              Lifeline Public pulls data from all over to create these stories and narratives. 
              To tell the story of the lifeline and the events within it, we frame the narrative 
              from a first person perspective.
            </p>
            <p>
              This is what AI thinks this person likely thought based on public information. 
              The phrasing and description is purely made up by AI to describe the events from 
              what they believe to be the view of the person who lived them.
            </p>
            <p>
              This is like a book or movie review. We are trying to get in the head of the author 
              or director. Not to be taken as words these people actually spoke.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="dont-show"
            checked={dontShowAgain}
            onCheckedChange={(checked) => handleCheckboxChange(checked as boolean)}
          />
          <Label htmlFor="dont-show" className="text-sm cursor-pointer">
            I acknowledge and won't show this again
          </Label>
        </div>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleContinue} disabled={isSaving}>
            {isSaving ? "Saving..." : "Continue"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
