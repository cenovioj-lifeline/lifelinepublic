/**
 * LifelineCoverEditor — Edit a lifeline's cover image.
 *
 * Modeled on ProfileImageEditor: self-contained, fetches its own data,
 * no parent state management for image URLs or positions.
 *
 * The parent only provides `lifelineId` and optionally a `pendingImageUrl`
 * (for the "use entry image as cover" flow in LifelineViewer).
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { CropBoxPicker, CropData } from "@/components/admin/CropBoxPicker";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil, Trash2, Upload, Loader2, ImagePlus } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { uploadImage } from "@/lib/storage";
import { cn } from "@/lib/utils";

interface LifelineCoverEditorProps {
  lifelineId: string;
  /** Optional: pre-load a new image URL (e.g. from "use entry image as cover" flow) */
  pendingImageUrl?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function LifelineCoverEditor({
  lifelineId,
  pendingImageUrl,
  open,
  onOpenChange,
  onSuccess,
}: LifelineCoverEditorProps) {
  const queryClient = useQueryClient();

  // ── Fetch fresh data from DB every time the dialog opens ──
  const { data: lifeline } = useQuery({
    queryKey: ["lifeline-cover", lifelineId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lifelines")
        .select(
          "id, cover_image_url, cover_image_path, cover_image_position_x, cover_image_position_y"
        )
        .eq("id", lifelineId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: open, // Only fetch when dialog is open
    staleTime: 0, // Always refetch when dialog opens
  });

  // ── Local state for edits (only lives while dialog is open) ──
  const [showCropPicker, setShowCropPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Pending image: either from prop (entry image flow) or from upload
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);

  // The image to show: pending upload > pending prop > DB value
  const displayUrl = uploadedUrl || pendingImageUrl || lifeline?.cover_image_url;

  // Position: if we have a new image (upload or pending), use 50/50; otherwise use DB
  const hasNewImage = !!(uploadedUrl || pendingImageUrl);
  const [editedX, setEditedX] = useState<number | null>(null);
  const [editedY, setEditedY] = useState<number | null>(null);
  const posX = editedX ?? (hasNewImage ? 50 : (lifeline?.cover_image_position_x ?? 50));
  const posY = editedY ?? (hasNewImage ? 50 : (lifeline?.cover_image_position_y ?? 50));

  // ── Reset local state when dialog opens/closes ──
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      // Reset all local state on close
      setShowCropPicker(false);
      setShowDeleteConfirm(false);
      setShowUpload(false);
      setUploadedUrl(null);
      setUploadedPath(null);
      setEditedX(null);
      setEditedY(null);
    }
    onOpenChange(nextOpen);
  };

  // ── Invalidate all relevant caches ──
  const invalidateCaches = () => {
    queryClient.invalidateQueries({ queryKey: ["lifeline-cover", lifelineId] });
    queryClient.invalidateQueries({ queryKey: ["lifeline", lifelineId] });
    queryClient.invalidateQueries({ queryKey: ["lifeline"] });
    queryClient.invalidateQueries({ queryKey: ["collection-lifelines"] });
    queryClient.invalidateQueries({ queryKey: ["collection"] });
  };

  // ── Save ──
  const handleSave = async () => {
    if (!displayUrl) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("lifelines")
        .update({
          cover_image_url: displayUrl,
          cover_image_path: uploadedPath || lifeline?.cover_image_path || null,
          cover_image_position_x: Math.round(posX),
          cover_image_position_y: Math.round(posY),
        })
        .eq("id", lifelineId);

      if (error) throw error;

      toast.success("Cover image updated");
      invalidateCaches();
      onSuccess?.();
      handleOpenChange(false);
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save cover image");
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Delete ──
  const handleDelete = async () => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("lifelines")
        .update({
          cover_image_url: null,
          cover_image_path: null,
          cover_image_position_x: null,
          cover_image_position_y: null,
          cover_image_id: null,
        })
        .eq("id", lifelineId);

      if (error) throw error;

      toast.success("Cover image removed");
      setShowDeleteConfirm(false);
      invalidateCaches();
      onSuccess?.();
      handleOpenChange(false);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to remove cover image");
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Crop complete ──
  const handleCropComplete = (crop: CropData) => {
    setEditedX(crop.x + crop.width / 2);
    setEditedY(crop.y + crop.height / 2);
    setShowCropPicker(false);
  };

  // ── Upload handlers ──
  const processFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10MB");
      return;
    }
    setUploading(true);
    try {
      const { url, path } = await uploadImage(file);
      setUploadedUrl(url);
      setUploadedPath(path);
      setEditedX(50);
      setEditedY(50);
      setShowUpload(false);
      toast.success("Image uploaded");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const imageFile = Array.from(e.dataTransfer.files).find((f) =>
      f.type.startsWith("image/")
    );
    if (!imageFile) {
      toast.error("Please drop an image file");
      return;
    }
    await processFile(imageFile);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
  };

  // ── Determine if we have unsaved changes ──
  const hasChanges =
    uploadedUrl !== null ||
    pendingImageUrl !== undefined ||
    editedX !== null ||
    editedY !== null;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Cover Image</DialogTitle>
          </DialogHeader>

          {displayUrl ? (
            <>
              {/* ── Preview: matches exactly how the site renders lifeline cards ── */}
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm font-medium">Card (16:9)</p>
                <div className="w-full aspect-video rounded-lg overflow-hidden bg-muted border-2 border-muted">
                  <img
                    src={displayUrl}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                    style={{ objectPosition: `${posX}% ${posY}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Position: {Math.round(posX)}%, {Math.round(posY)}%
                </p>

                <div className="flex gap-2 w-full">
                  <Button
                    onClick={() => setShowCropPicker(true)}
                    disabled={isProcessing}
                    size="sm"
                    className="flex-1"
                  >
                    <Pencil className="mr-2 h-3 w-3" />
                    Edit Card Crop
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUpload(true)}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    <ImagePlus className="mr-2 h-3 w-3" />
                    Change Image
                  </Button>
                </div>
              </div>

              {/* ── Delete ── */}
              <div className="border-t pt-4 mt-2">
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isProcessing}
                  variant="destructive"
                  size="sm"
                  className="w-full"
                >
                  <Trash2 className="mr-2 h-3 w-3" />
                  Delete Image
                </Button>
              </div>

              {/* ── Save / Cancel (only when there are changes) ── */}
              {hasChanges && (
                <div className="flex justify-end gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isProcessing}
                  >
                    {isProcessing ? "Saving..." : "Save"}
                  </Button>
                </div>
              )}
            </>
          ) : (
            /* ── No cover image — show upload zone ── */
            <UploadZone
              uploading={uploading}
              isDragging={isDragging}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDrop={handleDrop}
              onFileChange={handleFileChange}
              inputId="cover-editor-upload"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ── Upload overlay (when changing existing image) ── */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload New Cover Image</DialogTitle>
          </DialogHeader>
          <UploadZone
            uploading={uploading}
            isDragging={isDragging}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onDrop={handleDrop}
            onFileChange={handleFileChange}
            inputId="cover-editor-change-upload"
          />
        </DialogContent>
      </Dialog>

      {/* ── CropBoxPicker ── */}
      {displayUrl && (
        <CropBoxPicker
          imageUrl={displayUrl}
          open={showCropPicker}
          onOpenChange={setShowCropPicker}
          onCropComplete={handleCropComplete}
          aspectRatio={16 / 9}
          title="Reposition Cover Image (16:9)"
          initialPosition={{ position_x: posX, position_y: posY, scale: 1 }}
        />
      )}

      {/* ── Delete confirmation ── */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Cover Image</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the cover image from this lifeline.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ── Upload drop zone (reused in two places) ──

function UploadZone({
  uploading,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileChange,
  inputId,
}: {
  uploading: boolean;
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputId: string;
}) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-primary/50"
      )}
    >
      <input
        type="file"
        accept="image/*"
        onChange={onFileChange}
        disabled={uploading}
        className="hidden"
        id={inputId}
      />
      <label htmlFor={inputId} className="cursor-pointer">
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Drag & drop or click to upload
            </p>
            <p className="text-xs text-muted-foreground">(max 10MB)</p>
          </div>
        )}
      </label>
    </div>
  );
}
