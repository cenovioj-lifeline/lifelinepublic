import { useState, DragEvent } from "react";
import { Profile, getInitials } from "@/types/profile";
import { CroppedImage } from "@/components/ui/CroppedImage";
import { useAdminAccess } from "@/lib/useAdminAccess";
import { uploadImage } from "@/lib/storage";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CropBoxPicker, CropData } from "@/components/admin/CropBoxPicker";
import { Upload } from "lucide-react";

interface ProfileAvatarUploadProps {
  profile: Profile & {
    avatar_image?: {
      url: string;
      alt_text?: string;
      id?: string;
      position_x?: number;
      position_y?: number;
      scale?: number;
    };
  };
  onImageUpdate?: () => void;
}

export function ProfileAvatarUpload({ profile, onImageUpdate }: ProfileAvatarUploadProps) {
  const { hasAccess } = useAdminAccess();
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showCropPicker, setShowCropPicker] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("");
  const [uploadedImageId, setUploadedImageId] = useState<string>("");

  const positionX = profile.avatar_image?.position_x ?? 50;
  const positionY = profile.avatar_image?.position_y ?? 50;
  const scale = profile.avatar_image?.scale ?? 1;

  const hasImage = Boolean(profile.avatar_image?.url || profile.primary_image_url);
  const imageUrl = profile.avatar_image?.url || profile.primary_image_url;


  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (!hasAccess || hasImage || isUploading) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    if (!hasAccess || hasImage || isUploading) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    if (!hasAccess || hasImage || isUploading) return;
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
          alt_text: `Avatar for ${profile.name}`,
          position_x: 50,
          position_y: 50,
          scale: 1
        })
        .select()
        .single();

      if (mediaError) throw mediaError;

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          avatar_image_id: mediaAsset.id,
          primary_image_url: url,
          primary_image_path: path
        })
        .eq("id", profile.id);

      if (profileError) throw profileError;

      toast({
        title: "Image uploaded",
        description: "Now position your avatar image"
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

  // Convert crop box data to position/scale format for storage
  const handleCropComplete = async (crop: CropData) => {
    try {
      // Convert crop box to center + scale format
      const centerX = crop.x + crop.width / 2;
      const centerY = crop.y + crop.height / 2;
      // Scale relative to object-cover baseline (1:1 avatar container)
      const imgRatio = crop.imageAspectRatio;
      const coverFraction = imgRatio > 1 ? 1 / imgRatio : imgRatio;
      const scale = (coverFraction * 100) / crop.width;

      // Update media_asset with new position
      const { error: mediaError } = await supabase
        .from("media_assets")
        .update({
          position_x: Math.round(centerX),
          position_y: Math.round(centerY),
          scale: Math.round(scale * 100) / 100
        })
        .eq("id", uploadedImageId);

      if (mediaError) throw mediaError;

      toast({
        title: "Position saved",
        description: "Avatar image updated successfully"
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

  return (
    <>
      <div
        className={`relative ${hasAccess && !hasImage && !isUploading ? 'cursor-pointer' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CroppedImage
          src={imageUrl || undefined}
          alt={profile.avatar_image?.alt_text || profile.name}
          centerX={positionX}
          centerY={positionY}
          scale={scale}
          className={`h-32 w-32 md:h-48 md:w-48 shrink-0 rounded-full transition-all ${
            isDragging ? 'ring-4 ring-primary scale-105' : ''
          } ${hasAccess && !hasImage ? 'ring-2 ring-dashed ring-muted-foreground/30' : ''}`}
          fallback={
            <span className="text-2xl text-gray-700">
              {getInitials(profile.name)}
            </span>
          }
          fallbackClassName="rounded-full bg-muted"
        />

        {hasAccess && !hasImage && !isUploading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {isDragging && (
              <div className="absolute inset-0 bg-primary/20 rounded-full flex items-center justify-center">
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto mb-1 text-primary" />
                  <p className="text-xs font-medium text-primary">Drop to upload</p>
                </div>
              </div>
            )}
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
            <p className="text-xs font-medium">Uploading...</p>
          </div>
        )}
      </div>

      {hasAccess && !hasImage && !isUploading && (
        <p className="text-xs text-muted-foreground text-center">
          Drag image here
        </p>
      )}

      <CropBoxPicker
        open={showCropPicker}
        onOpenChange={setShowCropPicker}
        imageUrl={uploadedImageUrl}
        onCropComplete={handleCropComplete}
        aspectRatio={1}
        title="Position Avatar Image"
      />
    </>
  );
}
