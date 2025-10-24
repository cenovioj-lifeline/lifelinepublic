import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";

interface FavoriteButtonProps {
  itemId: string;
  itemType: "lifeline" | "collection" | "election";
  className?: string;
}

export function FavoriteButton({ itemId, itemType, className }: FavoriteButtonProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

  const { data: isFavorited } = useQuery({
    queryKey: ["favorite", itemType, itemId, userId],
    queryFn: async () => {
      if (!userId) return false;
      
      const { data, error } = await supabase
        .from("user_favorites")
        .select("id")
        .eq("user_id", userId)
        .eq("item_type", itemType)
        .eq("item_id", itemId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!userId,
  });

  const toggleFavorite = useMutation({
    mutationFn: async () => {
      if (!userId) {
        toast.error("Please sign in to favorite items");
        return;
      }

      if (isFavorited) {
        const { error } = await supabase
          .from("user_favorites")
          .delete()
          .eq("user_id", userId)
          .eq("item_type", itemType)
          .eq("item_id", itemId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_favorites")
          .insert({
            user_id: userId,
            item_type: itemType,
            item_id: itemId,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorite", itemType, itemId, userId] });
      toast.success(isFavorited ? "Removed from favorites" : "Added to favorites");
    },
    onError: () => {
      toast.error("Failed to update favorite");
    },
  });

  if (!userId) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite.mutate();
      }}
    >
      <Heart
        className={`h-5 w-5 ${isFavorited ? "fill-red-500 text-red-500" : ""}`}
      />
    </Button>
  );
}
