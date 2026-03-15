import { useState } from "react";
import { Upload, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { uploadImage } from "@/lib/storage";
import { supabase } from "@/integrations/supabase/client";
import { CropBoxPicker, CropData } from "./admin/CropBoxPicker";
import { Button } from "./ui/button";

interface SuperFanImageUploadProps {
  entryId: string;
  onUploadComplete: () => void;
}

export function SuperFanImageUpload({ entryId, onUploadComplete }: SuperFanImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tempImage, setTempImage] = useState<{ url: string; path: string; file: File } | null>(null);
  const [showCropPicker, setShowCropPicker] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));

    if (!imageFile) {
      toast.error("Please drop an image file");
      return;
    }

    await handleImageFile(imageFile);
  };

  const handleImageFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10MB");
      return;
    }

    setUploading(true);
    try {
      const { url, path } = await uploadImage(file);
      setTempImage({ url, path, file });
      setShowCropPicker(true);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleUrlLoad = async () => {
    if (!imageUrl.trim()) {
      toast.error("Please enter an image URL");
      return;
    }

    setUploading(true);
    try {
      // Call the backend function to import the image
      const { data, error } = await supabase.functions.invoke('import-image-from-url', {
        body: {
          entryId,
          imageUrl: imageUrl.trim(),
          altText: '',
          orderIndex: 0,
          position: {
            x: 50,
            y: 50,
            scale: 1.0,
          },
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to import image');
      }

      toast.success('Image imported successfully');
      setImageUrl('');
      onUploadComplete();
    } catch (error) {
      console.error('Error loading image from URL:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load image from URL');
    } finally {
      setUploading(false);
    }
  };

  const handleCropComplete = async (crop: CropData) => {
    if (!tempImage) return;

    // Convert crop box to position/scale
    const centerX = crop.x + crop.width / 2;
    const centerY = crop.y + crop.height / 2;
    const scale = 100 / crop.width;

    setUploading(true);
    try {
      // Create media asset
      const { data: mediaAsset, error: mediaError } = await supabase
        .from("media_assets")
        .insert({
          url: tempImage.url,
          filename: tempImage.file.name,
          type: tempImage.file.type,
          position_x: Math.round(centerX),
          position_y: Math.round(centerY),
          scale: scale,
        })
        .select()
        .single();

      if (mediaError) throw mediaError;

      // Link to entry
      const { error: linkError } = await supabase
        .from("entry_media")
        .insert({
          entry_id: entryId,
          media_id: mediaAsset.id,
          order_index: 0,
        });

      if (linkError) throw linkError;

      toast.success("Image added successfully");
      setTempImage(null);
      setShowCropPicker(false);
      onUploadComplete();
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-4 transition-colors
            ${isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50'
            }
          `}
          style={{
            borderColor: isDragging 
              ? 'hsl(var(--scheme-nav-bg))' 
              : undefined,
            backgroundColor: isDragging 
              ? 'hsl(var(--scheme-cards-bg))' 
              : 'transparent'
          }}
        >
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            {uploading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'hsl(var(--scheme-cards-text))' }} />
                <p className="text-sm" style={{ color: 'hsl(var(--scheme-cards-text))' }}>
                  Uploading...
                </p>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8" style={{ color: 'hsl(var(--scheme-cards-text))' }} />
                <p className="text-sm font-medium" style={{ color: 'hsl(var(--scheme-cards-text))' }}>
                  Drag & drop an image here
                </p>
                <p className="text-xs" style={{ color: 'hsl(var(--scheme-cards-text))' }}>
                  Super Fan Quick Upload
                </p>
              </>
            )}
          </div>
        </div>

        {/* URL paste feature temporarily hidden */}
      </div>

      {tempImage && (
        <CropBoxPicker
          imageUrl={tempImage.url}
          open={showCropPicker}
          onOpenChange={setShowCropPicker}
          onCropComplete={handleCropComplete}
          aspectRatio={16 / 9}
          title="Position Your Image"
        />
      )}
    </>
  );
}

interface SuperFanImageDeleteProps {
  mediaId: string;
  entryId: string;
  onDeleteComplete: () => void;
}

export function SuperFanImageDelete({ mediaId, entryId, onDeleteComplete }: SuperFanImageDeleteProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this image?")) return;

    setDeleting(true);
    try {
      // Remove from entry_media
      const { error: unlinkError } = await supabase
        .from("entry_media")
        .delete()
        .eq("entry_id", entryId)
        .eq("media_id", mediaId);

      if (unlinkError) throw unlinkError;

      toast.success("Image removed successfully");
      onDeleteComplete();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete image");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={deleting}
      className="absolute top-2 right-2 z-10"
    >
      {deleting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </Button>
  );
}
