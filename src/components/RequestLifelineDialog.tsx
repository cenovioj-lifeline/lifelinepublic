import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trophy } from "lucide-react";

interface RequestLifelineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignInRequired: () => void;
}

export function RequestLifelineDialog({
  open,
  onOpenChange,
  onSignInRequired,
}: RequestLifelineDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [requestDetails, setRequestDetails] = useState("");

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        onSignInRequired();
        throw new Error("Not authenticated");
      }

      const { error } = await supabase.from("user_requests").insert({
        user_id: user.id,
        request_type: "lifeline_collection",
        request_details: requestDetails,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-requests"] });
      toast.success("Request submitted successfully! We'll email you when it's complete.");
      setRequestDetails("");
      onOpenChange(false);
    },
    onError: (error) => {
      if (error.message !== "Not authenticated") {
        toast.error("Failed to submit request");
      }
    },
  });

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign In Required</DialogTitle>
            <DialogDescription>
              You need to create a free account to submit requests.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create an account to request new lifelines and collections.
            </p>
            <Button onClick={onSignInRequired} className="w-full">
              Sign In / Create Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Request a Lifeline or Collection</DialogTitle>
          <DialogDescription>
            Would you like to request a lifeline or collection be created for your favorite public figure? Fictional or real. Let us know what you would like to see. If we are able to make it happen we will email you back when it is complete.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Alert>
            <Trophy className="h-4 w-4" />
            <AlertDescription>
              We will be creating a Hall of Fame to showcase our most prolific contributors!
            </AlertDescription>
          </Alert>
          
          <div>
            <Label htmlFor="requestDetails">Your Request *</Label>
            <Textarea
              id="requestDetails"
              value={requestDetails}
              onChange={(e) => setRequestDetails(e.target.value)}
              placeholder="Tell us about the lifeline or collection you'd like to see..."
              rows={5}
              required
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => submitMutation.mutate()}
              disabled={!requestDetails.trim() || submitMutation.isPending}
            >
              {submitMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
