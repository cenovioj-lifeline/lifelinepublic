import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, Move } from "lucide-react";
import { uploadImage } from "@/lib/storage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CropBoxPicker, CropData } from "./admin/CropBoxPicker";

interface CoverImagePickerProps {
  lifelineId: string;
  currentImageUrl?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CoverImagePicker({
  lifelineId,
  currentImageUrl,
  open,
  onOpenChange,
  onSuccess,
}: CoverImagePickerProps) {
  const [imageUrl, setImageUrl] = useState(currentImageUrl || "");
  const [imagePath, setImagePath] = useState("");
  const [x, setX] = useState(50);
  const [y, setY] = useState(50);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showCropPicker, setShowCropPicker] = useState(false);

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

    await processFile(imageFile);
  };

  const processFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10MB");
      return;
    }

    setUploading(true);
    try {
      const { url, path } = await uploadImage(file);
      setImageUrl(url);
      setImagePath(path);
      // Reset position when new image is uploaded
      setX(50);
      setY(50);
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleCropComplete = (crop: CropData) => {
    // Convert crop box to center position
    const centerX = crop.x + crop.width / 2;
    const centerY = crop.y + crop.height / 2;
    setX(centerX);
    setY(centerY);
    setShowCropPicker(false);
  };

  const handleSave = async () => {
    if (!imageUrl) {
      toast.error("Please select an image first");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("lifelines")
        .update({
          cover_image_url: imageUrl,
          cover_image_path: imagePath || null,
          cover_image_position_x: x,
          cover_image_position_y: y,
        })
        .eq("id", lifelineId);

      if (error) throw error;

      toast.success("Cover image updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save cover image");
    } finally {
      setSaving(false);
    }
  };

  const useCurrentImage = () => {
    if (currentImageUrl) {
      setImageUrl(currentImageUrl);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Set Lifeline Cover Image</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Image Upload or Display */}
            {!imageUrl ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
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
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="hidden"
                  id="cover-image-upload"
                />
                <label htmlFor="cover-image-upload" className="cursor-pointer">
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Uploading...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Drag & drop or click to upload new image
                      </p>
                      <p className="text-xs text-muted-foreground">(max 10MB)</p>
                    </div>
                  )}
                </label>
                
                {currentImageUrl && (
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={useCurrentImage}
                      disabled={uploading}
                    >
                      Use Event Image
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Preview Card View */}
                <div className="space-y-2">
                  <Label>Card Preview</Label>
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden border">
                    <img
                      src={imageUrl}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                      style={{
                        objectPosition: `${x}% ${y}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Position Control Button */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCropPicker(true)}
                  >
                    <Move className="h-4 w-4 mr-2" />
                    Adjust Position
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setImageUrl("");
                      setImagePath("");
                      setX(50);
                      setY(50);
                    }}
                  >
                    Choose Different Image
                  </Button>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!imageUrl || saving}>
              {saving ? "Saving..." : "Save Cover Image"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* CropBoxPicker for position adjustment */}
      {imageUrl && (
        <CropBoxPicker
          imageUrl={imageUrl}
          open={showCropPicker}
          onOpenChange={setShowCropPicker}
          onCropComplete={handleCropComplete}
          aspectRatio={16 / 9}
          title="Adjust Cover Image Position"
        />
      )}
    </>
  );
}
