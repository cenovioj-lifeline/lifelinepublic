import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export const useCollectionSubscription = (collectionId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: isSubscribed = false, isLoading } = useQuery({
    queryKey: ['collection-subscription', user?.id, collectionId],
    queryFn: async () => {
      if (!user || !collectionId) return false;

      const { data, error } = await supabase
        .from('user_collection_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('collection_id', collectionId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user && !!collectionId,
  });

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!user || !collectionId) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_collection_subscriptions')
        .insert({ user_id: user.id, collection_id: collectionId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection-subscription', user?.id, collectionId] });
      queryClient.invalidateQueries({ queryKey: ['collection-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['feed-data'] });
    },
  });

  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      if (!user || !collectionId) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_collection_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('collection_id', collectionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection-subscription', user?.id, collectionId] });
      queryClient.invalidateQueries({ queryKey: ['collection-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['feed-data'] });
    },
  });

  return {
    isSubscribed,
    isLoading,
    isAuthenticated: !!user,
    subscribe: subscribeMutation.mutate,
    unsubscribe: unsubscribeMutation.mutate,
    isPending: subscribeMutation.isPending || unsubscribeMutation.isPending,
  };
};
