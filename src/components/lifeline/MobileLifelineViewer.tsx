import { useState, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { transformEntriesToMobile, MobileEntry } from '@/utils/entryDataAdapter';
import { useCollectionQuote } from '@/hooks/useCollectionQuote';
import { parseLifelineTitle } from '@/lib/lifelineTitle';
import { MobileLifelineGraph, MobileLifelineGraphRef } from './mobile/MobileLifelineGraph';
import { MobileLifelineDetailSheet } from './mobile/MobileLifelineDetailSheet';
import { MinimalQuote } from './mobile/MinimalQuote';
import { Skeleton } from '@/components/ui/skeleton';
import { useParams } from 'react-router-dom';
import { CommunityContributionMenu } from '@/components/CommunityContributionMenu';
import { FavoriteButton } from '@/components/FavoriteButton';
import { useAuth } from '@/lib/auth';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileLifelineViewerProps {
  lifelineId: string;
}

export const MobileLifelineViewer = ({ lifelineId }: MobileLifelineViewerProps) => {
  const { collectionSlug } = useParams();
  const { user } = useAuth();
  const graphRef = useRef<MobileLifelineGraphRef>(null);
  
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Fetch collection settings for quotes
  const { data: collection } = useQuery({
    queryKey: ['collection-settings', collectionSlug],
    queryFn: async () => {
      if (!collectionSlug) return null;
      const { data, error } = await supabase
        .from('collections')
        .select('id, quotes_enabled, quote_frequency, title')
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
        .select('title, subtitle, lifeline_type')
        .eq('id', lifelineId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const parsedTitle = lifeline 
    ? parseLifelineTitle(lifeline.title, lifeline.lifeline_type || 'list')
    : null;

  const { data: rawEntries, isLoading } = useQuery({
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
      return data || [];
    },
  });

  // Transform and sort entries - for rating type, sort by score descending then by title
  const entries = useMemo(() => {
    if (!rawEntries) return [];
    
    const transformed = transformEntriesToMobile(rawEntries);
    
    // For rating type, sort by score descending, then by title alphabetically
    if (lifeline?.lifeline_type === 'rating') {
      return transformed.sort((a, b) => {
        const scoreDiff = (b.rating || 0) - (a.rating || 0);
        if (scoreDiff !== 0) return scoreDiff;
        return (a.title || '').localeCompare(b.title || '');
      });
    }
    
    return transformed;
  }, [rawEntries, lifeline?.lifeline_type]);

  // Get contribution status for selected entry
  const selectedEntryContributionStatus = useMemo(() => {
    if (selectedIndex === null || !rawEntries) return null;
    const entry = entries[selectedIndex];
    if (!entry) return null;
    const rawEntry = rawEntries.find(e => e.id === entry.id);
    return rawEntry?.contribution_status || null;
  }, [selectedIndex, rawEntries, entries]);

  const handleEntryClick = (entry: MobileEntry, index: number) => {
    setSelectedIndex(index);
    setIsDetailOpen(true);
  };

  const handleClose = () => {
    setIsDetailOpen(false);
  };

  const handlePrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < entries.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const handleScrollTop = () => {
    graphRef.current?.scrollToTop();
    setShowScrollTop(false);
  };

  const currentEntry = selectedIndex !== null ? entries[selectedIndex] : null;

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

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header with collection title */}
      <header className="sticky top-0 z-50 bg-[hsl(var(--scheme-nav-bg))] border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <span className="font-bold text-[hsl(var(--scheme-nav-text))] truncate">
            {collection?.title || 'Collection'}
          </span>
        </div>
      </header>
      
      {/* Lifeline title + Favorite row */}
      <div className="px-4 py-3 flex items-center justify-between bg-[hsl(var(--scheme-ll-graph-bg))]">
        <h1 className="font-serif font-bold text-lg text-[hsl(var(--scheme-collection-text))] truncate flex-1 mr-2">
          {parsedTitle?.fullTitle || lifeline?.title || 'Lifeline'}
        </h1>
        <FavoriteButton itemId={lifelineId} itemType="lifeline" />
      </div>
      
      {/* Separator line that connects to graph centerline */}
      <div className="relative h-[2px] bg-[hsl(var(--scheme-ll-graph-bg))]">
        <div className="absolute left-1/2 -translate-x-1/2 w-[2px] h-[2px] bg-[#565D6D]" />
      </div>
      
      {/* Graph - vertical timeline */}
      <MobileLifelineGraph
        ref={graphRef}
        entries={entries}
        selectedId={currentEntry?.id || null}
        onEntryClick={handleEntryClick}
      />

      {/* Detail sheet */}
      <MobileLifelineDetailSheet
        entry={currentEntry}
        isOpen={isDetailOpen}
        onClose={handleClose}
        onPrevious={handlePrevious}
        onNext={handleNext}
        canGoPrevious={selectedIndex !== null && selectedIndex > 0}
        canGoNext={selectedIndex !== null && selectedIndex < entries.length - 1}
        currentIndex={selectedIndex || 0}
        totalEntries={entries.length}
        contributionStatus={selectedEntryContributionStatus}
      />

      {/* Minimal quote display */}
      {currentQuote && (
        <MinimalQuote
          quote={currentQuote.quote}
          author={currentQuote.author}
          context={currentQuote.context}
          onDismiss={dismissQuote}
        />
      )}

      {/* Scroll to top button */}
      {showScrollTop && (
        <Button
          variant="secondary"
          size="icon"
          className="fixed bottom-20 right-4 z-40 rounded-full shadow-lg"
          onClick={handleScrollTop}
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}

      {/* Floating contribution button */}
      <CommunityContributionMenu
        lifelineId={lifelineId}
        lifelineTitle={lifeline?.title || ""}
        currentEntryId={currentEntry?.id}
        className="fixed bottom-4 right-4 z-50"
      />
    </div>
  );
};
