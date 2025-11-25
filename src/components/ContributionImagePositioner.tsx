import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePositionPicker } from "./ImagePositionPicker";

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
    mutationFn: async (position: { x: number; y: number; scale: number }) => {
      const { error } = await supabase
        .from("entry_images")
        .update({
          position_x: position.x,
          position_y: position.y,
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
    <ImagePositionPicker
      imageUrl={imageUrl}
      onPositionChange={(position) => updateMutation.mutate(position)}
      initialPosition={{ x: initialPositionX, y: initialPositionY, scale: 1 }}
      open={open}
      onOpenChange={onOpenChange}
      title="Reposition Your Image"
      viewType="both"
    />
  );
}
