/**
 * BookCoverUpload
 *
 * Drag-and-drop upload component for book cover images.
 * Uploads to Supabase storage, creates media_asset record,
 * and opens CropBoxPicker for positioning.
 */

import { useState, DragEvent } from "react";
import { useAdminAccess } from "@/lib/useAdminAccess";
import { uploadImage } from "@/lib/storage";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CropBoxPicker, CropData } from "@/components/admin/CropBoxPicker";
import { Upload, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BookCoverUploadProps {
  book: {
    id: string;
    title: string;
    authorName: string;
    coverImageUrl?: string | null;
    coverImageId?: string | null;
    cover_image?: {
      id: string;
      url: string;
      alt_text?: string;
      position_x?: number;
      position_y?: number;
      scale?: number;
    };
  };
  onImageUpdate?: () => void;
}

export function BookCoverUpload({ book, onImageUpdate }: BookCoverUploadProps) {
  const { hasAccess } = useAdminAccess();
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showCropPicker, setShowCropPicker] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const [uploadedImageId, setUploadedImageId] = useState<string>("");

  // Get current image data
  const coverImage = book.cover_image;
  const currentImageUrl = coverImage?.url || book.coverImageUrl;
  const positionX = coverImage?.position_x ?? 50;
  const positionY = coverImage?.position_y ?? 50;
  const scale = coverImage?.scale ?? 1;
  const hasImage = Boolean(currentImageUrl);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (!hasAccess || isUploading) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    if (!hasAccess || isUploading) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    if (!hasAccess || isUploading) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0];

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 10MB",
        variant: "destructive"
      });
      return;
    }

    await handleUpload(file);
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
      // Upload to storage
      const { url, path } = await uploadImage(file, "media-uploads");

      // Create media_asset record
      const { data: mediaAsset, error: mediaError } = await supabase
        .from("media_assets")
        .insert({
          url,
          filename: path,
          type: "image",
          alt_text: `Cover for ${book.title}`,
          position_x: 50,
          position_y: 50,
          scale: 1
        })
        .select()
        .single();

      if (mediaError) throw mediaError;

      // Update book with new cover image
      const { error: bookError } = await supabase
        .from("books")
        .update({
          cover_image_id: mediaAsset.id,
          cover_image_url: url,
          cover_image_path: path,
          updated_at: new Date().toISOString()
        })
        .eq("id", book.id);

      if (bookError) throw bookError;

      toast({
        title: "Cover uploaded",
        description: "Now position your cover image"
      });

      // Open crop picker
      setUploadedImageUrl(url);
      setUploadedImageId(mediaAsset.id);
      setShowCropPicker(true);

    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCropComplete = async (crop: CropData) => {
    const imageId = uploadedImageId || coverImage?.id;
    if (!imageId) return;

    // Convert crop box to position/scale
    const centerX = crop.x + crop.width / 2;
    const centerY = crop.y + crop.height / 2;
    // Scale relative to object-cover baseline (2:3 book cover container)
    const containerRatio = 2 / 3;
    const imgRatio = crop.imageAspectRatio;
    const coverFraction = imgRatio > containerRatio
      ? containerRatio / imgRatio : imgRatio / containerRatio;
    const newScale = (coverFraction * 100) / crop.width;

    try {
      // Update media_asset with new position
      const { error: mediaError } = await supabase
        .from("media_assets")
        .update({
          position_x: centerX,
          position_y: centerY,
          scale: newScale
        })
        .eq("id", imageId);

      if (mediaError) throw mediaError;

      toast({
        title: "Position saved",
        description: "Cover image updated successfully"
      });

      setShowCropPicker(false);
      onImageUpdate?.();

    } catch (error) {
      console.error("Position update error:", error);
      toast({
        title: "Update failed",
        description: "Failed to save position. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEditPosition = () => {
    if (coverImage?.url) {
      setUploadedImageUrl(coverImage.url);
      setUploadedImageId(coverImage.id);
      setShowCropPicker(true);
    } else if (book.coverImageUrl) {
      // Legacy URL-only cover, can't edit position without media_asset
      toast({
        title: "Cannot edit position",
        description: "Upload a new cover to enable positioning",
        variant: "default"
      });
    }
  };

  if (!hasAccess) {
    return null;
  }

  return (
    <>
      <div className="space-y-4">
        {/* Current Cover Preview */}
        {hasImage && (
          <div className="flex flex-col items-center gap-4">
            <div className="aspect-[2/3] w-48 overflow-hidden rounded-lg border shadow-md">
              <img
                src={currentImageUrl!}
                alt={`Cover of ${book.title}`}
                className="w-full h-full object-cover"
                style={{
                  objectPosition: `${positionX}% ${positionY}%`,
                  transform: `scale(${scale})`,
                  transformOrigin: `${positionX}% ${positionY}%`
                }}
              />
            </div>
            {coverImage?.id && (
              <Button variant="outline" size="sm" onClick={handleEditPosition}>
                Adjust Position
              </Button>
            )}
          </div>
        )}

        {/* Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
            isDragging 
              ? 'border-primary bg-primary/5 scale-[1.02]' 
              : 'border-muted-foreground/30 hover:border-muted-foreground/50'
          } ${hasAccess && !isUploading ? 'cursor-pointer' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
          ) : isDragging ? (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-10 w-10 text-primary" />
              <p className="font-medium text-primary">Drop to upload</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="h-16 w-12 bg-muted rounded flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">
                  {hasImage ? 'Replace cover image' : 'Upload cover image'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Drag and drop an image here (2:3 ratio recommended)
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <CropBoxPicker
        open={showCropPicker}
        onOpenChange={setShowCropPicker}
        imageUrl={uploadedImageUrl}
        onCropComplete={handleCropComplete}
        aspectRatio={2 / 3}
        title="Position Cover Image"
      />
    </>
  );
}
