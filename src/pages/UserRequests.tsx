import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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

export default function UserRequests() {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const { data: requests, isLoading } = useQuery({
    queryKey: ["user-requests-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user profiles separately
      if (data) {
        const userIds = data.map((r: any) => r.user_id);
        const { data: profiles } = await supabase
          .from("user_profiles")
          .select("*")
          .in("user_id", userIds);
        
        // Attach profiles to requests
        return data.map((request: any) => ({
          ...request,
          user_profile: profiles?.find((p: any) => p.user_id === request.user_id),
        }));
      }

      return data;
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({
      requestId,
      status,
      notes,
      userId,
    }: {
      requestId: string;
      status: "completed" | "denied";
      notes: string;
      userId: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Update request status
      const { error: updateError } = await supabase
        .from("user_requests")
        .update({
          status,
          admin_notes: notes,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq("id", requestId);

      if (updateError) throw updateError;

      // Create notification for user
      const notificationMessage = status === "completed"
        ? "Great news! Your request has been completed. Check it out!"
        : `Your request has been reviewed. ${notes || "Thank you for your submission."}`;

      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          user_id: userId,
          type: "request_review",
          title: status === "completed" ? "Request Completed!" : "Request Update",
          message: notificationMessage,
          related_id: requestId,
          related_type: "user_request",
        });

      if (notificationError) throw notificationError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-requests-admin"] });
      toast.success("Request reviewed successfully");
      setSelectedRequest(null);
      setAdminNotes("");
    },
    onError: () => {
      toast.error("Failed to review request");
    },
  });

  const handleReview = (status: "completed" | "denied") => {
    if (!selectedRequest) return;
    reviewMutation.mutate({
      requestId: selectedRequest.id,
      status,
      notes: adminNotes,
      userId: selectedRequest.user_id,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default">Completed</Badge>;
      case "denied":
        return <Badge variant="destructive">Denied</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Requests</h1>
        <p className="text-muted-foreground">
          Review and manage user requests for new lifelines and collections
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Request</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : requests?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No requests found
                </TableCell>
              </TableRow>
            ) : (
              requests?.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    {request.user_profile?.first_name ||
                      request.user_profile?.last_name
                      ? `${request.user_profile?.first_name || ""} ${
                          request.user_profile?.last_name || ""
                        }`.trim()
                      : "Anonymous User"}
                  </TableCell>
                  <TableCell className="max-w-md truncate">
                    {request.request_details}
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>
                    {new Date(request.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedRequest(request);
                        setAdminNotes(request.admin_notes || "");
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
        open={!!selectedRequest}
        onOpenChange={() => setSelectedRequest(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Request</DialogTitle>
            <DialogDescription>
              Review and mark as completed or denied
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <Label>User</Label>
                <p className="text-sm">
                  {selectedRequest.user_profile?.first_name ||
                    selectedRequest.user_profile?.last_name
                    ? `${selectedRequest.user_profile?.first_name || ""} ${
                        selectedRequest.user_profile?.last_name || ""
                      }`.trim()
                    : "Anonymous User"}
                </p>
              </div>
              <div>
                <Label>Request Details</Label>
                <p className="text-sm whitespace-pre-wrap">
                  {selectedRequest.request_details}
                </p>
              </div>
              <div>
                <Label htmlFor="adminNotes">Notes (will be included in notification)</Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes for the user (optional)"
                  rows={3}
                />
              </div>
              {selectedRequest.status === "pending" && (
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => handleReview("denied")}
                    disabled={reviewMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Deny
                  </Button>
                  <Button
                    onClick={() => handleReview("completed")}
                    disabled={reviewMutation.isPending}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Mark Complete
                  </Button>
                </div>
              )}
              {selectedRequest.status !== "pending" && (
                <div className="text-sm text-muted-foreground">
                  Status: {getStatusBadge(selectedRequest.status)}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
