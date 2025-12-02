import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Check, Users } from "lucide-react";
import { toast } from "sonner";

interface JoinCommunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionId: string;
  collectionTitle: string;
  collectionSlug: string;
  onSignInRequired?: () => void;
}

export function JoinCommunityDialog({
  open,
  onOpenChange,
  collectionId,
  collectionTitle,
  collectionSlug,
  onSignInRequired,
}: JoinCommunityDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isJoining, setIsJoining] = useState(false);

  // Fetch membership info including member number
  const { data: membershipInfo, isLoading } = useQuery({
    queryKey: ["collection-membership-info", collectionId, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Get all members ordered by joined_at to calculate member number
      const { data: allMembers, error } = await supabase
        .from("collection_members")
        .select("id, user_id, joined_at, hidden_from_list")
        .eq("collection_id", collectionId)
        .order("joined_at", { ascending: true });

      if (error) throw error;
      if (!allMembers || allMembers.length === 0) return null;

      // Find current user's membership and calculate their number
      let memberNumber = 0;
      let userMembership = null;

      for (const member of allMembers) {
        memberNumber++;
        if (member.user_id === user.id) {
          userMembership = {
            ...member,
            member_number: memberNumber,
          };
          break;
        }
      }

      return userMembership;
    },
    enabled: !!user?.id && !!collectionId && open,
  });

  const isMember = !!membershipInfo;
  const [hiddenFromList, setHiddenFromList] = useState(false);

  // Sync hidden state with database value
  useEffect(() => {
    if (membershipInfo) {
      setHiddenFromList(membershipInfo.hidden_from_list || false);
    }
  }, [membershipInfo]);

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
      queryClient.invalidateQueries({ queryKey: ["collection-membership-info", collectionId] });
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

  const updateHiddenMutation = useMutation({
    mutationFn: async (hidden: boolean) => {
      if (!user?.id || !membershipInfo?.id) throw new Error("Not authenticated or not a member");

      const { error } = await supabase
        .from("collection_members")
        .update({ hidden_from_list: hidden })
        .eq("id", membershipInfo.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection-membership-info", collectionId] });
      queryClient.invalidateQueries({ queryKey: ["collection-members-list", collectionId] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update preference: ${error.message}`);
      // Revert local state
      setHiddenFromList(!hiddenFromList);
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

  const handleHiddenToggle = (checked: boolean) => {
    setHiddenFromList(checked);
    updateHiddenMutation.mutate(checked);
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
          {!isMember && (
            <DialogDescription>
              Joining allows you to make contributions to the collection. You will be able to add pictures, 
              events, update descriptions, fix inaccuracies, and get credit for your contributions as a 
              dedicated fan of {collectionTitle}.
            </DialogDescription>
          )}
        </DialogHeader>

        {isMember ? (
          <div className="space-y-6">
            {/* Success indicator */}
            <div className="flex items-center gap-2 text-green-600 font-medium">
              <Check className="h-5 w-5" />
              You're a member of this community
            </div>

            {/* Member number display */}
            <div className="text-center py-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Your Member Number</p>
              <span className="text-4xl font-bold">#{membershipInfo?.member_number}</span>
            </div>

            {/* Link to members page + Privacy toggle grouped */}
            <div className="space-y-3">
              <Link 
                to={`/public/collections/${collectionSlug}/members`}
                onClick={() => onOpenChange(false)}
              >
                <Button variant="outline" className="w-full">
                  <Users className="h-4 w-4 mr-2" />
                  See All Members
                </Button>
              </Link>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="hidden-from-list"
                  checked={hiddenFromList} 
                  onCheckedChange={(checked) => handleHiddenToggle(checked === true)}
                  disabled={updateHiddenMutation.isPending}
                />
                <label 
                  htmlFor="hidden-from-list" 
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Hide my name from member list
                </label>
              </div>
            </div>

            {/* Close button */}
            <div className="flex justify-end">
              <Button onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : (
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
      </DialogContent>
    </Dialog>
  );
}
