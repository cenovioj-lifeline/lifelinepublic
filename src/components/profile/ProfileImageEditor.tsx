import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CropBoxPicker, CropData } from "@/components/admin/CropBoxPicker";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil, Trash2, Square, RectangleHorizontal } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const isLegacyImage = profile.primary_image_url && !profile.avatar_image?.id;
  
  // Helper to invalidate all relevant caches after image updates
  const invalidateProfileCaches = () => {
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    queryClient.invalidateQueries({ queryKey: ["profiles"] });
    queryClient.invalidateQueries({ queryKey: ["featuredItems"] });
    queryClient.invalidateQueries({ queryKey: ["customSectionItems"] });
    queryClient.invalidateQueries({ queryKey: ["recentProfiles"] });
    queryClient.invalidateQueries({ queryKey: ["collection"] });
  };

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
            scale: 1,
            card_position_x: 50,
            card_position_y: 50,
            card_scale: 1
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
        setShowCropPicker(true);
        toast.success("Image linked to media assets");
      } catch (error) {
        console.error("Error creating media asset:", error);
        toast.error("Failed to prepare image for repositioning");
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Already has media_assets, just open picker
      setShowCropPicker(true);
    }
  };

  // Convert crop box data to position/scale format for storage
  const handleCropComplete = async (crop: CropData) => {
    if (!currentMediaAssetId) return;

    try {
      // Convert crop box to center + scale format
      const centerX = crop.x + crop.width / 2;
      const centerY = crop.y + crop.height / 2;
      const scale = 100 / crop.width;

      // Save to the appropriate columns based on crop mode
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get positioning for avatar (1:1)
  const avatarPosition = {
    x: profile.avatar_image?.position_x ?? 50,
    y: profile.avatar_image?.position_y ?? 50,
    scale: profile.avatar_image?.scale ?? 1
  };

  // Get positioning for card (16:9)
  const cardPosition = {
    x: profile.avatar_image?.card_position_x ?? 50,
    y: profile.avatar_image?.card_position_y ?? 50,
    scale: profile.avatar_image?.card_scale ?? 1
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
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Profile Image</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="avatar" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="avatar" className="flex items-center gap-2">
                <Square className="h-4 w-4" />
                Avatar (1:1)
              </TabsTrigger>
              <TabsTrigger value="card" className="flex items-center gap-2">
                <RectangleHorizontal className="h-4 w-4" />
                Card (16:9)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="avatar" className="space-y-4">
              <div className="flex flex-col items-center gap-4 py-4">
                <Avatar className="h-32 w-32">
                  <AvatarImage 
                    src={imageUrl} 
                    alt={profile.name}
                    style={{
                      objectPosition: `${avatarPosition.x}% ${avatarPosition.y}%`,
                      transform: `scale(${avatarPosition.scale})`,
                      transformOrigin: `${avatarPosition.x}% ${avatarPosition.y}%`
                    }}
                  />
                  <AvatarFallback className="text-4xl">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="text-sm text-muted-foreground text-center">
                  <p>Position: {avatarPosition.x}%, {avatarPosition.y}%</p>
                  <p>Scale: {avatarPosition.scale.toFixed(1)}x</p>
                </div>

                <Button
                  onClick={() => handleRepositionClick('avatar')}
                  disabled={isProcessing || !imageUrl}
                  className="w-full"
                  variant="default"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Avatar Position
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="card" className="space-y-4">
              <div className="flex flex-col items-center gap-4 py-4">
                {/* 16:9 preview */}
                <div className="w-full aspect-video bg-muted rounded-lg overflow-hidden">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={profile.name}
                      className="w-full h-full object-cover"
                      style={{
                        objectPosition: `${cardPosition.x}% ${cardPosition.y}%`,
                        transform: `scale(${cardPosition.scale})`,
                        transformOrigin: `${cardPosition.x}% ${cardPosition.y}%`
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>

                <div className="text-sm text-muted-foreground text-center">
                  <p>Position: {cardPosition.x}%, {cardPosition.y}%</p>
                  <p>Scale: {cardPosition.scale.toFixed(1)}x</p>
                </div>

                <Button
                  onClick={() => handleRepositionClick('card')}
                  disabled={isProcessing || !imageUrl}
                  className="w-full"
                  variant="default"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Card Position
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="border-t pt-4">
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isProcessing || !imageUrl}
              variant="destructive"
              className="w-full"
            >
              <Trash2 className="mr-2 h-4 w-4" />
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