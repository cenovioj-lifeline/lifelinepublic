import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FeedEntry } from './useFeedData';

const ITEMS_PER_PAGE = 50;

interface CollectionFeedPageData {
  entries: FeedEntry[];
  hasMore: boolean;
}

/**
 * Fetches feed entries for a specific collection.
 * Shows ALL entries from ALL lifelines in the collection (no subscription needed).
 * Unlike useFeedData, this does not include "new collection" entries since
 * the user is already viewing the collection.
 */
export const useCollectionFeedData = (collectionId: string | undefined) => {
  return useInfiniteQuery({
    queryKey: ['collection-feed-data', collectionId],
    initialPageParam: 0,
    enabled: !!collectionId,
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const page = pageParam;

      // Fetch entries from lifelines that belong to this collection
      const { data: entriesData, error: entriesError } = await supabase
        .from('entries')
        .select(`
          id,
          title,
          summary,
          details,
          score,
          occurred_on,
          lifeline_id,
          lifelines!inner (
            id,
            title,
            slug,
            collection_id,
            collections (
              id,
              title,
              slug
            ),
            profile_id,
            profiles!lifelines_profile_id_fkey (
              id,
              name,
              avatar_image_id,
              media_assets (
                url
              )
            )
          ),
          entry_media (
            id,
            order_index,
            media_assets (
              id,
              url,
              alt_text,
              position_x,
              position_y,
              scale
            )
          )
        `)
        .eq('lifelines.collection_id', collectionId)
        .not('occurred_on', 'is', null)
        .order('occurred_on', { ascending: false })
        .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

      if (entriesError) throw entriesError;

      // Transform entries to FeedEntry format
      const feedEntries: FeedEntry[] = entriesData?.map(entry => {
        const lifeline = Array.isArray(entry.lifelines) ? entry.lifelines[0] : entry.lifelines;
        const collectionData = lifeline?.collections;
        const collection = Array.isArray(collectionData) ? collectionData[0] : collectionData;
        const profile = lifeline?.profiles;
        const profileMedia = profile?.media_assets;

        return {
          id: `entry-${entry.id}`,
          type: 'lifeline_entry' as const,
          date: new Date(entry.occurred_on!),
          score: entry.score || 0,
          entryId: entry.id,
          entryTitle: entry.title,
          entryDescription: entry.summary || entry.details,
          entryImages: entry.entry_media?.map(em => ({
            id: em.media_assets?.id || '',
            url: em.media_assets?.url || '',
            alt_text: em.media_assets?.alt_text,
            position_x: em.media_assets?.position_x,
            position_y: em.media_assets?.position_y,
            scale: em.media_assets?.scale,
          })).filter(img => img.url) || [],
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

      // Sort by date (most recent first)
      feedEntries.sort((a, b) => b.date.getTime() - a.date.getTime());

      return {
        entries: feedEntries,
        hasMore: entriesData && entriesData.length === ITEMS_PER_PAGE,
      } as CollectionFeedPageData;
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length : undefined;
    },
  });
};
