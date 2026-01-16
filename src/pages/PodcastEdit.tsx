import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function PodcastEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isNew = id === "new";

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [season, setSeason] = useState("");
  const [podcastUrl, setPodcastUrl] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [status, setStatus] = useState("draft");

  // Fetch collections for dropdown
  const { data: collections } = useQuery({
    queryKey: ["collections-dropdown"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("id, title")
        .order("title");
      if (error) throw error;
      return data;
    },
  });

  // Fetch profiles for dropdown
  const { data: profiles } = useQuery({
    queryKey: ["profiles-dropdown"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch podcast if editing
  const { data: podcast, isLoading } = useQuery({
    queryKey: ["podcast", id],
    queryFn: async () => {
      if (isNew) return null;
      const { data, error } = await supabase
        .from("podcasts")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !isNew,
  });

  // Populate form when podcast loads
  useEffect(() => {
    if (podcast) {
      setTitle(podcast.title);
      setSlug(podcast.slug);
      setSeason(podcast.season || "");
      setPodcastUrl(podcast.podcast_url || "");
      setDescription(podcast.description || "");
      setThumbnailUrl(podcast.thumbnail_url || "");
      setCollectionId(podcast.collection_id);
      setProfileId(podcast.profile_id);
      setStatus(podcast.status || "draft");
    }
  }, [podcast]);

  // Auto-generate slug from title
  useEffect(() => {
    if (isNew && title && !slug) {
      setSlug(generateSlug(title));
    }
  }, [title, isNew, slug]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        title,
        slug,
        season: season || null,
        podcast_url: podcastUrl || null,
        description: description || null,
        thumbnail_url: thumbnailUrl || null,
        collection_id: collectionId,
        profile_id: profileId,
        status,
        updated_at: new Date().toISOString(),
      };

      if (isNew) {
        const { error } = await supabase.from("podcasts").insert(data);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("podcasts").update(data).eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-media"] });
      toast({ title: "Saved", description: "Podcast saved successfully" });
      navigate("/media");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save podcast",
        variant: "destructive",
      });
    },
  });

  if (!isNew && isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/media")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isNew ? "Add New Podcast" : "Edit Podcast"}
          </h1>
          <p className="text-muted-foreground">
            {isNew ? "Create a new podcast entry" : `Editing: ${podcast?.title}`}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Podcast Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Podcast title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="podcast-slug"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="season">Season</Label>
              <Input
                id="season"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                placeholder="e.g., 1, 2, or Season Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="podcast_url">Podcast URL</Label>
              <Input
                id="podcast_url"
                value={podcastUrl}
                onChange={(e) => setPodcastUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Podcast description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
            <Input
              id="thumbnail_url"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="collection">Collection (optional)</Label>
              <Select
                value={collectionId || "none"}
                onValueChange={(v) => setCollectionId(v === "none" ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select collection" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {collections?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile">Profile (optional)</Label>
              <Select
                value={profileId || "none"}
                onValueChange={(v) => setProfileId(v === "none" ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select profile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {profiles?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!title || !slug || saveMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? "Saving..." : "Save Podcast"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
