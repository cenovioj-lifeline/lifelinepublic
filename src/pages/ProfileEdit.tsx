import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAdminAccess } from "@/lib/useAdminAccess";
import { ProfileSerpApiSearchModal } from "@/components/admin/ProfileSerpApiSearchModal";

export default function ProfileEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasAccess: hasAdminAccess } = useAdminAccess();
  const [showSerpModal, setShowSerpModal] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [subjectType, setSubjectType] = useState("");
  const [realityStatus, setRealityStatus] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [shortDescription, setShortDescription] = useState("");
  const [knownFor, setKnownFor] = useState("");
  const [tags, setTags] = useState("");
  const [imageQuery, setImageQuery] = useState("");

  // Fetch profile data
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["profile", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          avatar_image:media_assets(id, url)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      
      // Set form state
      if (data) {
        setName(data.name || "");
        setSlug(data.slug || "");
        setSubjectType(data.subject_type || "");
        setRealityStatus(data.reality_status || "");
        setStatus((data.status as "draft" | "published") || "draft");
        setShortDescription(data.short_description || "");
        setKnownFor(data.known_for?.join(", ") || "");
        setTags(data.tags?.join(", ") || "");
        setImageQuery(data.image_query || "");
      }

      return data;
    },
    enabled: !!id && id !== "new",
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates = {
        name: name.trim(),
        subject_type: subjectType,
        reality_status: realityStatus,
        status,
        short_description: shortDescription.trim(),
        known_for: knownFor.split(",").map(k => k.trim()).filter(Boolean),
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        image_query: imageQuery.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile saved successfully");
      queryClient.invalidateQueries({ queryKey: ["profile", id] });
      navigate("/profiles");
    },
    onError: (error) => {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile");
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!subjectType) {
      toast.error("Subject Type is required");
      return;
    }
    if (!realityStatus) {
      toast.error("Reality Status is required");
      return;
    }
    if (!shortDescription.trim()) {
      toast.error("Short Description is required");
      return;
    }
    saveMutation.mutate();
  };

  const handleImportComplete = () => {
    queryClient.invalidateQueries({ queryKey: ["profile", id] });
    setShowSerpModal(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/profiles")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Profile Not Found</h1>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">The profile could not be loaded.</p>
            <Button onClick={() => navigate("/profiles")} className="mt-4">
              Back to Profiles
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/profiles")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Edit Profile</h1>
          <p className="text-muted-foreground">{profile.name}</p>
        </div>
        {hasAdminAccess && (
          <Button
            variant="outline"
            onClick={() => setShowSerpModal(true)}
            className="bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20"
          >
            <Search className="h-4 w-4 mr-2" />
            Search Images
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Avatar */}
          {profile.avatar_image?.url && (
            <div>
              <Label>Current Avatar</Label>
              <div className="mt-2">
                <img
                  src={profile.avatar_image.url}
                  alt={profile.name}
                  className="w-32 h-32 object-cover rounded-lg border"
                />
              </div>
            </div>
          )}

          {/* Name */}
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Profile name"
            />
          </div>

          {/* Slug (read-only) */}
          <div>
            <Label htmlFor="slug">Slug (read-only)</Label>
            <Input
              id="slug"
              value={slug}
              readOnly
              className="bg-muted"
            />
          </div>

          {/* Subject Type */}
          <div>
            <Label htmlFor="subjectType">Subject Type *</Label>
            <Select value={subjectType} onValueChange={setSubjectType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="person_real">Person (Real)</SelectItem>
                <SelectItem value="person_fictional">Person (Fictional)</SelectItem>
                <SelectItem value="entity">Entity</SelectItem>
                <SelectItem value="organization">Organization</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reality Status */}
          <div>
            <Label htmlFor="realityStatus">Reality Status *</Label>
            <Select value={realityStatus} onValueChange={setRealityStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="real">Real</SelectItem>
                <SelectItem value="fictional">Fictional</SelectItem>
                <SelectItem value="conceptual">Conceptual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="status">Publication Status *</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as "draft" | "published")}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Short Description */}
          <div>
            <Label htmlFor="shortDescription">Short Description *</Label>
            <Textarea
              id="shortDescription"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Brief description of the profile"
              rows={3}
            />
          </div>

          {/* Known For */}
          <div>
            <Label htmlFor="knownFor">Known For (comma-separated)</Label>
            <Textarea
              id="knownFor"
              value={knownFor}
              onChange={(e) => setKnownFor(e.target.value)}
              placeholder="e.g., Acting, Directing, Writing"
              rows={2}
            />
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., actor, director, producer"
            />
          </div>

          {/* Image Query */}
          <div>
            <Label htmlFor="imageQuery">Image Search Query</Label>
            <Input
              id="imageQuery"
              value={imageQuery}
              onChange={(e) => setImageQuery(e.target.value)}
              placeholder="Query for SerpAPI image search"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Used when searching for profile images via SerpAPI
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/profiles")}
              disabled={saveMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SerpAPI Search Modal */}
      {hasAdminAccess && (
        <ProfileSerpApiSearchModal
          open={showSerpModal}
          onClose={() => setShowSerpModal(false)}
          profileId={profile.id}
          initialQuery={profile.image_query || profile.name}
          onImportComplete={handleImportComplete}
        />
      )}
    </div>
  );
}
