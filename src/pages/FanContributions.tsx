import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Check, X, Eye } from "lucide-react";

export default function FanContributions() {
  const queryClient = useQueryClient();
  const [selectedContribution, setSelectedContribution] = useState<any>(null);
  const [adminMessage, setAdminMessage] = useState("");

  const { data: contributions, isLoading } = useQuery({
    queryKey: ["fan-contributions-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fan_contributions")
        .select(`
          *,
          lifelines(title, slug),
          media_assets(*),
          entries!fan_contributions_entry_ref_fkey(title)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Fetch user profiles separately
      if (data) {
        const userIds = data.map((c: any) => c.user_id);
        const { data: profiles } = await supabase
          .from("user_profiles")
          .select("*")
          .in("user_id", userIds);
        
        // Attach profiles to contributions
        return data.map((contribution: any) => ({
          ...contribution,
          user_profile: profiles?.find((p: any) => p.user_id === contribution.user_id),
        }));
      }
      
      return data;
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({
      contributionId,
      status,
      message,
    }: {
      contributionId: string;
      status: "approved" | "rejected";
      message: string;
    }) => {
      const contribution = contributions?.find((c) => c.id === contributionId);
      if (!contribution) throw new Error("Contribution not found");

      // If approving, handle based on contribution type
      let entryId = null;
      if (status === "approved") {
        if (contribution.contribution_type === "event") {
          // Create new entry
          const { data: entry, error: entryError } = await supabase
            .from("entries")
            .insert({
              lifeline_id: contribution.lifeline_id,
              title: contribution.title,
              score: contribution.score,
              summary: contribution.description,
              is_fan_contributed: true,
              contributed_by_user_id: contribution.user_id,
            })
            .select()
            .single();

          if (entryError) throw entryError;
          entryId = entry.id;
        } else if (contribution.contribution_type === "image") {
          // Add image to existing entry
          const { error: mediaError } = await supabase
            .from("entry_media")
            .insert({
              entry_id: contribution.entry_ref,
              media_id: contribution.media_id,
              order_index: 0,
            });

          if (mediaError) throw mediaError;
          entryId = contribution.entry_ref;
        }
      }

      // Update contribution status
      const { error: updateError } = await supabase
        .from("fan_contributions")
        .update({
          status,
          admin_message: message,
          reviewed_at: new Date().toISOString(),
          entry_id: entryId,
        })
        .eq("id", contributionId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fan-contributions-admin"] });
      toast.success("Contribution reviewed successfully");
      setSelectedContribution(null);
      setAdminMessage("");
    },
    onError: () => {
      toast.error("Failed to review contribution");
    },
  });

  const handleReview = (status: "approved" | "rejected") => {
    if (!selectedContribution) return;
    reviewMutation.mutate({
      contributionId: selectedContribution.id,
      status,
      message: adminMessage,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="default">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fan Contributions</h1>
        <p className="text-muted-foreground">
          Review and manage user-submitted events
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contributor</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Lifeline</TableHead>
              <TableHead>Title/Event</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : contributions?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No contributions found
                </TableCell>
              </TableRow>
            ) : (
              contributions?.map((contribution) => (
                <TableRow key={contribution.id}>
                  <TableCell>
                    {contribution.user_profile?.first_name ||
                      contribution.user_profile?.last_name
                      ? `${contribution.user_profile?.first_name || ""} ${
                          contribution.user_profile?.last_name || ""
                        }`.trim()
                      : "Anonymous User"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {contribution.contribution_type === "image" ? "Image" : "Event"}
                    </Badge>
                  </TableCell>
                  <TableCell>{contribution.lifelines?.title}</TableCell>
                  <TableCell>
                    {contribution.contribution_type === "image" 
                      ? contribution.entries?.title || "—"
                      : contribution.title}
                  </TableCell>
                  <TableCell>{getStatusBadge(contribution.status)}</TableCell>
                  <TableCell>
                    {new Date(contribution.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedContribution(contribution);
                        setAdminMessage(contribution.admin_message || "");
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!selectedContribution}
        onOpenChange={() => setSelectedContribution(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Contribution</DialogTitle>
            <DialogDescription>
              Review and approve or reject this user submission
            </DialogDescription>
          </DialogHeader>
          {selectedContribution && (
            <div className="space-y-4">
              <div>
                <Label>Type</Label>
                <p className="text-sm">
                  {selectedContribution.contribution_type === "image" ? "Image Contribution" : "Event Contribution"}
                </p>
              </div>
              <div>
                <Label>Lifeline</Label>
                <p className="text-sm">{selectedContribution.lifelines?.title}</p>
              </div>
              {selectedContribution.contribution_type === "event" ? (
                <>
                  <div>
                    <Label>Title</Label>
                    <p className="text-sm">{selectedContribution.title}</p>
                  </div>
                  <div>
                    <Label>Score</Label>
                    <p className="text-sm">{selectedContribution.score || "Not provided"}</p>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <p className="text-sm whitespace-pre-wrap">
                      {selectedContribution.description}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label>Event</Label>
                    <p className="text-sm">{selectedContribution.entries?.title}</p>
                  </div>
                  <div>
                    <Label>Image</Label>
                    {selectedContribution.media_assets && (
                      <img
                        src={selectedContribution.media_assets.url}
                        alt={selectedContribution.media_assets.alt_text || "Contributed image"}
                        className="mt-2 w-full max-h-64 object-contain rounded-lg border"
                      />
                    )}
                  </div>
                </>
              )}
              <div>
                <Label htmlFor="adminMessage">Message to User</Label>
                <Textarea
                  id="adminMessage"
                  value={adminMessage}
                  onChange={(e) => setAdminMessage(e.target.value)}
                  placeholder="Add a message for the user (optional)"
                  rows={3}
                />
              </div>
              {selectedContribution.status === "pending" && (
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => handleReview("rejected")}
                    disabled={reviewMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleReview("approved")}
                    disabled={reviewMutation.isPending}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </div>
              )}
              {selectedContribution.status !== "pending" && (
                <div className="text-sm text-muted-foreground">
                  Status: {getStatusBadge(selectedContribution.status)}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
