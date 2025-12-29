import { useState } from "react";
import { Button } from "@/components/ui/button";
import { uploadImage, deleteImage, getImageDimensions } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Loader2, Move } from "lucide-react";
import { CropBoxPicker, CropData } from "./admin/CropBoxPicker";
import { cn } from "@/lib/utils";

interface DirectImageUploadProps {
  currentImageUrl?: string;
  currentImagePath?: string;
  onUploadComplete: (url: string, path: string) => void;
  onRemove?: () => void;
  onPositionChange?: (position: { x: number; y: number }) => void;
  initialPosition?: { x: number; y: number };
  className?: string;
  label?: string;
  viewType?: "banner" | "card" | "both";
}

export function DirectImageUpload({
  currentImageUrl,
  currentImagePath,
  onUploadComplete,
  onRemove,
  onPositionChange,
  initialPosition = { x: 50, y: 50 },
  className = "",
  label = "Upload Image",
  viewType = "both",
}: DirectImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [showCropPicker, setShowCropPicker] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  // Map viewType to aspect ratio
  const getAspectRatio = () => {
    switch (viewType) {
      case "banner":
        return 4; // 4:1
      case "card":
        return 16 / 9;
      default:
        return 16 / 9; // Default for "both"
    }
  };

  // Get aspect ratio class for display
  const getAspectClass = () => {
    switch (viewType) {
      case "banner":
        return "aspect-[4/1]";
      case "card":
        return "aspect-video";
      default:
        return "aspect-video";
    }
  };

  const handleCropComplete = (crop: CropData) => {
    // Convert crop box to center position
    const centerX = crop.x + crop.width / 2;
    const centerY = crop.y + crop.height / 2;
    onPositionChange?.({ x: centerX, y: centerY });
    setShowCropPicker(false);
  };

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
      toast({
        title: "Invalid file type",
        description: "Please drop an image file.",
        variant: "destructive",
      });
      return;
    }

    await processFile(imageFile);
  };

  const processFile = async (file: File) => {

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const { url, path } = await uploadImage(file);
      onUploadComplete(url, path);
      
      toast({
        title: "Upload successful",
        description: "Image has been uploaded successfully.",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your image.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleRemove = async () => {
    if (currentImagePath && onRemove) {
      try {
        await deleteImage(currentImagePath);
        onRemove();
        toast({
          title: "Image removed",
          description: "Image has been removed successfully.",
        });
      } catch (error) {
        console.error("Delete error:", error);
        toast({
          title: "Error",
          description: "Failed to delete image.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className={className}>
      {currentImageUrl ? (
        <div className="space-y-2">
          <div className={cn("relative rounded-lg overflow-hidden border", getAspectClass())}>
            <img
              src={currentImageUrl}
              alt="Uploaded"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2 flex gap-2">
              {onPositionChange && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowCropPicker(true)}
                >
                  <Move className="h-4 w-4" />
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {uploading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </div>
          )}
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors",
            getAspectClass(),
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          )}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
            id={`image-upload-${viewType}`}
          />
          <label htmlFor={`image-upload-${viewType}`} className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">
                  Drag & drop or click to upload (max 10MB)
                </p>
              </div>
            )}
          </label>
        </div>
      )}

      {onPositionChange && currentImageUrl && (
        <CropBoxPicker
          imageUrl={currentImageUrl}
          open={showCropPicker}
          onOpenChange={setShowCropPicker}
          onCropComplete={handleCropComplete}
          aspectRatio={getAspectRatio()}
          title="Reposition Image"
        />
      )}
    </div>
  );
}
