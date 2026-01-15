import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DirectImageUpload } from "@/components/DirectImageUpload";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PageLayoutItemWithContent } from "@/types/pageLayout";
import { itemTypeLabels } from "@/types/pageLayout";

interface EditCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: PageLayoutItemWithContent | null;
}

export function EditCardModal({ open, onOpenChange, item }: EditCardModalProps) {
  const queryClient = useQueryClient();
  
  // Form state for custom link cards
  const [customTitle, setCustomTitle] = useState("");
  const [customSubtitle, setCustomSubtitle] = useState("");
  const [customLink, setCustomLink] = useState("");
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [customImagePath, setCustomImagePath] = useState("");
  const [imagePositionX, setImagePositionX] = useState(50);
  const [imagePositionY, setImagePositionY] = useState(50);

  // Reset form when item changes
  useEffect(() => {
    if (item && item.item_type === "custom_link") {
      setCustomTitle(item.custom_title || "");
      setCustomSubtitle(item.custom_subtitle || "");
      setCustomLink(item.custom_link || "");
      setCustomImageUrl(item.custom_image_url || "");
      setImagePositionX((item as any).custom_image_position_x ?? 50);
      setImagePositionY((item as any).custom_image_position_y ?? 50);
    }
  }, [item]);

  const updateMutation = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      if (!item) throw new Error("No item to update");
      
      const { error } = await supabase
        .from("page_layout_items")
        .update(updates)
        .eq("id", item.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["page-layout-items"] });
      queryClient.invalidateQueries({ queryKey: ["page-layout-content"] });
      toast({ title: "Card updated", description: "Your changes have been saved." });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!item) return;

    if (item.item_type === "custom_link") {
      if (!customTitle.trim() || !customLink.trim()) {
        toast({
          title: "Missing required fields",
          description: "Title and Link are required.",
          variant: "destructive",
        });
        return;
      }

      updateMutation.mutate({
        custom_title: customTitle.trim(),
        custom_subtitle: customSubtitle.trim() || null,
        custom_link: customLink.trim(),
        custom_image_url: customImageUrl || null,
        custom_image_position_x: imagePositionX,
        custom_image_position_y: imagePositionY,
      });
    }
  };

  const handleImageUpload = (url: string, path: string) => {
    setCustomImageUrl(url);
    setCustomImagePath(path);
  };

  const handleImageRemove = () => {
    setCustomImageUrl("");
    setCustomImagePath("");
  };

  const handlePositionChange = (pos: { x: number; y: number }) => {
    setImagePositionX(Math.round(pos.x));
    setImagePositionY(Math.round(pos.y));
  };

  if (!item) return null;

  const isCustomLink = item.item_type === "custom_link";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Edit {itemTypeLabels[item.item_type] || "Card"}
          </DialogTitle>
        </DialogHeader>

        {isCustomLink ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Card title"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-subtitle">Subtitle</Label>
              <Input
                id="edit-subtitle"
                value={customSubtitle}
                onChange={(e) => setCustomSubtitle(e.target.value)}
                placeholder="Optional subtitle"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-link">Route/URL *</Label>
              <Input
                id="edit-link"
                value={customLink}
                onChange={(e) => setCustomLink(e.target.value)}
                placeholder="/public/collections/my-collection/pitch"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Image</Label>
              <DirectImageUpload
                currentImageUrl={customImageUrl}
                currentImagePath={customImagePath}
                onUploadComplete={handleImageUpload}
                onRemove={handleImageRemove}
                onPositionChange={handlePositionChange}
                initialPosition={{ x: imagePositionX, y: imagePositionY }}
                viewType="card"
                label="Upload card image"
              />
            </div>
          </div>
        ) : (
          <div className="py-4 text-center text-muted-foreground">
            <p className="mb-2">
              This is a <strong>{itemTypeLabels[item.item_type]}</strong> card.
            </p>
            <p className="text-sm">
              To edit its content, go to the {itemTypeLabels[item.item_type]} editor.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {isCustomLink && (
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
