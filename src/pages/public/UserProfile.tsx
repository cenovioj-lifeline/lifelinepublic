import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Pencil, Save, X, Trash2 } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";
import { PasswordInput } from "@/components/ui/password-input";
import { ContributionStatusBadge } from "@/components/ContributionStatusBadge";
import { EditContributionDialog } from "@/components/EditContributionDialog";
import { EditQuoteContributionDialog } from "@/components/EditQuoteContributionDialog";
import { useContributionPreference } from "@/hooks/useContributionPreference";
import { Switch } from "@/components/ui/switch";

export default function UserProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { hideButton, updatePreference } = useContributionPreference();
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [editingContribution, setEditingContribution] = useState<any>(null);
  const [editingQuote, setEditingQuote] = useState<any>(null);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      if (data) {
        setFirstName(data.first_name || "");
        setLastName(data.last_name || "");
        setAvatarUrl(data.avatar_url || "");
      }
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: contributions } = useQuery({
    queryKey: ["user-contributions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("fan_contributions")
        .select(`
          *,
          lifelines(title, slug)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const handleAvatarUploadComplete = (mediaAssetId: string, url: string) => {
    setAvatarUrl(url);
  };

  const handleAvatarRemove = () => {
    setAvatarUrl("");
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not authenticated");
      
      const profileData = {
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        avatar_url: avatarUrl,
      };

      if (profile) {
        const { error } = await supabase
          .from("user_profiles")
          .update(profileData)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_profiles")
          .insert(profileData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      setIsEditing(false);
      toast.success("Profile updated successfully");
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      if (!currentPassword || !newPassword || !confirmPassword) {
        throw new Error("Please fill in all password fields");
      }

      if (newPassword !== confirmPassword) {
        throw new Error("New passwords don't match");
      }

      if (newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      // Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: currentPassword,
      });

      if (signInError) {
        throw new Error("Current password is incorrect");
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteContributionMutation = useMutation({
    mutationFn: async (contributionId: string) => {
      const { error } = await supabase
        .from("fan_contributions")
        .delete()
        .eq("id", contributionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-contributions"] });
      toast.success("Contribution deleted");
    },
    onError: () => {
      toast.error("Failed to delete contribution");
    },
  });

  const displayName = profile?.first_name || profile?.last_name
    ? `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim()
    : user?.email || "User";

  const initials = profile?.first_name && profile?.last_name
    ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
    : user?.email?.[0].toUpperCase() || "U";

  if (profileLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Contribution Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Show Contribute Button</p>
                <p className="text-sm text-muted-foreground">
                  Display the contribute button when viewing lifelines and quotes
                </p>
              </div>
              <Switch 
                checked={!hideButton}
                onCheckedChange={(checked) => updatePreference(!checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Profile</CardTitle>
            {!isEditing && (
              <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{displayName}</h2>
                <p className="text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            {isEditing && (
              <div className="space-y-4 border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter last name"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="avatarUrl">Upload Profile Picture</Label>
                  <ImageUpload
                    onUploadComplete={handleAvatarUploadComplete}
                    currentImageUrl={avatarUrl}
                    onRemove={handleAvatarRemove}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => saveMutation.mutate()}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); changePasswordMutation.mutate(); }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <PasswordInput
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <PasswordInput
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <PasswordInput
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" disabled={changePasswordMutation.isPending}>
                {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Contributions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Lifeline</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contributions?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No contributions yet
                    </TableCell>
                  </TableRow>
                ) : (
                  contributions?.map((contribution) => {
                    const isPending = ['pending', 'rejected'].includes(contribution.status);
                    return (
                      <TableRow key={contribution.id}>
                        <TableCell>
                          <Badge variant="outline">
                            {contribution.contribution_type === "quote" ? "Quote" : 
                             contribution.contribution_type === "image" ? "Image" : "Event"}
                          </Badge>
                        </TableCell>
                        <TableCell>{contribution.lifelines?.title}</TableCell>
                        <TableCell>
                          {contribution.contribution_type === "quote" 
                            ? contribution.quote_text?.substring(0, 50) + "..."
                            : contribution.title}
                        </TableCell>
                        <TableCell>
                          <ContributionStatusBadge 
                            status={contribution.status}
                            adminMessage={contribution.admin_message}
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(contribution.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {isPending && (
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (contribution.contribution_type === "quote") {
                                    setEditingQuote(contribution);
                                  } else {
                                    setEditingContribution(contribution);
                                  }
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm("Delete this contribution?")) {
                                    deleteContributionMutation.mutate(contribution.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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

        {editingContribution && (
          <EditContributionDialog
            open={!!editingContribution}
            onOpenChange={(open) => !open && setEditingContribution(null)}
            entryId={editingContribution.entry_id || ""}
            initialTitle={editingContribution.title || ""}
            initialDescription={editingContribution.description}
            initialScore={editingContribution.score}
          />
        )}

        {editingQuote && (
          <EditQuoteContributionDialog
            open={!!editingQuote}
            onOpenChange={(open) => !open && setEditingQuote(null)}
            quoteId={editingQuote.id}
            initialQuote={editingQuote.quote_text}
            initialAuthor={editingQuote.quote_author}
            initialContext={editingQuote.quote_context}
          />
        )}
      </div>
  );
}
