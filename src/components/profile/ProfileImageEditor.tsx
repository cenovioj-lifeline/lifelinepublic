import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CropBoxPicker, CropData } from "@/components/admin/CropBoxPicker";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil, Trash2, Sparkles } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface ProfileImageEditorProps {
  profile: {
    id: string;
    name: string;
    avatar_image?: {
      url: string;
      id?: string;
      position_x?: number;
      position_y?: number;
      scale?: number;
      card_position_x?: number;
      card_position_y?: number;
      card_scale?: number;
      extended_data?: {
        widened_url?: string;
        [key: string]: unknown;
      };
    };
    primary_image_url?: string;
    primary_image_path?: string;
  };
  onImageUpdate?: () => void;
}

type CropMode = 'avatar' | 'card';

export function ProfileImageEditor({ profile, onImageUpdate }: ProfileImageEditorProps) {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCropPicker, setShowCropPicker] = useState(false);
  const [cropMode, setCropMode] = useState<CropMode>('avatar');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentMediaAssetId, setCurrentMediaAssetId] = useState<string | undefined>(
    profile.avatar_image?.id
  );

  const imageUrl = profile.avatar_image?.url || profile.primary_image_url;
  const widenedUrl = profile.avatar_image?.extended_data?.widened_url;
  const isLegacyImage = profile.primary_image_url && !profile.avatar_image?.id;

  const invalidateProfileCaches = () => {
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    queryClient.invalidateQueries({ queryKey: ["profiles"] });
    queryClient.invalidateQueries({ queryKey: ["collection-featured-items"] });
    queryClient.invalidateQueries({ queryKey: ["collection-custom-section-items"] });
    queryClient.invalidateQueries({ queryKey: ["collection-recent-profiles"] });
    queryClient.invalidateQueries({ queryKey: ["collection-profiles"] });
    queryClient.invalidateQueries({ queryKey: ["public-profiles"] });
    queryClient.invalidateQueries({ queryKey: ["profile-data"] });
    queryClient.invalidateQueries({ queryKey: ["collection"] });
  };

  const handleDelete = async () => {
    setIsProcessing(true);
    try {
      if (profile.avatar_image?.id) {
        const { error: mediaError } = await supabase
          .from("media_assets")
          .delete()
          .eq("id", profile.avatar_image.id);
        if (mediaError) throw mediaError;
      }

      if (profile.primary_image_path) {
        const { error: storageError } = await supabase.storage
          .from("media-uploads")
          .remove([profile.primary_image_path]);
        if (storageError) console.warn("Storage deletion failed:", storageError);
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          avatar_image_id: null,
          primary_image_url: null,
          primary_image_path: null
        })
        .eq("id", profile.id);
      if (profileError) throw profileError;

      toast.success("Image deleted successfully");
      setShowDeleteConfirm(false);
      setShowDialog(false);
      invalidateProfileCaches();
      onImageUpdate?.();
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("Failed to delete image");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRepositionClick = async (mode: CropMode) => {
    setCropMode(mode);

    if (isLegacyImage) {
      setIsProcessing(true);
      try {
        const filename = profile.primary_image_path ||
          profile.primary_image_url!.split('/').pop() ||
          'avatar.jpg';

        const { data: mediaAsset, error: insertError } = await supabase
          .from("media_assets")
          .insert({
            url: profile.primary_image_url!,
            filename: filename,
            type: "image",
            alt_text: `Avatar for ${profile.name}`,
            position_x: 50,
            position_y: 50,
            scale: 1,
            card_position_x: 50,
            card_position_y: 50,
            card_scale: 1
          })
          .select()
          .single();
        if (insertError) throw insertError;

        const { error: updateError } = await supabase
          .from("profiles")
          .update({ avatar_image_id: mediaAsset.id })
          .eq("id", profile.id);
        if (updateError) throw updateError;

        setCurrentMediaAssetId(mediaAsset.id);
        setShowCropPicker(true);
        toast.success("Image linked to media assets");
      } catch (error) {
        console.error("Error creating media asset:", error);
        toast.error("Failed to prepare image for repositioning");
      } finally {
        setIsProcessing(false);
      }
    } else {
      setShowCropPicker(true);
    }
  };

  const handleCropComplete = async (crop: CropData) => {
    if (!currentMediaAssetId) return;

    try {
      const centerX = crop.x + crop.width / 2;
      const centerY = crop.y + crop.height / 2;
      const scale = 100 / crop.width;

      const updateData = cropMode === 'avatar'
        ? {
            position_x: Math.round(centerX),
            position_y: Math.round(centerY),
            scale: Math.round(scale * 100) / 100
          }
        : {
            card_position_x: Math.round(centerX),
            card_position_y: Math.round(centerY),
            card_scale: Math.round(scale * 100) / 100
          };

      const { error } = await supabase
        .from("media_assets")
        .update(updateData)
        .eq("id", currentMediaAssetId);
      if (error) throw error;

      toast.success(`${cropMode === 'avatar' ? 'Avatar' : 'Card'} position updated`);
      setShowCropPicker(false);
      setShowDialog(false);
      invalidateProfileCaches();
      onImageUpdate?.();
    } catch (error) {
      console.error("Error updating position:", error);
      toast.error("Failed to update image position");
    }
  };

  const avatarPosition = {
    x: profile.avatar_image?.position_x ?? 50,
    y: profile.avatar_image?.position_y ?? 50,
    scale: profile.avatar_image?.scale ?? 1
  };

  const cardPosition = {
    x: profile.avatar_image?.card_position_x ?? 50,
    y: profile.avatar_image?.card_position_y ?? 50,
    scale: profile.avatar_image?.card_scale ?? 1
  };

  const getImageStyle = (pos: { x: number; y: number; scale: number }): React.CSSProperties => ({
    objectFit: 'cover' as const,
    objectPosition: `${pos.x}% ${pos.y}%`,
    transform: `scale(${pos.scale})`,
    transformOrigin: `${pos.x}% ${pos.y}%`,
    width: '100%',
    height: '100%',
  });

  if (!imageUrl) {
    return (
      <Button variant="outline" size="sm" className="text-xs" disabled>
        No Image
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDialog(true)}
        className="text-xs"
      >
        Edit Image
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Profile Image</DialogTitle>
          </DialogHeader>

          {/* Side-by-side previews */}
          <div className="grid grid-cols-2 gap-6">
            {/* Avatar (1:1) */}
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm font-medium">Avatar (1:1)</p>
              <div className="w-40 h-40 rounded-full overflow-hidden bg-muted border-2 border-muted">
                <img
                  src={imageUrl}
                  alt={profile.name}
                  style={getImageStyle(avatarPosition)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Position: {avatarPosition.x}%, {avatarPosition.y}% · Scale: {avatarPosition.scale.toFixed(1)}x
              </p>
              <Button
                onClick={() => handleRepositionClick('avatar')}
                disabled={isProcessing}
                size="sm"
                className="w-full"
              >
                <Pencil className="mr-2 h-3 w-3" />
                Edit Avatar
              </Button>
            </div>

            {/* Card (16:9) */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">Card (16:9)</p>
                {widenedUrl && (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    <Sparkles className="h-3 w-3" />
                    AI Widened
                  </span>
                )}
              </div>

              {/* Show widened version if available, otherwise show card crop */}
              <div className="w-full aspect-video rounded-lg overflow-hidden bg-muted border-2 border-muted">
                {widenedUrl ? (
                  <img
                    src={widenedUrl}
                    alt={`${profile.name} (card)`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={imageUrl}
                    alt={`${profile.name} (card)`}
                    style={getImageStyle(cardPosition)}
                  />
                )}
              </div>

              {/* If widened exists, also show the original card crop smaller for reference */}
              {widenedUrl && (
                <div className="w-full">
                  <p className="text-xs text-muted-foreground mb-1">Original crop (fallback):</p>
                  <div className="w-2/3 mx-auto aspect-video rounded overflow-hidden bg-muted border border-muted">
                    <img
                      src={imageUrl}
                      alt={`${profile.name} (original crop)`}
                      style={getImageStyle(cardPosition)}
                    />
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Position: {cardPosition.x}%, {cardPosition.y}% · Scale: {cardPosition.scale.toFixed(1)}x
              </p>
              <Button
                onClick={() => handleRepositionClick('card')}
                disabled={isProcessing}
                size="sm"
                className="w-full"
              >
                <Pencil className="mr-2 h-3 w-3" />
                Edit Card Crop
              </Button>
            </div>
          </div>

          {/* Delete */}
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
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this profile image? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showCropPicker && imageUrl && (
        <CropBoxPicker
          imageUrl={imageUrl}
          open={showCropPicker}
          onOpenChange={setShowCropPicker}
          onCropComplete={handleCropComplete}
          aspectRatio={cropMode === 'avatar' ? 1 : 16/9}
          title={cropMode === 'avatar' ? "Reposition Avatar (1:1)" : "Reposition Card Image (16:9)"}
        />
      )}
    </>
  );
}
