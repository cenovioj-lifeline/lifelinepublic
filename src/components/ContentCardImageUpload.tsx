/**
 * ContentCardImageUpload Component
 *
 * Overlay component for content cards (elections, quotes, etc.) that shows
 * an upload icon when there's no image. Admin-only visibility.
 *
 * Usage:
 * <ContentCardImageUpload
 *   contentType="election"
 *   contentId={item.id}
 *   onUploadComplete={() => refetch()}
 * />
 */

import { useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { useAdminAccess } from "@/lib/useAdminAccess";
import { uploadImage } from "@/lib/storage";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DirectImageUpload } from "./DirectImageUpload";

type ContentType = "election" | "quote";

interface ContentCardImageUploadProps {
  contentType: ContentType;
  contentId: string;
  onUploadComplete?: () => void;
  className?: string;
  hasImage?: boolean; // When true, shows a subtle edit icon instead of full overlay
}

// Map content types to their database tables and image columns
const contentTypeConfig = {
  election: { table: "mock_elections" as const, imageColumn: "hero_image_url" },
  quote: { table: "collection_quotes" as const, imageColumn: "image_url" },
} satisfies Record<ContentType, { table: "mock_elections" | "collection_quotes"; imageColumn: string }>;

export function ContentCardImageUpload({
  contentType,
  contentId,
  onUploadComplete,
  className = "",
  hasImage = false,
}: ContentCardImageUploadProps) {
  const { hasAccess, loading: accessLoading } = useAdminAccess();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  // Don't render anything if not admin or still loading
  if (accessLoading || !hasAccess) {
    return null;
  }

  const config = contentTypeConfig[contentType];

  const handleUploadComplete = async (url: string, path: string) => {
    setUploading(true);
    try {
      const { error } = await supabase
        .from(config.table)
        .update({
          [config.imageColumn]: url,
          // Reset position to center for new images
          ...(contentType === "election" ? {
            hero_image_position_x: 50,
            hero_image_position_y: 50,
          } : {})
        })
        .eq("id", contentId);

      if (error) throw error;

      toast({
        title: "Image uploaded",
        description: "Card image has been updated successfully.",
      });

      setDialogOpen(false);
      onUploadComplete?.();
    } catch (error) {
      console.error("Failed to update image:", error);
      toast({
        title: "Upload failed",
        description: "Failed to save the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      {/* Clickable overlay - different styles based on whether image exists */}
      {hasImage ? (
        // Edit button for cards with existing images - subtle corner icon
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDialogOpen(true);
          }}
          className={`absolute top-2 left-2 z-10 p-2 rounded-full 
            bg-black/50 hover:bg-black/70 text-white
            opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer
            ${className}`}
          title="Change image"
        >
          <ImagePlus className="h-4 w-4" />
        </button>
      ) : (
        // Full overlay for cards without images
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDialogOpen(true);
          }}
          className={`absolute inset-0 flex flex-col items-center justify-center
            bg-black/5 hover:bg-black/10 transition-colors cursor-pointer
            group/upload ${className}`}
          title="Add image"
        >
          <div className="flex flex-col items-center gap-2 text-gray-500 group-hover/upload:text-primary transition-colors">
            <div className="p-3 rounded-full bg-white/80 shadow-xs group-hover/upload:shadow-md transition-shadow">
              <ImagePlus className="h-6 w-6" />
            </div>
            <span className="text-xs font-medium opacity-0 group-hover/upload:opacity-100 transition-opacity">
              Add Image
            </span>
          </div>
        </button>
      )}

      {/* Upload dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Card Image</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {uploading ? (
              <div className="flex flex-col items-center gap-2 py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Saving...</p>
              </div>
            ) : (
              <DirectImageUpload
                onUploadComplete={handleUploadComplete}
                label="Drop image here or click to upload"
                viewType="card"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
