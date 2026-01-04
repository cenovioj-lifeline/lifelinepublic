import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CollectionManageLayout } from "@/components/manage/CollectionManageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";

export default function CollectionManageSettings() {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [quotesEnabled, setQuotesEnabled] = useState(true);
  const [mediaEnabled, setMediaEnabled] = useState(false);

  // Fetch collection
  const { data: collection, isLoading } = useQuery({
    queryKey: ["manage-collection-settings", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Populate form when collection loads
  useEffect(() => {
    if (collection) {
      setTitle(collection.title || "");
      setDescription(collection.description || "");
      setCoverImageUrl(collection.cover_image_url || "");
      setQuotesEnabled(collection.quotes_enabled ?? true);
      setMediaEnabled(collection.media_enabled ?? false);
    }
  }, [collection]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("collections")
        .update({
          title,
          description: description || null,
          cover_image_url: coverImageUrl || null,
          quotes_enabled: quotesEnabled,
          media_enabled: mediaEnabled,
        })
        .eq("id", collection!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manage-collection-settings"] });
      queryClient.invalidateQueries({ queryKey: ["manage-collection"] });
      toast.success("Settings saved");
    },
    onError: () => {
      toast.error("Failed to save settings");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    updateMutation.mutate();
  };

  if (isLoading) {
    return (
      <CollectionManageLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </CollectionManageLayout>
    );
  }

  return (
    <CollectionManageLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure collection settings
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Core details about your collection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Collection title"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the collection"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="cover">Cover Image URL</Label>
                <Input
                  id="cover"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="https://..."
                />
                {coverImageUrl && (
                  <div className="mt-2">
                    <img
                      src={coverImageUrl}
                      alt="Cover preview"
                      className="h-32 w-auto object-cover rounded"
                      onError={(e) => (e.currentTarget.style.display = "none")}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
              <CardDescription>Enable or disable collection features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Quotes</Label>
                  <p className="text-sm text-muted-foreground">
                    Show random quotes from this collection
                  </p>
                </div>
                <Switch
                  checked={quotesEnabled}
                  onCheckedChange={setQuotesEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Media Section</Label>
                  <p className="text-sm text-muted-foreground">
                    Show Media tab instead of Awards in navigation
                  </p>
                </div>
                <Switch
                  checked={mediaEnabled}
                  onCheckedChange={setMediaEnabled}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={updateMutation.isPending} className="gap-2">
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Settings
            </Button>
          </div>
        </form>
      </div>
    </CollectionManageLayout>
  );
}
