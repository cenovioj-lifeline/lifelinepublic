import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check } from "lucide-react";
import { toast } from "sonner";

interface JoinCommunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionId: string;
  collectionTitle: string;
  onSignInRequired?: () => void;
}

export function JoinCommunityDialog({
  open,
  onOpenChange,
  collectionId,
  collectionTitle,
  onSignInRequired,
}: JoinCommunityDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isJoining, setIsJoining] = useState(false);

  // Check if user is already a member
  const { data: isMember, isLoading } = useQuery({
    queryKey: ["collection-member", collectionId, user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data, error } = await supabase
        .from("collection_members")
        .select("id")
        .eq("collection_id", collectionId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user?.id && !!collectionId && open,
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("collection_members")
        .insert({
          collection_id: collectionId,
          user_id: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection-member", collectionId] });
      queryClient.invalidateQueries({ queryKey: ["collection-member-count", collectionId] });
      toast.success(`You've joined the ${collectionTitle} community!`);
      setIsJoining(false);
    },
    onError: (error: Error) => {
      toast.error(`Failed to join: ${error.message}`);
      setIsJoining(false);
    },
  });

  const handleJoin = () => {
    if (!user) {
      onOpenChange(false);
      onSignInRequired?.();
      return;
    }
    setIsJoining(true);
    joinMutation.mutate();
  };

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign In Required</DialogTitle>
            <DialogDescription>
              You need to sign in to join the {collectionTitle} community.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleJoin}>
              Sign In
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isMember ? `You're a Member!` : `Join the ${collectionTitle} Community`}
          </DialogTitle>
          <DialogDescription>
            {isMember ? (
              <div className="flex items-center gap-2 text-green-600 font-medium">
                <Check className="h-5 w-5" />
                You're already a member of this community
              </div>
            ) : (
              <>
                Joining allows you to make contributions to the collection. You will be able to add pictures, 
                events, update descriptions, fix inaccuracies, and get credit for your contributions as a 
                dedicated fan of {collectionTitle}.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        {!isMember && (
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleJoin} 
              disabled={isJoining || isLoading}
            >
              {isJoining ? "Joining..." : "Join Community"}
            </Button>
          </div>
        )}
        {isMember && (
          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}