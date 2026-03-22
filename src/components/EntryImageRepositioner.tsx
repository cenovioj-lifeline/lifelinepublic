import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CropBoxPicker, CropData } from "./admin/CropBoxPicker";

interface EntryImageRepositionerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaId: string;
  imageUrl: string;
  lifelineId: string;
  initialPositionX?: number;
  initialPositionY?: number;
}

export function EntryImageRepositioner({
  open,
  onOpenChange,
  mediaId,
  imageUrl,
  lifelineId,
  initialPositionX = 50,
  initialPositionY = 50,
}: EntryImageRepositionerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (crop: CropData) => {
      // Convert crop box to center position
      const centerX = crop.x + crop.width / 2;
      const centerY = crop.y + crop.height / 2;
      // Scale relative to object-cover baseline (16:9 container)
      const containerRatio = 16 / 9;
      const imgRatio = crop.imageAspectRatio;
      const coverFraction = imgRatio > containerRatio
        ? containerRatio / imgRatio : imgRatio / containerRatio;
      const scale = (coverFraction * 100) / crop.width;

      const { error } = await supabase
        .from("media_assets")
        .update({
          position_x: Math.round(centerX),
          position_y: Math.round(centerY),
          scale: Math.round(scale * 100) / 100, // Round to 2 decimal places
        })
        .eq("id", mediaId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Image position has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["entries", lifelineId] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update image position",
        variant: "destructive",
      });
    },
  });

  return (
    <CropBoxPicker
      imageUrl={imageUrl}
      onCropComplete={(crop) => updateMutation.mutate(crop)}
      open={open}
      onOpenChange={onOpenChange}
      title="Reposition Image"
      aspectRatio={16 / 9}
    />
  );
}
