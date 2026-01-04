import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Check, X, Eye, Clock, AlertCircle, CheckCircle, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type RequestStatus = "pending" | "approved" | "denied" | "more_info_needed";

interface OwnershipRequest {
  id: string;
  collection_id: string;
  user_id: string;
  email: string;
  claim_reason: string;
  proof_links: string[];
  status: RequestStatus;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  collections?: {
    id: string;
    title: string;
    slug: string;
  };
  user_profiles?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
}

export default function OwnershipRequests() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<OwnershipRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: requests, isLoading } = useQuery({
    queryKey: ["ownership-requests-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collection_ownership_requests")
        .select(`
          *,
          collections(id, title, slug)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user profiles separately
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((r: OwnershipRequest) => r.user_id))];
        const { data: profiles } = await supabase
          .from("user_profiles")
          .select("user_id, first_name, last_name, avatar_url")
          .in("user_id", userIds);

        return data.map((request: OwnershipRequest) => ({
          ...request,
          user_profiles: profiles?.find((p: any) => p.user_id === request.user_id),
        }));
      }

      return data as OwnershipRequest[];
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({
      requestId,
      status,
      notes,
    }: {
      requestId: string;
      status: RequestStatus;
      notes: string;
    }) => {
      const request = requests?.find((r) => r.id === requestId);
      if (!request) throw new Error("Request not found");

      // Update request status
      const { error: updateError } = await supabase
        .from("collection_ownership_requests")
        .update({
          status,
          admin_notes: notes || null,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (updateError) throw updateError;

      // If approving, add user to collection_roles as owner
      if (status === "approved") {
        const { error: roleError } = await supabase
          .from("collection_roles")
          .insert({
            collection_id: request.collection_id,
            user_id: request.user_id,
            role: "owner",
            invited_by: user?.id,
          });

        if (roleError) throw roleError;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ownership-requests-admin"] });
      const actionLabel = 
        variables.status === "approved" ? "approved" :
        variables.status === "denied" ? "denied" :
        "marked as needing more info";
      toast.success(`Request ${actionLabel} successfully`);
      setSelectedRequest(null);
      setAdminNotes("");
    },
    onError: (error) => {
      console.error("Review error:", error);
      toast.error("Failed to process request");
    },
  });

  const handleReview = (status: RequestStatus) => {
    if (!selectedRequest) return;
    reviewMutation.mutate({
      requestId: selectedRequest.id,
      status,
      notes: adminNotes,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-600">Approved</Badge>;
      case "denied":
        return <Badge variant="destructive">Denied</Badge>;
      case "more_info_needed":
        return <Badge className="bg-orange-500">More Info Needed</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "denied":
        return <X className="h-5 w-5 text-red-600" />;
      case "more_info_needed":
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getUserName = (request: OwnershipRequest) => {
    if (request.user_profiles?.first_name || request.user_profiles?.last_name) {
      return `${request.user_profiles.first_name || ""} ${request.user_profiles.last_name || ""}`.trim();
    }
    return request.email;
  };

  const filteredRequests = requests?.filter((r) =>
    statusFilter === "all" || r.status === statusFilter
  );

  const pendingCount = requests?.filter((r) => r.status === "pending").length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ownership Requests</h1>
        <p className="text-muted-foreground">
          Review and manage collection ownership requests
          {pendingCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {pendingCount} pending
            </Badge>
          )}
        </p>
      </div>

      <div className="rounded-md border">
        <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Requests</h2>
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">
                Pending
                {pendingCount > 0 && (
                  <span className="ml-1 bg-primary text-primary-foreground rounded-full px-1.5 text-xs">
                    {pendingCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="denied">Denied</TabsTrigger>
              <TabsTrigger value="more_info_needed">More Info</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Collection</TableHead>
              <TableHead>Requester</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredRequests?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  {statusFilter === "all" ? "No requests found" : `No ${statusFilter} requests`}
                </TableCell>
              </TableRow>
            ) : (
              filteredRequests?.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">
                    {request.collections?.title || "Unknown Collection"}
                  </TableCell>
                  <TableCell>{getUserName(request)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {request.email}
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell className="text-muted-foreground">
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedRequest && getStatusIcon(selectedRequest.status)}
              Ownership Request Review
            </DialogTitle>
            <DialogDescription>
              Review this request to claim collection ownership
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Collection</Label>
                  <p className="font-medium">{selectedRequest.collections?.title}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div>{getStatusBadge(selectedRequest.status)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Requester</Label>
                  <p className="font-medium">{getUserName(selectedRequest)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Contact Email</Label>
                  <p>{selectedRequest.email}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Claim Reason</Label>
                <p className="mt-1 p-3 bg-muted rounded-md whitespace-pre-wrap">
                  {selectedRequest.claim_reason}
                </p>
              </div>

              {selectedRequest.proof_links && selectedRequest.proof_links.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Proof Links</Label>
                  <div className="mt-1 space-y-1">
                    {selectedRequest.proof_links.map((link, index) => (
                      <a
                        key={index}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline text-sm"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {link}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label className="text-muted-foreground">Submitted</Label>
                <p>{new Date(selectedRequest.created_at).toLocaleString()}</p>
              </div>

              {selectedRequest.reviewed_at && (
                <Alert>
                  <AlertDescription>
                    Reviewed on {new Date(selectedRequest.reviewed_at).toLocaleString()}
                  </AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="adminNotes">Admin Notes</Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about your decision (visible to requester if denied or needs more info)..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              {selectedRequest.status === "pending" && (
                <div className="flex gap-2 justify-end pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => handleReview("more_info_needed")}
                    disabled={reviewMutation.isPending}
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Request More Info
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleReview("denied")}
                    disabled={reviewMutation.isPending}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Deny
                  </Button>
                  <Button
                    onClick={() => handleReview("approved")}
                    disabled={reviewMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </div>
              )}

              {selectedRequest.status === "more_info_needed" && (
                <div className="flex gap-2 justify-end pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => handleReview("denied")}
                    disabled={reviewMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Deny
                  </Button>
                  <Button
                    onClick={() => handleReview("approved")}
                    disabled={reviewMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </div>
              )}

              {selectedRequest.status === "denied" && (
                <div className="flex gap-2 justify-end pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => handleReview("pending")}
                    disabled={reviewMutation.isPending}
                  >
                    Revert to Pending
                  </Button>
                </div>
              )}

              {selectedRequest.status === "approved" && (
                <div className="text-sm text-muted-foreground text-center py-2 border-t">
                  This request has been approved. The user is now an owner of this collection.
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
