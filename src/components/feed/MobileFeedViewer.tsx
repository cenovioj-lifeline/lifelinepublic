import { useState, useMemo } from 'react';
import { FeedEntry } from '@/hooks/useFeedData';
import { Loader2 } from 'lucide-react';
import { MobileFeedGraph } from './MobileFeedGraph';
import { MobileFeedDetailSheet } from './MobileFeedDetailSheet';

interface MobileFeedViewerProps {
  entries: FeedEntry[];
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  seenIds: Set<string>;
  seenFilter: 'unseen' | 'seen' | 'all';
  onToggleSeen: (entryId: string) => void;
}

export const MobileFeedViewer = ({
  entries,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  seenIds,
  seenFilter,
  onToggleSeen,
}: MobileFeedViewerProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Filter entries based on seen status
  const filteredEntries = useMemo(() => {
    if (seenFilter === 'all') return entries;
    if (seenFilter === 'seen') return entries.filter(e => seenIds.has(e.id));
    return entries.filter(e => !seenIds.has(e.id)); // unseen
  }, [entries, seenIds, seenFilter]);

  const handleEntryClick = (entry: FeedEntry, index: number) => {
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
    if (selectedIndex !== null && selectedIndex < filteredEntries.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const selectedEntry = selectedIndex !== null ? filteredEntries[selectedIndex] : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (filteredEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-8 text-center">
        <h3 className="text-xl font-semibold mb-2">No entries found</h3>
        <p className="text-muted-foreground">
          {seenFilter === 'seen' 
            ? "You haven't marked any entries as seen yet."
            : seenFilter === 'unseen'
            ? "You've seen all entries! Check back later for new content."
            : "The lifelines you selected don't have any dated events yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <MobileFeedGraph
        entries={filteredEntries}
        selectedId={selectedEntry?.id || null}
        onEntryClick={handleEntryClick}
        onLoadMore={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
      />

      <MobileFeedDetailSheet
        entry={selectedEntry}
        isOpen={isDetailOpen}
        onClose={handleClose}
        onPrevious={handlePrevious}
        onNext={handleNext}
        canGoPrevious={selectedIndex !== null && selectedIndex > 0}
        canGoNext={selectedIndex !== null && selectedIndex < filteredEntries.length - 1}
        currentIndex={selectedIndex || 0}
        totalEntries={filteredEntries.length}
      />
    </div>
  );
};
