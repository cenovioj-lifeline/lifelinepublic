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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trophy } from "lucide-react";

interface QuoteSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionId: string;
  collectionTitle: string;
  onSignInRequired: () => void;
}

export function QuoteSubmissionDialog({
  open,
  onOpenChange,
  collectionId,
  collectionTitle,
  onSignInRequired,
}: QuoteSubmissionDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [quoteText, setQuoteText] = useState("");
  const [author, setAuthor] = useState("");
  const [context, setContext] = useState("");

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        onSignInRequired();
        throw new Error("Not authenticated");
      }

      const { error } = await supabase.from("fan_contributions").insert({
        user_id: user.id,
        lifeline_id: collectionId,
        contribution_type: "quote",
        quote_text: quoteText,
        quote_author: author || null,
        quote_context: context || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-contributions"] });
      toast.success("Quote submitted for review!");
      setQuoteText("");
      setAuthor("");
      setContext("");
      onOpenChange(false);
    },
    onError: (error) => {
      if (error.message !== "Not authenticated") {
        toast.error("Failed to submit quote");
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
              You need to create a free account to submit quotes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create an account to contribute quotes to {collectionTitle}.
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
          <DialogTitle>Submit a Quote</DialogTitle>
          <DialogDescription>
            Share a memorable quote from {collectionTitle}. Your submission will be
            reviewed by our team.
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
            <Label htmlFor="quoteText">Quote *</Label>
            <Textarea
              id="quoteText"
              value={quoteText}
              onChange={(e) => setQuoteText(e.target.value)}
              placeholder="Enter the quote..."
              rows={4}
              required
            />
          </div>
          <div>
            <Label htmlFor="author">Who said it? (optional)</Label>
            <Input
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Character or person name"
            />
          </div>
          <div>
            <Label htmlFor="context">Context (optional)</Label>
            <Input
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Season, episode, or situation"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => submitMutation.mutate()}
              disabled={!quoteText.trim() || submitMutation.isPending}
            >
              {submitMutation.isPending ? "Submitting..." : "Submit Quote"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
