import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FeedEntry {
  id: string;
  type: 'lifeline_entry' | 'new_collection';
  date: Date;
  score: number;
  
  // Lifeline entry fields
  entryId?: string;
  entryTitle?: string;
  entryDescription?: string;
  entryImage?: string;
  lifelineId?: string;
  lifelineTitle?: string;
  lifelineSlug?: string;
  collectionId?: string;
  collectionTitle?: string;
  collectionSlug?: string;
  profileName?: string;
  profileAvatar?: string;
  
  // New collection fields
  collectionHeroImage?: string;
  collectionDescription?: string;
}

const ITEMS_PER_PAGE = 50;

export const useFeedSubscriptions = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['feed-subscriptions', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('user_feed_subscriptions')
        .select('lifeline_id')
        .eq('user_id', userId);
      
      if (error) throw error;
      return data?.map(s => s.lifeline_id) || [];
    },
    enabled: !!userId,
  });
};

interface FeedPageData {
  entries: FeedEntry[];
  hasMore: boolean;
}

export const useFeedData = (userId: string | undefined) => {
  return useInfiniteQuery({
    queryKey: ['feed-data', userId],
    initialPageParam: 0,
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const page = pageParam;
      if (!userId) return { entries: [], hasMore: false };
      
      // Get subscribed lifelines
      const { data: subscriptions } = await supabase
        .from('user_feed_subscriptions')
        .select('lifeline_id')
        .eq('user_id', userId);
      
      if (!subscriptions || subscriptions.length === 0) {
        return { entries: [], hasMore: false };
      }
      
      const lifelineIds = subscriptions.map(s => s.lifeline_id);
      
      // Fetch entries with dates from subscribed lifelines
      const { data: entriesData, error: entriesError } = await supabase
        .from('entries')
        .select(`
          id,
          title,
          details,
          score,
          occurred_on,
          lifeline_id,
          lifelines!inner (
            id,
            title,
            slug,
            collection_id,
            collections!inner (
              id,
              title,
              slug
            ),
            profile_id,
            profiles (
              id,
              name,
              avatar_image_id,
              media_assets (
                url
              )
            )
          ),
          entry_media (
            media_assets (
              url
            )
          )
        `)
        .in('lifeline_id', lifelineIds)
        .not('occurred_on', 'is', null)
        .order('occurred_on', { ascending: false })
        .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);
      
      if (entriesError) throw entriesError;
      
      // Fetch recent collections (last 30 days) for "New Collection" entries
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: collectionsData, error: collectionsError } = await supabase
        .from('collections')
        .select('id, title, slug, description, hero_image_url, created_at')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      
      if (collectionsError) throw collectionsError;
      
      // Transform entries
      const feedEntries: FeedEntry[] = entriesData?.map(entry => {
        const lifeline = Array.isArray(entry.lifelines) ? entry.lifelines[0] : entry.lifelines;
        const collection = lifeline?.collections;
        const profile = lifeline?.profiles;
        const profileMedia = profile?.media_assets;
        const entryMedia = entry.entry_media?.[0]?.media_assets;
        
        return {
          id: `entry-${entry.id}`,
          type: 'lifeline_entry' as const,
          date: new Date(entry.occurred_on!),
          score: entry.score || 0,
          entryId: entry.id,
          entryTitle: entry.title,
          entryDescription: entry.details,
          entryImage: entryMedia?.url,
          lifelineId: lifeline?.id,
          lifelineTitle: lifeline?.title,
          lifelineSlug: lifeline?.slug,
          collectionId: collection?.id,
          collectionTitle: collection?.title,
          collectionSlug: collection?.slug,
          profileName: profile?.name,
          profileAvatar: profileMedia?.url,
        };
      }) || [];
      
      // Add new collection entries (only on first page)
      if (page === 0 && collectionsData) {
        const collectionEntries: FeedEntry[] = collectionsData.map(col => ({
          id: `collection-${col.id}`,
          type: 'new_collection' as const,
          date: new Date(col.created_at),
          score: 10,
          collectionId: col.id,
          collectionTitle: col.title,
          collectionSlug: col.slug,
          collectionDescription: col.description,
          collectionHeroImage: col.hero_image_url,
        }));
        
        feedEntries.push(...collectionEntries);
      }
      
      // Sort all entries by date (most recent first)
      feedEntries.sort((a, b) => b.date.getTime() - a.date.getTime());
      
      return {
        entries: feedEntries,
        hasMore: entriesData && entriesData.length === ITEMS_PER_PAGE,
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length : undefined;
    },
    enabled: !!userId,
  });
};
