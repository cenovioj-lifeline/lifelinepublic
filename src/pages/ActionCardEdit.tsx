import { useState, useEffect, useRef } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Upload, Info, X } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { uploadImage } from "@/lib/storage";

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
  behavior_type: "static_url" | "context_aware" | "custom";
  static_url: string;
  behavior_description: string;
  is_implemented: boolean;
  implementation_notes: string;
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<ActionCardFormData>({
    name: "",
    slug: "",
    description: "",
    icon_name: "",
    icon_url: "",
    is_default: false,
    default_order: 0,
    status: "active",
    behavior_type: "context_aware",
    static_url: "",
    behavior_description: "",
    is_implemented: false,
    implementation_notes: "",
  });
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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
        behavior_type: (existingCard.behavior_type as ActionCardFormData["behavior_type"]) || "context_aware",
        static_url: existingCard.static_url || "",
        behavior_description: existingCard.behavior_description || "",
        is_implemented: existingCard.is_implemented || false,
        implementation_notes: existingCard.implementation_notes || "",
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

  // Handle SVG file upload
  const handleSvgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "image/svg+xml") {
      toast({
        title: "Invalid file type",
        description: "Please upload an SVG file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const { url } = await uploadImage(file, "media-uploads");
      setFormData(prev => ({ ...prev, icon_url: url, icon_name: "" }));
      toast({
        title: "Uploaded",
        description: "SVG icon uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Could not upload SVG",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (data: ActionCardFormData) => {
      const payload = {
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        icon_name: data.icon_name || null,
        icon_url: data.icon_url || null,
        is_default: data.is_default,
        default_order: data.default_order,
        status: data.status,
        behavior_type: data.behavior_type,
        static_url: data.behavior_type === "static_url" ? data.static_url : null,
        behavior_description: data.behavior_description || null,
        is_implemented: data.is_implemented,
        implementation_notes: data.implementation_notes || null,
      };

      if (isNew) {
        const { error } = await supabase.from("action_cards").insert(payload);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("action_cards")
          .update(payload)
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
    if (formData.behavior_type === "static_url" && !formData.static_url) {
      toast({
        title: "Validation Error",
        description: "Target URL is required for static URL behavior",
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
                <CardDescription>Choose a Lucide icon or upload a custom SVG</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Selected Icon</Label>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center relative">
                      {formData.icon_url ? (
                        <>
                          <img src={formData.icon_url} alt="" className="h-10 w-10" />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, icon_url: "" })}
                            className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </>
                      ) : formData.icon_name ? (
                        <DynamicIcon name={formData.icon_name} className="h-10 w-10" />
                      ) : (
                        <span className="text-muted-foreground text-xs">No icon</span>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <Input
                        value={formData.icon_name}
                        onChange={(e) => setFormData({ ...formData, icon_name: e.target.value, icon_url: "" })}
                        placeholder="Type icon name (e.g., Rss, Share2)"
                        disabled={!!formData.icon_url}
                      />
                      <div className="flex gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".svg,image/svg+xml"
                          onChange={handleSvgUpload}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {isUploading ? "Uploading..." : "Upload SVG"}
                        </Button>
                      </div>
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
                          formData.icon_name === iconName && !formData.icon_url ? "bg-primary text-primary-foreground" : ""
                        }`}
                        onClick={() => setFormData({ ...formData, icon_name: iconName, icon_url: "" })}
                        title={iconName}
                      >
                        <DynamicIcon name={iconName} className="h-5 w-5" />
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Behavior Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Behavior</CardTitle>
                <CardDescription>How this action card works when tapped</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={formData.behavior_type}
                  onValueChange={(value: ActionCardFormData["behavior_type"]) =>
                    setFormData({ ...formData, behavior_type: value })
                  }
                  className="space-y-3"
                >
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="static_url" id="static_url" className="mt-1" />
                    <div className="space-y-1">
                      <Label htmlFor="static_url" className="font-medium cursor-pointer">
                        Static URL
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Always goes to the same URL (e.g., /settings, /help)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="context_aware" id="context_aware" className="mt-1" />
                    <div className="space-y-1">
                      <Label htmlFor="context_aware" className="font-medium cursor-pointer">
                        Context-Aware (Built-in)
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Adapts based on the current collection or page
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="custom" id="custom" className="mt-1" />
                    <div className="space-y-1">
                      <Label htmlFor="custom" className="font-medium cursor-pointer">
                        Custom Implementation
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Special behavior that requires custom coding
                      </p>
                    </div>
                  </div>
                </RadioGroup>

                {/* Static URL field */}
                {formData.behavior_type === "static_url" && (
                  <div className="space-y-2 pt-4 border-t">
                    <Label htmlFor="static_url_input">Target URL *</Label>
                    <Input
                      id="static_url_input"
                      value={formData.static_url}
                      onChange={(e) => setFormData({ ...formData, static_url: e.target.value })}
                      placeholder="/settings, /help, https://external.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      Relative path for internal pages, or full URL for external links
                    </p>
                  </div>
                )}

                {/* Info boxes for context_aware and custom */}
                {formData.behavior_type === "context_aware" && (
                  <div className="pt-4 border-t">
                    <div className="flex gap-2 p-3 bg-muted rounded-lg">
                      <Info className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div className="text-sm text-muted-foreground">
                        This card uses built-in behavior that adapts to the current context.
                        Examples: Share (shares current page), Members (shows collection members).
                      </div>
                    </div>
                  </div>
                )}

                {formData.behavior_type === "custom" && (
                  <div className="pt-4 border-t">
                    <div className="flex gap-2 p-3 bg-muted rounded-lg">
                      <Info className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div className="text-sm text-muted-foreground">
                        This card requires custom code implementation. The slug "{formData.slug}" 
                        will be used to identify this card in code.
                      </div>
                    </div>
                  </div>
                )}
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

            {/* Implementation Documentation - Full width */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Implementation Documentation</CardTitle>
                <CardDescription>
                  Document how this card is implemented so the behavior isn't lost in code
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Implementation Status Toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="is_implemented">Implementation Status</Label>
                    <p className="text-xs text-muted-foreground">
                      Mark as implemented once the code is deployed and working
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-3 w-3 rounded-full ${
                          formData.is_implemented ? "bg-green-500" : "bg-amber-500"
                        }`}
                      />
                      <span className="text-sm text-muted-foreground">
                        {formData.is_implemented ? "Implemented" : "Pending"}
                      </span>
                    </div>
                    <Switch
                      id="is_implemented"
                      checked={formData.is_implemented}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_implemented: checked })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Implementation Details */}
                  <div className="space-y-2">
                    <Label htmlFor="behavior_description">Implementation Details</Label>
                    <Textarea
                      id="behavior_description"
                      value={formData.behavior_description}
                      onChange={(e) => setFormData({ ...formData, behavior_description: e.target.value })}
                      placeholder="What does this card do? What component handles it? What pages support it?"
                      rows={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      Describe the user-facing behavior. Example: "Opens StartButtonModal showing 9 categories. Desktop: split-panel. Mobile: bottom sheet accordion."
                    </p>
                  </div>

                  {/* Technical Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="implementation_notes">Technical Notes (for developers)</Label>
                    <Textarea
                      id="implementation_notes"
                      value={formData.implementation_notes}
                      onChange={(e) => setFormData({ ...formData, implementation_notes: e.target.value })}
                      placeholder="Component paths, data sources, related files..."
                      rows={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      Technical details. Example: "Component: src/components/StartButtonModal.tsx. Data: start_button_categories table."
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
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
