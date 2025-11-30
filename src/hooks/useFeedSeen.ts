import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useSeenEntries = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["feed-seen", userId],
    queryFn: async () => {
      if (!userId) return new Set<string>();
      
      const { data, error } = await supabase
        .from("user_feed_seen")
        .select("entry_id")
        .eq("user_id", userId);
      
      if (error) throw error;
      return new Set(data.map(item => item.entry_id));
    },
    enabled: !!userId,
  });
};

export const useMarkSeen = (userId: string | undefined) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (entryId: string) => {
      if (!userId) throw new Error("User not authenticated");
      
      const { error } = await supabase
        .from("user_feed_seen")
        .insert({ user_id: userId, entry_id: entryId });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed-seen", userId] });
    },
  });
};

export const useUnmarkSeen = (userId: string | undefined) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (entryId: string) => {
      if (!userId) throw new Error("User not authenticated");
      
      const { error } = await supabase
        .from("user_feed_seen")
        .delete()
        .eq("user_id", userId)
        .eq("entry_id", entryId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed-seen", userId] });
    },
  });
};
