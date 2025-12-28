import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CropBoxPicker, CropData } from "./admin/CropBoxPicker";

interface ContributionImagePositionerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageId: string;
  imageUrl: string;
  initialPositionX?: number;
  initialPositionY?: number;
}

export function ContributionImagePositioner({
  open,
  onOpenChange,
  imageId,
  imageUrl,
  initialPositionX = 50,
  initialPositionY = 50,
}: ContributionImagePositionerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (crop: CropData) => {
      // Convert crop box to center position
      const centerX = crop.x + crop.width / 2;
      const centerY = crop.y + crop.height / 2;

      const { error } = await supabase
        .from("entry_images")
        .update({
          position_x: Math.round(centerX),
          position_y: Math.round(centerY),
        })
        .eq("id", imageId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Image position has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["lifeline"] });
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
      title="Reposition Your Image"
      aspectRatio={16 / 9}
    />
  );
}
