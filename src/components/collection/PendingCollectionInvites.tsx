import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Mail, Check, X, Clock } from "lucide-react";

type PendingInvite = {
  id: string;
  collection_id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
  collection?: {
    title: string;
    slug: string;
  };
};

export function PendingCollectionInvites() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pending invites for current user
  const { data: invites, isLoading } = useQuery({
    queryKey: ["my-pending-invites"],
    queryFn: async () => {
      // First get invites
      const { data: inviteData, error } = await supabase
        .from("collection_invites")
        .select(`
          id,
          collection_id,
          email,
          role,
          created_at,
          expires_at
        `)
        .eq("status", "pending");

      if (error) {
        // Table might not exist yet
        console.log("Invites table not available:", error.message);
        return [];
      }

      if (!inviteData || inviteData.length === 0) return [];

      // Fetch collection info
      const collectionIds = inviteData.map((i: any) => i.collection_id);
      const { data: collections } = await supabase
        .from("collections")
        .select("id, title, slug")
        .in("id", collectionIds);

      return inviteData.map((invite: any) => ({
        ...invite,
        collection: collections?.find((c: any) => c.id === invite.collection_id),
      })) as PendingInvite[];
    },
    enabled: !!user,
  });

  // Accept invite mutation
  const acceptMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      // Call the database function to accept the invite
      const { data, error } = await supabase.rpc("accept_collection_invite", {
        p_invite_id: inviteId,
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["my-pending-invites"] });
      queryClient.invalidateQueries({ queryKey: ["my-collection-roles"] });
      toast({
        title: "Invite accepted!",
        description: `You're now a ${data.role} of this collection.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to accept invite",
        variant: "destructive",
      });
    },
  });

  // Decline invite mutation
  const declineMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from("collection_invites")
        .update({ status: "declined" })
        .eq("id", inviteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-pending-invites"] });
      toast({
        title: "Invite declined",
        description: "The invite has been declined.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isExpiringSoon = (expiresAt: string) => {
    const expires = new Date(expiresAt);
    const now = new Date();
    const daysLeft = (expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysLeft < 7;
  };

  if (isLoading || !invites || invites.length === 0) {
    return null;
  }

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg">Collection Invites</CardTitle>
        </div>
        <CardDescription>
          You've been invited to collaborate on the following collections
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {invites.map((invite) => (
          <div
            key={invite.id}
            className="flex items-center justify-between p-3 bg-white rounded-lg border"
          >
            <div className="flex-1">
              <div className="font-medium">
                {invite.collection?.title || "Unknown Collection"}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="capitalize">
                  {invite.role}
                </Badge>
                {isExpiringSoon(invite.expires_at) && (
                  <span className="flex items-center gap-1 text-yellow-600">
                    <Clock className="h-3 w-3" />
                    Expires soon
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => declineMutation.mutate(invite.id)}
                disabled={declineMutation.isPending}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                onClick={() => acceptMutation.mutate(invite.id)}
                disabled={acceptMutation.isPending}
              >
                <Check className="h-4 w-4 mr-1" />
                Accept
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
