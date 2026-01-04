import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useCollectionRole } from "@/hooks/useCollectionRole";
import { CollectionManageLayout } from "@/components/manage/CollectionManageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, UserCog, Shield, ShieldAlert } from "lucide-react";

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  user_profile?: {
    first_name: string | null;
    last_name: string | null;
  };
  user_email?: string;
}

export default function CollectionManageTeam() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isInviting, setIsInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "contributor">("editor");

  // Fetch collection
  const { data: collection } = useQuery({
    queryKey: ["manage-collection", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("id, title")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Check if current user is owner
  const { isOwner } = useCollectionRole(collection?.id);

  // Fetch team members
  const { data: members, isLoading } = useQuery({
    queryKey: ["manage-team", collection?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collection_roles")
        .select("id, user_id, role, created_at")
        .eq("collection_id", collection!.id)
        .order("created_at");

      if (error) throw error;

      // Fetch user profiles
      const userIds = data.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("user_id, first_name, last_name")
        .in("user_id", userIds);

      return data.map((member) => ({
        ...member,
        user_profile: profiles?.find((p) => p.user_id === member.user_id),
      })) as TeamMember[];
    },
    enabled: !!collection?.id,
  });

  // Invite member mutation
  const inviteMutation = useMutation({
    mutationFn: async (data: { email: string; role: string }) => {
      // Find user by email in user_profiles (looking for matching user)
      // Note: In a real app, you'd want to handle invites differently
      // For now, we'll just show an error if we can't find the user
      
      // First, get all users and their profiles to find by email
      // This is a simplified approach - production would use auth.users
      const { data: existingRoles } = await supabase
        .from("collection_roles")
        .select("user_id")
        .eq("collection_id", collection!.id);

      // For demo purposes, show informative message
      throw new Error(
        "User lookup by email requires admin access. " +
        "In production, this would send an invite email or look up the user."
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manage-team"] });
      toast.success("Member invited");
      setIsInviting(false);
      setInviteEmail("");
      setInviteRole("editor");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async (data: { id: string; role: string }) => {
      const { error } = await supabase
        .from("collection_roles")
        .update({ role: data.role })
        .eq("id", data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manage-team"] });
      toast.success("Role updated");
    },
    onError: () => {
      toast.error("Failed to update role");
    },
  });

  // Remove member mutation
  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("collection_roles")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manage-team"] });
      toast.success("Member removed");
    },
    onError: () => {
      toast.error("Failed to remove member");
    },
  });

  const getMemberName = (member: TeamMember) => {
    if (member.user_profile?.first_name || member.user_profile?.last_name) {
      return `${member.user_profile.first_name || ""} ${member.user_profile.last_name || ""}`.trim();
    }
    return "Unknown User";
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "owner":
        return <Badge className="bg-purple-600">Owner</Badge>;
      case "editor":
        return <Badge className="bg-blue-600">Editor</Badge>;
      case "contributor":
        return <Badge variant="secondary">Contributor</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const ownerCount = members?.filter((m) => m.role === "owner").length || 0;

  // If not owner, show access denied
  if (!isOwner) {
    return (
      <CollectionManageLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <ShieldAlert className="h-16 w-16 mx-auto text-muted-foreground" />
            <h1 className="text-2xl font-bold">Owners Only</h1>
            <p className="text-muted-foreground">
              Only collection owners can manage team members.
            </p>
          </div>
        </div>
      </CollectionManageLayout>
    );
  }

  return (
    <CollectionManageLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Team</h1>
            <p className="text-muted-foreground">
              Manage who can edit this collection
            </p>
          </div>
          <Button onClick={() => setIsInviting(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Invite Member
          </Button>
        </div>

        {/* Role Descriptions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <div className="font-medium">Owner</div>
                  <div className="text-sm text-muted-foreground">
                    Full control. Can manage team and all content.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="font-medium">Editor</div>
                  <div className="text-sm text-muted-foreground">
                    Can edit all content but cannot manage team.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="font-medium">Contributor</div>
                  <div className="text-sm text-muted-foreground">
                    Can suggest changes (requires approval).
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <CardDescription>{members?.length || 0} team members</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : members?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No team members
                    </TableCell>
                  </TableRow>
                ) : (
                  members?.map((member) => {
                    const isCurrentUser = member.user_id === user?.id;
                    const canRemove = !isCurrentUser && !(member.role === "owner" && ownerCount <= 1);
                    const canChangeRole = !isCurrentUser;

                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                <UserCog className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {getMemberName(member)}
                                {isCurrentUser && (
                                  <span className="text-muted-foreground ml-2">(you)</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {canChangeRole ? (
                            <Select
                              value={member.role}
                              onValueChange={(value) =>
                                updateRoleMutation.mutate({ id: member.id, role: value })
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="owner">Owner</SelectItem>
                                <SelectItem value="editor">Editor</SelectItem>
                                <SelectItem value="contributor">Contributor</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            getRoleBadge(member.role)
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(member.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {canRemove && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm("Remove this team member?")) {
                                  removeMutation.mutate(member.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Invite Dialog */}
      <Dialog open={isInviting} onOpenChange={setIsInviting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Invite someone to help manage this collection.
              They must already have an account on Lifeline Public.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="member@example.com"
              />
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "editor" | "contributor")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">Editor - Can edit all content</SelectItem>
                  <SelectItem value="contributor">Contributor - Can suggest changes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsInviting(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => inviteMutation.mutate({ email: inviteEmail, role: inviteRole })}
                disabled={!inviteEmail.trim() || inviteMutation.isPending}
              >
                Send Invite
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </CollectionManageLayout>
  );
}
