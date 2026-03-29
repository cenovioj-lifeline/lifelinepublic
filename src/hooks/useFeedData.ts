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
  entryImages?: Array<{
    id: string;
    url: string;
    alt_text?: string;
    position_x?: number;
    position_y?: number;
    scale?: number;
  }>;
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
  collectionCardImage?: string;
  collectionDescription?: string;
}

const ITEMS_PER_PAGE = 50;

// Collection-level subscriptions (replaces lifeline-level useFeedSubscriptions)
export const useCollectionSubscriptions = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['collection-subscriptions', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_collection_subscriptions')
        .select('collection_id')
        .eq('user_id', userId);

      if (error) throw error;
      return data?.map(s => s.collection_id) || [];
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
    queryKey: ['feed-data', userId || 'anonymous'],
    initialPageParam: 0,
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const page = pageParam;

      // Fetch all published collections for collection cards (always shown)
      const { data: collectionsData, error: collectionsError } = await supabase
        .from('collections')
        .select('id, title, slug, description, hero_image_url, card_image_url, created_at')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (collectionsError) throw collectionsError;

      const feedEntries: FeedEntry[] = [];

      // Collection cards on first page (always visible, anonymous + signed-in)
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
          collectionCardImage: (col as any).card_image_url,
        }));

        feedEntries.push(...collectionEntries);
      }

      // Signed-in users: also get entries from subscribed collections
      if (userId) {
        const { data: subscriptions } = await supabase
          .from('user_collection_subscriptions')
          .select('collection_id')
          .eq('user_id', userId);

        const subscribedCollectionIds = subscriptions?.map(s => s.collection_id) || [];

        if (subscribedCollectionIds.length > 0) {
          // Fetch entries from lifelines in subscribed collections
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
            .in('lifelines.collection_id', subscribedCollectionIds)
            .not('occurred_on', 'is', null)
            .order('occurred_on', { ascending: false })
            .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

          if (entriesError) throw entriesError;

          // Transform entries
          const entryItems: FeedEntry[] = entriesData?.map(entry => {
            const lifeline = Array.isArray(entry.lifelines) ? entry.lifelines[0] : entry.lifelines;
            const collectionData = lifeline?.collections;
            const collection = Array.isArray(collectionData) ? collectionData[0] : collectionData;
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
              entryDescription: entry.summary || entry.details,
              entryImage: entryMedia?.url,
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

          feedEntries.push(...entryItems);
        }
      }

      // Sort all entries by date (most recent first)
      feedEntries.sort((a, b) => b.date.getTime() - a.date.getTime());

      // For anonymous users or users with no subscriptions, hasMore is false
      // (only collection cards, no paginated entries)
      const hasEntries = userId ? feedEntries.some(e => e.type === 'lifeline_entry') : false;

      return {
        entries: feedEntries,
        hasMore: hasEntries && feedEntries.filter(e => e.type === 'lifeline_entry').length === ITEMS_PER_PAGE,
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length : undefined;
    },
    enabled: true,
  });
};
