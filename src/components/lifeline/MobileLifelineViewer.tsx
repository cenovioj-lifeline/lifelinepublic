import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSwipeable } from 'react-swipeable';
import { transformEntriesToMobile } from '@/utils/entryDataAdapter';
import { useMobileEntryNavigation } from '@/hooks/useMobileEntryNavigation';
import { useCollectionQuote } from '@/hooks/useCollectionQuote';
import { useImagePreloader } from '@/hooks/useImagePreloader';
import { GraphHeader } from './mobile/GraphHeader';
import { StorySlide } from './mobile/StorySlide';
import { MinimalQuote } from './mobile/MinimalQuote';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams } from 'react-router-dom';
import { ContributionButton } from '@/components/ContributionButton';
import { useAuth } from '@/lib/auth';

interface MobileLifelineViewerProps {
  lifelineId: string;
}

export const MobileLifelineViewer = ({ lifelineId }: MobileLifelineViewerProps) => {
  const { collectionSlug } = useParams();
  const { user } = useAuth();
  
  // Fetch collection settings for quotes
  const { data: collection } = useQuery({
    queryKey: ['collection-settings', collectionSlug],
    queryFn: async () => {
      if (!collectionSlug) return null;
      const { data, error } = await supabase
        .from('collections')
        .select('id, quotes_enabled, quote_frequency')
        .eq('slug', collectionSlug)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!collectionSlug,
  });

  const { currentQuote, dismissQuote } = useCollectionQuote(
    collection?.id || '',
    collection?.quotes_enabled || false,
    collection?.quote_frequency || 3
  );

  const { data: lifeline } = useQuery({
    queryKey: ['lifeline', lifelineId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lifelines')
        .select('title, subtitle')
        .eq('id', lifelineId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: entries, isLoading } = useQuery({
    queryKey: ['lifeline-entries-mobile', lifelineId, user?.id],
    queryFn: async () => {
      let query = supabase
        .from('entries')
        .select(`
          id,
          title,
          summary,
          details,
          score,
          occurred_on,
          order_index,
          sentiment,
          contribution_status,
          contributed_by_user_id,
          entry_media (
            id,
            locked,
            order_index,
            media_assets (
              url
            )
          )
        `)
        .eq('lifeline_id', lifelineId);

      // Filter visibility based on user
      if (user) {
        query = query.or(
          `contribution_status.in.(approved,auto_approved),contributed_by_user_id.eq.${user.id}`
        );
      } else {
        query = query.in('contribution_status', ['approved', 'auto_approved']);
      }

      query = query.order('order_index', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;
      return transformEntriesToMobile(data || []);
    },
  });

  const {
    currentIndex,
    navigateToEntry,
    goToNext,
    goToPrevious,
    canGoNext,
    canGoPrevious,
  } = useMobileEntryNavigation(entries?.length || 0);

  const [transitionDirection, setTransitionDirection] = useState<'left' | 'right' | null>(null);
  
  // Preload adjacent images
  const imageUrls = entries?.map(entry => entry.image_url) || [];
  useImagePreloader(imageUrls, currentIndex);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (canGoNext) {
        setTransitionDirection('left');
        setTimeout(() => {
          goToNext();
          setTransitionDirection(null);
        }, 50);
      }
    },
    onSwipedRight: () => {
      if (canGoPrevious) {
        setTransitionDirection('right');
        setTimeout(() => {
          goToPrevious();
          setTransitionDirection(null);
        }, 50);
      }
    },
    trackMouse: false,
    preventScrollOnSwipe: false,
    delta: 50,
  });

  if (isLoading) {
    return (
      <div className="h-screen bg-background">
        <div className="h-[60px] border-b border-border" />
        <Skeleton className="h-[320px]" />
        <div className="p-6 space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">No entries found</p>
      </div>
    );
  }

  const currentEntry = entries[currentIndex];

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <GraphHeader
        entries={entries}
        currentIndex={currentIndex}
        onEntryClick={navigateToEntry}
      />
      
      <div {...swipeHandlers} className="flex-1 overflow-hidden">
        <StorySlide entry={currentEntry} transitionDirection={transitionDirection} />
      </div>

      {/* Minimal quote display */}
      {currentQuote && (
        <MinimalQuote
          quote={currentQuote.quote}
          author={currentQuote.author}
          context={currentQuote.context}
          onDismiss={dismissQuote}
        />
      )}

      {/* Floating contribution button */}
      <ContributionButton
        context="lifeline"
        lifelineId={lifelineId}
        lifelineTitle={lifeline?.title}
        currentEntryId={currentEntry?.id}
        floating
      />
    </div>
  );
};
