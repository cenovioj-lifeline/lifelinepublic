import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { CollectionManageLayout } from "@/components/manage/CollectionManageLayout";
import { useCollectionRole } from "@/hooks/useCollectionRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Mail, Clock, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TeamMember = {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  user_profile?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
};

type Invite = {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
};

export default function CollectionManageTeam() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "contributor">("editor");
  const [removeMember, setRemoveMember] = useState<TeamMember | null>(null);
  const [cancelInvite, setCancelInvite] = useState<Invite | null>(null);

  // Fetch collection
  const { data: collection } = useQuery({
    queryKey: ["manage-collection", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("id, title, slug")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Get current user's role
  const { isOwner, loading: roleLoading } = useCollectionRole(collection?.id);

  // Fetch team members
  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ["manage-team-members", collection?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collection_roles")
        .select(`
          id,
          user_id,
          role,
          created_at
        `)
        .eq("collection_id", collection!.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch user profiles separately
      const userIds = data.map((m: any) => m.user_id);
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("user_id, first_name, last_name, avatar_url")
        .in("user_id", userIds);

      return data.map((member: any) => ({
        ...member,
        user_profile: profiles?.find((p: any) => p.user_id === member.user_id),
      })) as TeamMember[];
    },
    enabled: !!collection?.id,
  });

  // Fetch pending invites
  const { data: invites, isLoading: invitesLoading } = useQuery({
    queryKey: ["manage-team-invites", collection?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collection_invites")
        .select("id, email, role, status, created_at, expires_at")
        .eq("collection_id", collection!.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        // Table might not exist yet
        console.log("Invites table not available:", error.message);
        return [];
      }
      return data as Invite[];
    },
    enabled: !!collection?.id && isOwner,
  });

  // Create invite mutation
  const inviteMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      const { error } = await supabase.from("collection_invites").insert({
        collection_id: collection!.id,
        email: email.toLowerCase().trim(),
        role,
        invited_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manage-team-invites"] });
      setIsInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("editor");
      toast({
        title: "Invite sent",
        description: "The user will see the invite when they sign in.",
      });
    },
    onError: (error: any) => {
      if (error.message?.includes("duplicate")) {
        toast({
          title: "Already invited",
          description: "This email already has a pending invite.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to send invite",
          variant: "destructive",
        });
      }
    },
  });

  // Cancel invite mutation
  const cancelInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from("collection_invites")
        .delete()
        .eq("id", inviteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manage-team-invites"] });
      setCancelInvite(null);
      toast({
        title: "Invite cancelled",
        description: "The invite has been removed.",
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

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, newRole }: { memberId: string; newRole: string }) => {
      const { error } = await supabase
        .from("collection_roles")
        .update({ role: newRole })
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manage-team-members"] });
      toast({
        title: "Role updated",
        description: "The team member's role has been changed.",
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

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("collection_roles")
        .delete()
        .eq("id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manage-team-members"] });
      setRemoveMember(null);
      toast({
        title: "Member removed",
        description: "The team member has been removed from the collection.",
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

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please enter an email address.",
        variant: "destructive",
      });
      return;
    }
    inviteMutation.mutate({ email: inviteEmail, role: inviteRole });
  };

  const getMemberName = (member: TeamMember) => {
    if (member.user_profile?.first_name || member.user_profile?.last_name) {
      return `${member.user_profile.first_name || ""} ${member.user_profile.last_name || ""}`.trim();
    }
    return "Unknown User";
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "owner":
        return "default";
      case "editor":
        return "secondary";
      default:
        return "outline-solid";
    }
  };

  const isExpiringSoon = (expiresAt: string) => {
    const expires = new Date(expiresAt);
    const now = new Date();
    const daysLeft = (expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysLeft < 7;
  };

  // Only owners can access this page
  if (!roleLoading && !isOwner) {
    return (
      <CollectionManageLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Only collection owners can manage team members.</p>
        </div>
      </CollectionManageLayout>
    );
  }

  return (
    <CollectionManageLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Team Management</h1>
            <p className="text-muted-foreground">
              Manage who can edit this collection
            </p>
          </div>
          <Button onClick={() => setIsInviteDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        </div>

        <Tabs defaultValue="members">
          <TabsList>
            <TabsTrigger value="members">Team Members</TabsTrigger>
            <TabsTrigger value="invites">
              Pending Invites
              {invites && invites.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {invites.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="mt-4">
            <Card>
              <CardContent className="p-0">
                {membersLoading ? (
                  <div className="p-6 text-center text-muted-foreground">Loading...</div>
                ) : members && members.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {members.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {member.user_profile?.avatar_url ? (
                                <img
                                  src={member.user_profile.avatar_url}
                                  alt=""
                                  className="h-8 w-8 rounded-full"
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                  <span className="text-xs font-medium">
                                    {getMemberName(member).charAt(0)}
                                  </span>
                                </div>
                              )}
                              <div>
                                <div className="font-medium">{getMemberName(member)}</div>
                                {member.user_id === user?.id && (
                                  <span className="text-xs text-muted-foreground">(You)</span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {member.role === "owner" || member.user_id === user?.id ? (
                              <Badge variant={getRoleBadgeVariant(member.role)} className="capitalize">
                                {member.role}
                              </Badge>
                            ) : (
                              <Select
                                value={member.role}
                                onValueChange={(value) =>
                                  updateRoleMutation.mutate({ memberId: member.id, newRole: value })
                                }
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="editor">Editor</SelectItem>
                                  <SelectItem value="contributor">Contributor</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(member.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {member.role !== "owner" && member.user_id !== user?.id && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setRemoveMember(member)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-6 text-center text-muted-foreground">
                    No team members yet.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invites" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pending Invites</CardTitle>
                <CardDescription>
                  Invites that haven't been accepted yet. They expire after 30 days.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {invitesLoading ? (
                  <div className="p-6 text-center text-muted-foreground">Loading...</div>
                ) : invites && invites.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Sent</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead className="w-24">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invites.map((invite) => (
                        <TableRow key={invite.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              {invite.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {invite.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(invite.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {isExpiringSoon(invite.expires_at) && (
                                <Clock className="h-4 w-4 text-yellow-500" />
                              )}
                              <span className={isExpiringSoon(invite.expires_at) ? "text-yellow-600" : "text-muted-foreground"}>
                                {new Date(invite.expires_at).toLocaleDateString()}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setCancelInvite(invite)}
                            >
                              <X className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-6 text-center text-muted-foreground">
                    No pending invites.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Invite Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join this collection. They'll see the invite when they sign in.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={inviteRole} onValueChange={(v: "editor" | "contributor") => setInviteRole(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">
                    <div>
                      <div className="font-medium">Editor</div>
                      <div className="text-xs text-muted-foreground">Can edit all content</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="contributor">
                    <div>
                      <div className="font-medium">Contributor</div>
                      <div className="text-xs text-muted-foreground">Can suggest changes</div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={inviteMutation.isPending}>
                {inviteMutation.isPending ? "Sending..." : "Send Invite"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation */}
      <AlertDialog open={!!removeMember} onOpenChange={() => setRemoveMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {getMemberName(removeMember!)} from this collection?
              They will no longer be able to edit content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeMember && removeMemberMutation.mutate(removeMember.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Invite Confirmation */}
      <AlertDialog open={!!cancelInvite} onOpenChange={() => setCancelInvite(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Invite</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel the invite to {cancelInvite?.email}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Invite</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelInvite && cancelInviteMutation.mutate(cancelInvite.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Invite
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CollectionManageLayout>
  );
}
