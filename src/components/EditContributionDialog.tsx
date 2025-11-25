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

interface EditContributionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entryId: string;
  initialTitle: string;
  initialDescription?: string;
  initialScore?: number;
}

export function EditContributionDialog({
  open,
  onOpenChange,
  entryId,
  initialTitle,
  initialDescription,
  initialScore,
}: EditContributionDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription || "");
  const [score, setScore] = useState(initialScore?.toString() || "");

  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      setDescription(initialDescription || "");
      setScore(initialScore?.toString() || "");
    }
  }, [open, initialTitle, initialDescription, initialScore]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("entries")
        .update({
          title,
          details: description,
          score: score ? parseInt(score) : null,
        })
        .eq("id", entryId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your contribution has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["lifeline"] });
      queryClient.invalidateQueries({ queryKey: ["user-contributions"] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update contribution",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Your Contribution</DialogTitle>
          <DialogDescription>
            Make changes to your event submission. It will remain in review until approved.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What happened?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="score">Impact Score (Optional)</Label>
            <Input
              id="score"
              type="number"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="-10 to +10"
              min="-10"
              max="10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us more about this event..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => updateMutation.mutate()}
            disabled={!title || updateMutation.isPending}
          >
            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
