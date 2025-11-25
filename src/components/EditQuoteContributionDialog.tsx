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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface EditQuoteContributionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quoteId: string;
  initialQuote: string;
  initialAuthor?: string;
  initialContext?: string;
}

export function EditQuoteContributionDialog({
  open,
  onOpenChange,
  quoteId,
  initialQuote,
  initialAuthor,
  initialContext,
}: EditQuoteContributionDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [quote, setQuote] = useState(initialQuote);
  const [author, setAuthor] = useState(initialAuthor || "");
  const [context, setContext] = useState(initialContext || "");

  useEffect(() => {
    if (open) {
      setQuote(initialQuote);
      setAuthor(initialAuthor || "");
      setContext(initialContext || "");
    }
  }, [open, initialQuote, initialAuthor, initialContext]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("collection_quotes")
        .update({
          quote,
          author,
          context,
        })
        .eq("id", quoteId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your quote has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["collection-quotes"] });
      queryClient.invalidateQueries({ queryKey: ["user-contributions"] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update quote",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Your Quote</DialogTitle>
          <DialogDescription>
            Make changes to your quote submission. It will remain in review until approved.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quote">Quote</Label>
            <Textarea
              id="quote"
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              placeholder="Enter the quote..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="author">Author (Optional)</Label>
            <Input
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Who said this?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="context">Context (Optional)</Label>
            <Textarea
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="When or where was this said?"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => updateMutation.mutate()}
            disabled={!quote || updateMutation.isPending}
          >
            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
