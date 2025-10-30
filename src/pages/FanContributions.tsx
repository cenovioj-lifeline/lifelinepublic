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
import { Check, X, Eye, Users } from "lucide-react";

export default function FanContributions() {
  const queryClient = useQueryClient();
  const [selectedContribution, setSelectedContribution] = useState<any>(null);
  const [adminMessage, setAdminMessage] = useState("");
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [superFanStates, setSuperFanStates] = useState<Record<string, boolean>>({});
  const [allUsersSuperFanStates, setAllUsersSuperFanStates] = useState<Record<string, boolean>>({});

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
      
      // Fetch user profiles and super fan status
      if (data) {
        const userIds = data.map((c: any) => c.user_id);
        const { data: profiles } = await supabase
          .from("user_profiles")
          .select("*")
          .in("user_id", userIds);
        
        // Check super fan status for each user
        const superFanPromises = userIds.map(async (userId: string) => {
          const { data: isSuperFan } = await supabase.rpc('is_super_fan', {
            check_user_id: userId
          });
          return { userId, isSuperFan: !!isSuperFan };
        });
        
        const superFanResults = await Promise.all(superFanPromises);
        const superFanMap: Record<string, boolean> = {};
        superFanResults.forEach(({ userId, isSuperFan }) => {
          superFanMap[userId] = isSuperFan;
        });
        setSuperFanStates(superFanMap);
        
        // Attach profiles to contributions
        return data.map((contribution: any) => ({
          ...contribution,
          user_profile: profiles?.find((p: any) => p.user_id === contribution.user_id),
        }));
      }
      
      return data;
    },
  });

  const { data: allUsers, isLoading: usersLoading } = useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("user_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Check super fan status for each user
      if (profiles) {
        const userIds = profiles.map((p: any) => p.user_id);
        const superFanPromises = userIds.map(async (userId: string) => {
          const { data: isSuperFan } = await supabase.rpc('is_super_fan', {
            check_user_id: userId
          });
          return { userId, isSuperFan: !!isSuperFan };
        });

        const superFanResults = await Promise.all(superFanPromises);
        const superFanMap: Record<string, boolean> = {};
        superFanResults.forEach(({ userId, isSuperFan }) => {
          superFanMap[userId] = isSuperFan;
        });
        setAllUsersSuperFanStates(superFanMap);
      }

      return profiles;
    },
  });

  const toggleSuperFanMutation = useMutation({
    mutationFn: async ({ userId, isSuperFan }: { userId: string; isSuperFan: boolean }) => {
      const { error } = await supabase.rpc('toggle_super_fan', {
        target_user_id: userId,
        is_super_fan: isSuperFan
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      setSuperFanStates(prev => ({
        ...prev,
        [variables.userId]: variables.isSuperFan
      }));
      setAllUsersSuperFanStates(prev => ({
        ...prev,
        [variables.userId]: variables.isSuperFan
      }));
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      toast.success(variables.isSuperFan ? "User promoted to Super Fan" : "Super Fan status removed");
    },
    onError: () => {
      toast.error("Failed to update Super Fan status");
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
      let quoteId = null;
      if (status === "approved") {
        if (contribution.contribution_type === "quote") {
          // Add quote to collection_quotes
          const { data: quote, error: quoteError } = await supabase
            .from("collection_quotes")
            .insert({
              collection_id: contribution.lifeline_id,
              quote: contribution.quote_text,
              author: contribution.quote_author,
              context: contribution.quote_context,
            })
            .select()
            .single();

          if (quoteError) throw quoteError;
          quoteId = quote.id;
        } else if (contribution.contribution_type === "event") {
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
      const updateData: any = {
        status,
        admin_message: message,
        reviewed_at: new Date().toISOString(),
      };
      
      if (entryId) updateData.entry_id = entryId;
      
      const { error: updateError } = await supabase
        .from("fan_contributions")
        .update(updateData)
        .eq("id", contributionId);

      if (updateError) throw updateError;

      // Create notification for user
      const contributionTypeLabel = 
        contribution.contribution_type === "quote" ? "quote" :
        contribution.contribution_type === "image" ? "image" : "event";
      
      const notificationMessage = status === "approved"
        ? `Great news! Your ${contributionTypeLabel} contribution has been approved and is now live!`
        : `Your ${contributionTypeLabel} contribution has been reviewed. ${message || "Thank you for your submission."}`;

      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          user_id: contribution.user_id,
          type: "contribution_review",
          title: status === "approved" ? "Contribution Approved!" : "Contribution Update",
          message: notificationMessage,
          related_id: contributionId,
          related_type: "fan_contribution",
        });

      if (notificationError) console.error("Failed to create notification:", notificationError);
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
        <div className="p-4 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <h2 className="text-xl font-semibold">All Users</h2>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Super Fan</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : allUsers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              allUsers?.map((user) => (
                <TableRow 
                  key={user.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleSuperFanMutation.mutate({
                    userId: user.user_id,
                    isSuperFan: !allUsersSuperFanStates[user.user_id]
                  })}
                >
                  <TableCell>
                    {user.first_name || user.last_name
                      ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
                      : "Anonymous User"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.user_id}
                  </TableCell>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={allUsersSuperFanStates[user.user_id] || false}
                      onChange={() => {}}
                      className="cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="rounded-md border">
        <div className="p-4 border-b bg-muted/30">
          <h2 className="text-xl font-semibold">Contributions</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contributor</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Collection/Lifeline</TableHead>
              <TableHead>Content</TableHead>
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
                <>
                  <TableRow key={contribution.id}>
                    <TableCell>
                      <div className="space-y-2">
                        <button
                          onClick={() => setExpandedUserId(
                            expandedUserId === contribution.user_id ? null : contribution.user_id
                          )}
                          className="text-left hover:underline cursor-pointer"
                        >
                          {contribution.user_profile?.first_name ||
                            contribution.user_profile?.last_name
                            ? `${contribution.user_profile?.first_name || ""} ${
                                contribution.user_profile?.last_name || ""
                              }`.trim()
                            : "Anonymous User"}
                        </button>
                        {expandedUserId === contribution.user_id && (
                          <div className="flex items-center gap-2 pl-2">
                            <input
                              type="checkbox"
                              id={`super-fan-${contribution.user_id}`}
                              checked={superFanStates[contribution.user_id] || false}
                              onChange={(e) => toggleSuperFanMutation.mutate({
                                userId: contribution.user_id,
                                isSuperFan: e.target.checked
                              })}
                              className="cursor-pointer"
                            />
                            <label 
                              htmlFor={`super-fan-${contribution.user_id}`}
                              className="text-sm cursor-pointer"
                            >
                              Super Fan
                            </label>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {contribution.contribution_type === "image" 
                        ? "Image" 
                        : contribution.contribution_type === "quote"
                        ? "Quote"
                        : "Event"}
                    </Badge>
                  </TableCell>
                  <TableCell>{contribution.lifelines?.title || "—"}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {contribution.contribution_type === "quote"
                      ? contribution.quote_text
                      : contribution.contribution_type === "image" 
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
                </>
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
                  {selectedContribution.contribution_type === "quote" 
                    ? "Quote Contribution"
                    : selectedContribution.contribution_type === "image" 
                    ? "Image Contribution" 
                    : "Event Contribution"}
                </p>
              </div>
              <div>
                <Label>Collection/Lifeline</Label>
                <p className="text-sm">{selectedContribution.lifelines?.title || "—"}</p>
              </div>
              {selectedContribution.contribution_type === "quote" ? (
                <>
                  <div>
                    <Label>Quote</Label>
                    <p className="text-sm italic whitespace-pre-wrap">
                      "{selectedContribution.quote_text}"
                    </p>
                  </div>
                  {selectedContribution.quote_author && (
                    <div>
                      <Label>Author</Label>
                      <p className="text-sm">{selectedContribution.quote_author}</p>
                    </div>
                  )}
                  {selectedContribution.quote_context && (
                    <div>
                      <Label>Context</Label>
                      <p className="text-sm">{selectedContribution.quote_context}</p>
                    </div>
                  )}
                </>
              ) : selectedContribution.contribution_type === "event" ? (
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
