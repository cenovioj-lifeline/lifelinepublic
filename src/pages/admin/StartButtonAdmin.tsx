import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, Edit2, Trash2, ChevronUp, ChevronDown, Save, X, 
  ExternalLink, ArrowRight, GripVertical 
} from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Json } from "@/integrations/supabase/types";

interface CategoryLink {
  label: string;
  url: string;
  type: "internal" | "external";
}

interface StartCategory {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  icon: string | null;
  links: CategoryLink[];
  display_order: number;
  is_active: boolean;
  created_at: string;
}

// Helper to safely parse links from JSONB
const parseLinks = (linksJson: Json): CategoryLink[] => {
  if (!linksJson || !Array.isArray(linksJson)) return [];
  return linksJson.map((link: unknown) => {
    const l = link as Record<string, unknown>;
    return {
      label: String(l.label || ""),
      url: String(l.url || ""),
      type: (l.type === "external" ? "external" : "internal") as "internal" | "external",
    };
  });
};

export default function StartButtonAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<StartCategory>>({});

  // Fetch all categories
  const { data: categories, isLoading } = useQuery({
    queryKey: ["admin-start-button-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("start_button_categories")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data.map((cat) => ({
        ...cat,
        links: parseLinks(cat.links),
      })) as StartCategory[];
    },
  });

  // Toggle is_active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("start_button_categories")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-start-button-categories"] });
      queryClient.invalidateQueries({ queryKey: ["start-button-categories"] });
      toast({ title: "Updated" });
    },
  });

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: "up" | "down" }) => {
      if (!categories) return;
      
      const index = categories.findIndex((c) => c.id === id);
      if (index === -1) return;

      const swapIndex = direction === "up" ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= categories.length) return;

      const current = categories[index];
      const swap = categories[swapIndex];

      await supabase
        .from("start_button_categories")
        .update({ display_order: swap.display_order })
        .eq("id", current.id);

      await supabase
        .from("start_button_categories")
        .update({ display_order: current.display_order })
        .eq("id", swap.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-start-button-categories"] });
      queryClient.invalidateQueries({ queryKey: ["start-button-categories"] });
    },
  });

  // Save category mutation
  const saveMutation = useMutation({
    mutationFn: async (category: Partial<StartCategory> & { id: string }) => {
      const { id, ...updates } = category;
      const { error } = await supabase
        .from("start_button_categories")
        .update({
          title: updates.title,
          subtitle: updates.subtitle,
          description: updates.description,
          icon: updates.icon,
          links: updates.links as unknown as Json,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-start-button-categories"] });
      queryClient.invalidateQueries({ queryKey: ["start-button-categories"] });
      setEditingId(null);
      setEditForm({});
      toast({ title: "Category saved" });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("start_button_categories")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-start-button-categories"] });
      queryClient.invalidateQueries({ queryKey: ["start-button-categories"] });
      setDeleteId(null);
      toast({ title: "Category deleted" });
    },
  });

  // Create new category mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const maxOrder = categories?.reduce((max, c) => Math.max(max, c.display_order), 0) || 0;
      const { error } = await supabase
        .from("start_button_categories")
        .insert({
          title: "New Category",
          subtitle: null,
          description: null,
          icon: "✨",
          links: [],
          display_order: maxOrder + 1,
          is_active: false,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-start-button-categories"] });
      toast({ title: "Category created" });
    },
  });

  const startEditing = (category: StartCategory) => {
    setEditingId(category.id);
    setEditForm({
      title: category.title,
      subtitle: category.subtitle,
      description: category.description,
      icon: category.icon,
      links: [...category.links],
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSave = () => {
    if (!editingId) return;
    saveMutation.mutate({ id: editingId, ...editForm });
  };

  const addLink = () => {
    setEditForm((prev) => ({
      ...prev,
      links: [...(prev.links || []), { label: "", url: "", type: "internal" }],
    }));
  };

  const removeLink = (index: number) => {
    setEditForm((prev) => ({
      ...prev,
      links: prev.links?.filter((_, i) => i !== index) || [],
    }));
  };

  const updateLink = (index: number, field: keyof CategoryLink, value: string) => {
    setEditForm((prev) => ({
      ...prev,
      links: prev.links?.map((link, i) =>
        i === index ? { ...link, [field]: value } : link
      ) || [],
    }));
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Start Button Categories</h1>
            <p className="text-muted-foreground">
              Manage the categories shown in the Start modal on the home page
            </p>
          </div>
          <Button onClick={() => createMutation.mutate()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Categories ({categories?.length || 0})</CardTitle>
            <CardDescription>
              Drag to reorder. Active categories appear in the public modal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {categories?.map((category, index) => (
              <div
                key={category.id}
                className={`rounded-lg border transition-colors ${
                  editingId === category.id 
                    ? "border-primary bg-muted/50" 
                    : "bg-card hover:bg-muted/30"
                }`}
              >
                {/* Category Row Header */}
                <div className="flex items-center gap-3 p-4">
                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={index === 0}
                      onClick={() => reorderMutation.mutate({ id: category.id, direction: "up" })}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={index === (categories?.length || 0) - 1}
                      onClick={() => reorderMutation.mutate({ id: category.id, direction: "down" })}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Order number */}
                  <span className="text-lg font-bold text-muted-foreground w-6 text-center">
                    {index + 1}
                  </span>

                  {/* Icon */}
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-xl">
                    {category.icon || "📌"}
                  </div>

                  {/* Title and subtitle */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{category.title}</div>
                    {category.subtitle && (
                      <div className="text-sm text-muted-foreground truncate">
                        {category.subtitle}
                      </div>
                    )}
                  </div>

                  {/* Links count badge */}
                  <div className="text-sm text-muted-foreground">
                    {category.links.length} link{category.links.length !== 1 ? "s" : ""}
                  </div>

                  {/* Active toggle */}
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`active-${category.id}`} className="text-sm">
                      Active
                    </Label>
                    <Switch
                      id={`active-${category.id}`}
                      checked={category.is_active}
                      onCheckedChange={(checked) =>
                        toggleActiveMutation.mutate({ id: category.id, isActive: checked })
                      }
                    />
                  </div>

                  {/* Edit/Delete buttons */}
                  {editingId !== category.id ? (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEditing(category)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(category.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={cancelEditing}>
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-primary hover:text-primary"
                        onClick={handleSave}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Expanded Edit Form */}
                {editingId === category.id && (
                  <div className="border-t px-4 py-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-title">Title</Label>
                        <Input
                          id="edit-title"
                          value={editForm.title || ""}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, title: e.target.value }))
                          }
                          placeholder="Category title"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-subtitle">Subtitle</Label>
                        <Input
                          id="edit-subtitle"
                          value={editForm.subtitle || ""}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, subtitle: e.target.value }))
                          }
                          placeholder="Optional tagline"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-icon">Icon (emoji)</Label>
                        <Input
                          id="edit-icon"
                          value={editForm.icon || ""}
                          onChange={(e) =>
                            setEditForm((prev) => ({ ...prev, icon: e.target.value }))
                          }
                          placeholder="✨"
                          className="w-24"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-description">Description</Label>
                      <Textarea
                        id="edit-description"
                        value={editForm.description || ""}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, description: e.target.value }))
                        }
                        placeholder="Full description shown in the modal..."
                        rows={3}
                      />
                    </div>

                    {/* Links Manager */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Links / CTAs</Label>
                        <Button variant="outline" size="sm" onClick={addLink}>
                          <Plus className="mr-1 h-3 w-3" />
                          Add Link
                        </Button>
                      </div>

                      {editForm.links?.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          No links yet. Add links to create action buttons.
                        </p>
                      )}

                      <div className="space-y-2">
                        {editForm.links?.map((link, linkIndex) => (
                          <div
                            key={linkIndex}
                            className="flex items-center gap-2 p-2 rounded border bg-background"
                          >
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            <Input
                              value={link.label}
                              onChange={(e) =>
                                updateLink(linkIndex, "label", e.target.value)
                              }
                              placeholder="Button label"
                              className="flex-1"
                            />
                            <Input
                              value={link.url}
                              onChange={(e) =>
                                updateLink(linkIndex, "url", e.target.value)
                              }
                              placeholder="/path or https://..."
                              className="flex-1"
                            />
                            <Select
                              value={link.type}
                              onValueChange={(value) =>
                                updateLink(linkIndex, "type", value)
                              }
                            >
                              <SelectTrigger className="w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="internal">
                                  <span className="flex items-center gap-1">
                                    <ArrowRight className="h-3 w-3" />
                                    Internal
                                  </span>
                                </SelectItem>
                                <SelectItem value="external">
                                  <span className="flex items-center gap-1">
                                    <ExternalLink className="h-3 w-3" />
                                    External
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => removeLink(linkIndex)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" onClick={cancelEditing}>
                        Cancel
                      </Button>
                      <Button onClick={handleSave}>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {categories?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No categories yet. Click "Add Category" to create one.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
