import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ImagePositionPicker } from "@/components/ImagePositionPicker";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

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
    };
    primary_image_url?: string;
    primary_image_path?: string;
  };
  onImageUpdate?: () => void;
}

export function ProfileImageEditor({ profile, onImageUpdate }: ProfileImageEditorProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPositionPicker, setShowPositionPicker] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentMediaAssetId, setCurrentMediaAssetId] = useState<string | undefined>(
    profile.avatar_image?.id
  );

  const imageUrl = profile.avatar_image?.url || profile.primary_image_url;
  const isLegacyImage = profile.primary_image_url && !profile.avatar_image?.id;

  const handleDelete = async () => {
    setIsProcessing(true);
    try {
      // Delete media_asset if it exists
      if (profile.avatar_image?.id) {
        const { error: mediaError } = await supabase
          .from("media_assets")
          .delete()
          .eq("id", profile.avatar_image.id);

        if (mediaError) throw mediaError;
      }

      // Delete from storage if path exists
      if (profile.primary_image_path) {
        const { error: storageError } = await supabase.storage
          .from("media-uploads")
          .remove([profile.primary_image_path]);

        if (storageError) console.warn("Storage deletion failed:", storageError);
      }

      // Clear all profile image fields
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
      onImageUpdate?.();
    } catch (error) {
      console.error("Error deleting image:", error);
      toast.error("Failed to delete image");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRepositionClick = async () => {
    if (isLegacyImage) {
      // Create media_assets record for legacy image
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
            scale: 1
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Link to profile
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ avatar_image_id: mediaAsset.id })
          .eq("id", profile.id);

        if (updateError) throw updateError;

        setCurrentMediaAssetId(mediaAsset.id);
        setShowPositionPicker(true);
        toast.success("Image linked to media assets");
      } catch (error) {
        console.error("Error creating media asset:", error);
        toast.error("Failed to prepare image for repositioning");
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Already has media_assets, just open picker
      setShowPositionPicker(true);
    }
  };

  const handlePositionChange = async (position: { x: number; y: number; scale: number }) => {
    if (!currentMediaAssetId) return;

    try {
      const { error } = await supabase
        .from("media_assets")
        .update({
          position_x: position.x,
          position_y: position.y,
          scale: position.scale
        })
        .eq("id", currentMediaAssetId);

      if (error) throw error;

      toast.success("Image position updated");
      setShowPositionPicker(false);
      setShowDialog(false);
      onImageUpdate?.();
    } catch (error) {
      console.error("Error updating position:", error);
      toast.error("Failed to update image position");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile Image</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-6 py-4">
            <Avatar className="h-32 w-32">
              <AvatarImage 
                src={imageUrl} 
                alt={profile.name}
                style={{
                  objectPosition: `${profile.avatar_image?.position_x ?? 50}% ${profile.avatar_image?.position_y ?? 50}%`,
                  transform: `scale(${profile.avatar_image?.scale ?? 1})`,
                  transformOrigin: `${profile.avatar_image?.position_x ?? 50}% ${profile.avatar_image?.position_y ?? 50}%`
                }}
              />
              <AvatarFallback className="text-4xl">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>

            {profile.avatar_image && (
              <div className="text-sm text-muted-foreground text-center">
                <p>Position: {profile.avatar_image.position_x ?? 50}%, {profile.avatar_image.position_y ?? 50}%</p>
                <p>Scale: {(profile.avatar_image.scale ?? 1).toFixed(1)}x</p>
              </div>
            )}

            <div className="flex gap-3 w-full">
              <Button
                onClick={handleRepositionClick}
                disabled={isProcessing}
                className="flex-1"
                variant="default"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Reposition
              </Button>
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isProcessing}
                variant="destructive"
                className="flex-1"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
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

      {showPositionPicker && imageUrl && (
        <ImagePositionPicker
          imageUrl={imageUrl}
          initialPosition={{
            x: profile.avatar_image?.position_x ?? 50,
            y: profile.avatar_image?.position_y ?? 50,
            scale: profile.avatar_image?.scale ?? 1
          }}
          onPositionChange={handlePositionChange}
          open={showPositionPicker}
          onOpenChange={setShowPositionPicker}
          viewType="avatar"
          title="Reposition Avatar"
        />
      )}
    </>
  );
}
