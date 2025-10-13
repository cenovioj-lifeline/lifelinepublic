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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface ContributeEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lifelineId: string;
  lifelineTitle: string;
  onSignInRequired: () => void;
}

export function ContributeEventDialog({
  open,
  onOpenChange,
  lifelineId,
  lifelineTitle,
  onSignInRequired,
}: ContributeEventDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [score, setScore] = useState("");
  const [description, setDescription] = useState("");

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        onSignInRequired();
        throw new Error("Not authenticated");
      }

      const { error } = await supabase.from("fan_contributions").insert({
        user_id: user.id,
        lifeline_id: lifelineId,
        title,
        score: score ? parseInt(score) : null,
        description,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-contributions"] });
      toast.success("Contribution submitted for review!");
      setTitle("");
      setScore("");
      setDescription("");
      onOpenChange(false);
    },
    onError: (error) => {
      if (error.message !== "Not authenticated") {
        toast.error("Failed to submit contribution");
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
              You need to create a free account to submit events to lifelines.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create an account to contribute to {lifelineTitle} and other lifelines.
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
          <DialogTitle>Contribute a New Event</DialogTitle>
          <DialogDescription>
            Submit a new event for {lifelineTitle}. Your contribution will be reviewed by
            our team.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter event title"
              required
            />
          </div>
          <div>
            <Label htmlFor="score">Rating (optional)</Label>
            <Select value={score} onValueChange={setScore}>
              <SelectTrigger id="score">
                <SelectValue placeholder="Select a rating" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 21 }, (_, i) => i - 10).map((value) => (
                  <SelectItem key={value} value={value.toString()}>
                    {value > 0 ? `+${value}` : value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the event..."
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
              disabled={!title || !description || submitMutation.isPending}
            >
              {submitMutation.isPending ? "Submitting..." : "Submit Contribution"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
