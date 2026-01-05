import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CollectionManageLayout } from "@/components/manage/CollectionManageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, ExternalLink, Users } from "lucide-react";

interface Profile {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  image_url: string | null;
  primary_lifeline_id: string | null;
  lifeline_title?: string;
}

export default function CollectionManageProfiles() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(searchParams.get("action") === "new");

  // Form state
  const [formName, setFormName] = useState("");
  const [formBio, setFormBio] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");

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

  // Fetch profiles linked to this collection via profile_collections
  const { data: profiles, isLoading } = useQuery({
    queryKey: ["manage-profiles", collection?.id],
    queryFn: async () => {
      // Get profiles linked to this collection
      const { data: linkedProfiles, error } = await supabase
        .from("profile_collections")
        .select(`
          profile_id,
          profiles(
            id,
            name,
            slug,
            short_description,
            avatar_image_id,
            media_assets!profiles_avatar_image_id_fkey(url)
          )
        `)
        .eq("collection_id", collection!.id);

      if (error) throw error;

      return (linkedProfiles || []).map((pc: any) => ({
        id: pc.profiles?.id,
        name: pc.profiles?.name || "Unknown",
        slug: pc.profiles?.slug || "",
        bio: pc.profiles?.short_description || null,
        image_url: pc.profiles?.media_assets?.url || null,
        primary_lifeline_id: null,
        lifeline_title: null,
      })).filter(p => p.id);
    },
    enabled: !!collection?.id,
  });

  // Create profile mutation
  const createMutation = useMutation({
    mutationFn: async (data: { name: string; bio: string; image_url: string }) => {
      const profileSlug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      // First create the profile
      const { data: newProfile, error: profileError } = await supabase
        .from("profiles")
        .insert({
          name: data.name,
          slug: profileSlug,
          short_description: data.bio || "No description",
          reality_status: "real",
          subject_type: "person",
          status: "published",
        })
        .select("id")
        .single();

      if (profileError) throw profileError;

      // Then link it to the collection
      const { error: linkError } = await supabase
        .from("profile_collections")
        .insert({
          profile_id: newProfile.id,
          collection_id: collection!.id,
        });

      if (linkError) throw linkError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manage-profiles"] });
      toast.success("Profile created");
      resetForm();
    },
    onError: () => {
      toast.error("Failed to create profile");
    },
  });

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; bio: string; image_url: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: data.name,
          short_description: data.bio || null,
        })
        .eq("id", data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manage-profiles"] });
      toast.success("Profile updated");
      resetForm();
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });

  // Delete profile mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manage-profiles"] });
      toast.success("Profile deleted");
    },
    onError: () => {
      toast.error("Failed to delete profile");
    },
  });

  const resetForm = () => {
    setFormName("");
    setFormBio("");
    setFormImageUrl("");
    setSelectedProfile(null);
    setIsEditing(false);
    setIsCreating(false);
    setSearchParams({});
  };

  const openEdit = (profile: Profile) => {
    setSelectedProfile(profile);
    setFormName(profile.name);
    setFormBio(profile.bio || "");
    setFormImageUrl(profile.image_url || "");
    setIsEditing(true);
  };

  const handleSubmit = () => {
    if (!formName.trim()) {
      toast.error("Name is required");
      return;
    }

    if (isEditing && selectedProfile) {
      updateMutation.mutate({
        id: selectedProfile.id,
        name: formName,
        bio: formBio,
        image_url: formImageUrl,
      });
    } else {
      createMutation.mutate({
        name: formName,
        bio: formBio,
        image_url: formImageUrl,
      });
    }
  };

  const filteredProfiles = profiles?.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <CollectionManageLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Profiles</h1>
            <p className="text-muted-foreground">
              Manage profiles for this collection
            </p>
          </div>
          <Button onClick={() => setIsCreating(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Profile
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search profiles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Profiles Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profile</TableHead>
                  <TableHead>Linked Lifeline</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : filteredProfiles?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      {searchQuery ? "No profiles match your search" : "No profiles yet"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProfiles?.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={profile.image_url || undefined} alt={profile.name} />
                            <AvatarFallback>
                              <Users className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{profile.name}</div>
                            {profile.bio && (
                              <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                                {profile.bio}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {profile.lifeline_title || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(profile)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Delete this profile?")) {
                                deleteMutation.mutate(profile.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                          >
                            <a
                              href={`/public/collections/${slug}/profiles/${profile.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreating || isEditing} onOpenChange={() => resetForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Profile" : "Create Profile"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the profile details"
                : "Add a new profile to this collection"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Profile name..."
              />
            </div>

            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formBio}
                onChange={(e) => setFormBio(e.target.value)}
                placeholder="Brief bio..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="image">Image URL</Label>
              <Input
                id="image"
                value={formImageUrl}
                onChange={(e) => setFormImageUrl(e.target.value)}
                placeholder="https://..."
              />
              {formImageUrl && (
                <div className="mt-2">
                  <img
                    src={formImageUrl}
                    alt="Preview"
                    className="h-20 w-20 object-cover rounded"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {isEditing ? "Save Changes" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </CollectionManageLayout>
  );
}
