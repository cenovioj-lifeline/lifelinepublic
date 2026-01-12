import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import * as LucideIcons from "lucide-react";

// Common icons to show first
const COMMON_ICONS = [
  "Rss", "Share2", "Users", "Settings", "Home", "Star", "Heart", "Bell",
  "Mail", "Search", "Plus", "Edit", "Trash2", "Check", "X", "Info",
  "AlertCircle", "HelpCircle", "MessageSquare", "Send", "Link", "ExternalLink",
  "Download", "Upload", "Image", "Video", "Music", "File", "Folder",
  "Calendar", "Clock", "MapPin", "Phone", "Globe", "Lock", "Unlock",
  "Eye", "EyeOff", "Filter", "List", "Grid", "Menu", "MoreHorizontal"
];

// Dynamic icon component
const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
  const Icon = (LucideIcons as any)[name];
  if (!Icon) return null;
  return <Icon className={className} />;
};

interface ActionCardFormData {
  name: string;
  slug: string;
  description: string;
  icon_name: string;
  icon_url: string;
  is_default: boolean;
  default_order: number;
  status: string;
}

const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
};

export default function ActionCardEdit() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<ActionCardFormData>({
    name: "",
    slug: "",
    description: "",
    icon_name: "",
    icon_url: "",
    is_default: false,
    default_order: 0,
    status: "active",
  });
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  // Fetch existing card if editing
  const { data: existingCard, isLoading } = useQuery({
    queryKey: ["action-card", id],
    queryFn: async () => {
      if (isNew) return null;
      const { data, error } = await supabase
        .from("action_cards")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !isNew,
  });

  // Populate form when editing
  useEffect(() => {
    if (existingCard) {
      setFormData({
        name: existingCard.name || "",
        slug: existingCard.slug || "",
        description: existingCard.description || "",
        icon_name: existingCard.icon_name || "",
        icon_url: existingCard.icon_url || "",
        is_default: existingCard.is_default || false,
        default_order: existingCard.default_order || 0,
        status: existingCard.status || "active",
      });
      setSlugManuallyEdited(true); // Don't auto-generate slug for existing cards
    }
  }, [existingCard]);

  // Auto-generate slug from name
  useEffect(() => {
    if (!slugManuallyEdited && formData.name) {
      setFormData(prev => ({ ...prev, slug: generateSlug(prev.name) }));
    }
  }, [formData.name, slugManuallyEdited]);

  const saveMutation = useMutation({
    mutationFn: async (data: ActionCardFormData) => {
      if (isNew) {
        const { error } = await supabase.from("action_cards").insert({
          name: data.name,
          slug: data.slug,
          description: data.description || null,
          icon_name: data.icon_name || null,
          icon_url: data.icon_url || null,
          is_default: data.is_default,
          default_order: data.default_order,
          status: data.status,
          is_implemented: false,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("action_cards")
          .update({
            name: data.name,
            slug: data.slug,
            description: data.description || null,
            icon_name: data.icon_name || null,
            icon_url: data.icon_url || null,
            is_default: data.is_default,
            default_order: data.default_order,
            status: data.status,
          })
          .eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["action-cards"] });
      queryClient.invalidateQueries({ queryKey: ["action-card", id] });
      toast({
        title: isNew ? "Created" : "Updated",
        description: `Action card has been ${isNew ? "created" : "updated"}`,
      });
      navigate("/admin/action-cards");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Could not save action card",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) {
      toast({
        title: "Validation Error",
        description: "Name and slug are required",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div>Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/action-cards")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isNew ? "New Action Card" : "Edit Action Card"}
            </h1>
            <p className="text-muted-foreground">
              {isNew
                ? "Create a new action card for collections"
                : `Editing: ${existingCard?.name}`}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Name and identifier for this action card</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Share, Members, Feed"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => {
                      setSlugManuallyEdited(true);
                      setFormData({ ...formData, slug: e.target.value });
                    }}
                    placeholder="e.g., share, members, feed"
                  />
                  <p className="text-xs text-muted-foreground">
                    Used as identifier in code. Auto-generated from name.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="What does this action card do?"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="deprecated">Deprecated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Icon Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Icon</CardTitle>
                <CardDescription>Choose an icon from Lucide or upload custom SVG</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Selected Icon</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
                      {formData.icon_url ? (
                        <img src={formData.icon_url} alt="" className="h-10 w-10" />
                      ) : formData.icon_name ? (
                        <DynamicIcon name={formData.icon_name} className="h-10 w-10" />
                      ) : (
                        <span className="text-muted-foreground text-xs">No icon</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <Input
                        value={formData.icon_name}
                        onChange={(e) => setFormData({ ...formData, icon_name: e.target.value })}
                        placeholder="Type icon name (e.g., Rss, Share2)"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Common Icons</Label>
                  <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto p-2 border rounded">
                    {COMMON_ICONS.map((iconName) => (
                      <button
                        key={iconName}
                        type="button"
                        className={`h-10 w-10 rounded flex items-center justify-center hover:bg-muted transition-colors ${
                          formData.icon_name === iconName ? "bg-primary text-primary-foreground" : ""
                        }`}
                        onClick={() => setFormData({ ...formData, icon_name: iconName, icon_url: "" })}
                        title={iconName}
                      >
                        <DynamicIcon name={iconName} className="h-5 w-5" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="icon_url">Custom Icon URL (optional)</Label>
                  <Input
                    id="icon_url"
                    value={formData.icon_url}
                    onChange={(e) => setFormData({ ...formData, icon_url: e.target.value })}
                    placeholder="https://... (SVG URL)"
                  />
                  <p className="text-xs text-muted-foreground">
                    If set, this URL will be used instead of the Lucide icon
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Default Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Default Behavior</CardTitle>
                <CardDescription>
                  Configure if this card appears by default on all collections
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="is_default">Include in Defaults</Label>
                    <p className="text-xs text-muted-foreground">
                      Show this card on collections without custom card assignments
                    </p>
                  </div>
                  <Switch
                    id="is_default"
                    checked={formData.is_default}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_default: checked })
                    }
                  />
                </div>

                {formData.is_default && (
                  <div className="space-y-2">
                    <Label htmlFor="default_order">Default Order</Label>
                    <Input
                      id="default_order"
                      type="number"
                      min={1}
                      max={10}
                      value={formData.default_order}
                      onChange={(e) =>
                        setFormData({ ...formData, default_order: parseInt(e.target.value) || 0 })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Position in the default card lineup (1 = leftmost)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Implementation Info */}
            {!isNew && existingCard && (
              <Card>
                <CardHeader>
                  <CardTitle>Implementation Status</CardTitle>
                  <CardDescription>
                    Status of the card's functionality (managed by Claude Code)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        existingCard.is_implemented ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    <span>
                      {existingCard.is_implemented ? "Implemented" : "Not Implemented"}
                    </span>
                  </div>

                  {!existingCard.is_implemented && (
                    <p className="text-sm text-muted-foreground italic">
                      Work with Claude Code to implement this action card's behavior.
                      The slug "{formData.slug}" will be used to identify this card in code.
                    </p>
                  )}

                  {existingCard.is_implemented && existingCard.implementation_notes && (
                    <div className="space-y-2">
                      <Label>Implementation Notes</Label>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                        {existingCard.implementation_notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/action-cards")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {saveMutation.isPending ? "Saving..." : isNew ? "Create" : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
