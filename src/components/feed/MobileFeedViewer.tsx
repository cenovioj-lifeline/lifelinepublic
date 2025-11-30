import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FeedEntry } from '@/hooks/useFeedData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Loader2, ExternalLink, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

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
  const [selectedEntry, setSelectedEntry] = useState<FeedEntry | null>(null);
  const navigate = useNavigate();

  // Filter entries based on seen status
  const filteredEntries = entries.filter(entry => {
    if (seenFilter === 'all') return true;
    if (seenFilter === 'seen') return seenIds.has(entry.id);
    return !seenIds.has(entry.id); // unseen
  });

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isNearBottom = element.scrollHeight - element.scrollTop <= element.clientHeight * 1.5;
    
    if (isNearBottom && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (filteredEntries.length === 0) {
    return (
      <div className="p-6 text-center">
        <h3 className="text-xl font-semibold mb-2">No entries found</h3>
        <p className="text-muted-foreground mb-4">
          {seenFilter === 'seen' 
            ? 'You haven\'t marked any entries as seen yet.'
            : seenFilter === 'unseen'
            ? 'All entries have been marked as seen!'
            : 'The lifelines you selected don\'t have any dated events yet.'
          }
        </p>
        <Button onClick={() => navigate('/feed/setup')}>
          Adjust Feed Settings
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">My Feed</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/feed/setup')}
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>

      {/* Feed Entries */}
      <div className="overflow-y-auto" onScroll={handleScroll}>
        <div className="p-4 space-y-3">
          {filteredEntries.map((entry) => {
            const isNewCollection = entry.type === 'new_collection';
            const maxScore = Math.max(...filteredEntries.map(e => Math.abs(e.score)));
            const barWidth = maxScore > 0 ? (Math.abs(entry.score) / maxScore) * 50 : 0;
            const scoreColor = isNewCollection 
              ? 'hsl(var(--chart-1))' 
              : entry.score >= 0 
              ? 'hsl(var(--chart-2))' 
              : 'hsl(var(--chart-5))';

            return (
              <button
                key={entry.id}
                onClick={() => setSelectedEntry(entry)}
                className="w-full bg-card border rounded-lg p-3 hover:bg-accent/50 transition-colors"
              >
                <div className="flex gap-3">
                  {/* Score Bar */}
                  <div className="flex-shrink-0 w-12">
                    <div
                      className="rounded font-bold text-sm flex items-center justify-center h-12"
                      style={{
                        backgroundColor: scoreColor,
                        color: 'white',
                      }}
                    >
                      {entry.score > 0 ? '+' : ''}{entry.score}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 flex gap-3">
                    {/* Visual Bar */}
                    <div className="flex-shrink-0 relative">
                      <div
                        className="h-12 rounded transition-all"
                        style={{
                          width: `${barWidth}px`,
                          backgroundColor: scoreColor,
                          opacity: 0.3,
                        }}
                      />
                    </div>

                    {/* Avatar and Text */}
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      {!isNewCollection && entry.profileAvatar && (
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={entry.profileAvatar} />
                          <AvatarFallback>{entry.profileName?.[0]}</AvatarFallback>
                        </Avatar>
                      )}
                      {isNewCollection && (
                        <div className="text-2xl flex-shrink-0">🎉</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate">
                          {isNewCollection 
                            ? 'NEW COLLECTION' 
                            : entry.profileName || entry.lifelineTitle
                          }
                        </p>
                        <p className="text-xs text-foreground truncate">
                          {isNewCollection ? entry.collectionTitle : entry.entryTitle}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {isNewCollection ? 'Just added!' : entry.collectionTitle}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}

          {isFetchingNextPage && (
            <div className="py-4 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
            </div>
          )}
        </div>
      </div>

      {/* Entry Detail Sheet */}
      <Sheet open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
          {selectedEntry && (
            <>
              {selectedEntry.type === 'new_collection' ? (
                // New Collection View
                <>
                  {selectedEntry.collectionHeroImage && (
                    <img
                      src={selectedEntry.collectionHeroImage}
                      alt={selectedEntry.collectionTitle}
                      className="w-full h-48 object-cover rounded-lg -mx-6 -mt-6 mb-4"
                    />
                  )}
                  <SheetHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge style={{ backgroundColor: 'hsl(var(--chart-1))' }} className="text-white">
                        New Collection
                      </Badge>
                      <Badge variant="outline">+{selectedEntry.score}</Badge>
                    </div>
                    <SheetTitle className="text-2xl">{selectedEntry.collectionTitle}</SheetTitle>
                  </SheetHeader>
                  {selectedEntry.collectionDescription && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">Description</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {selectedEntry.collectionDescription}
                      </p>
                    </div>
                  )}
                  <div className="mt-6 space-y-3">
                    <p className="text-xs text-muted-foreground">
                      {selectedEntry.date.toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </p>
                    <Button asChild className="w-full">
                      <Link to={`/public/collections/${selectedEntry.collectionSlug}`}>
                        Explore Collection
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </>
              ) : (
                // Lifeline Entry View
                <>
                  {selectedEntry.entryImage && (
                    <img
                      src={selectedEntry.entryImage}
                      alt={selectedEntry.entryTitle}
                      className="w-full h-48 object-cover rounded-lg -mx-6 -mt-6 mb-4"
                    />
                  )}
                  <SheetHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge 
                        variant="outline"
                        style={{ 
                          backgroundColor: selectedEntry.score >= 0 
                            ? 'hsl(var(--chart-2) / 0.1)' 
                            : 'hsl(var(--chart-5) / 0.1)',
                          borderColor: selectedEntry.score >= 0 
                            ? 'hsl(var(--chart-2))' 
                            : 'hsl(var(--chart-5))',
                          color: selectedEntry.score >= 0 
                            ? 'hsl(var(--chart-2))' 
                            : 'hsl(var(--chart-5))',
                        }}
                      >
                        {selectedEntry.score > 0 ? '+' : ''}{selectedEntry.score}
                      </Badge>
                      {selectedEntry.profileAvatar && (
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={selectedEntry.profileAvatar} />
                          <AvatarFallback>{selectedEntry.profileName?.[0]}</AvatarFallback>
                        </Avatar>
                      )}
                      <span className="text-sm font-medium">
                        {selectedEntry.profileName || selectedEntry.lifelineTitle}
                      </span>
                    </div>
                    <SheetTitle className="text-xl leading-tight">
                      {selectedEntry.entryTitle}
                    </SheetTitle>
                  </SheetHeader>
                  {selectedEntry.entryDescription && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">Description</h4>
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                        {selectedEntry.entryDescription}
                      </p>
                    </div>
                  )}
                  <div className="mt-6 space-y-3 pb-6">
                    <p className="text-xs text-muted-foreground">
                      {selectedEntry.date.toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </p>
                    <Button variant="outline" asChild className="w-full">
                      <Link to={`/public/collections/${selectedEntry.collectionSlug}/lifelines/${selectedEntry.lifelineSlug}`}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Full Lifeline: {selectedEntry.lifelineTitle}
                      </Link>
                    </Button>
                    <Button variant="outline" asChild className="w-full">
                      <Link to={`/public/collections/${selectedEntry.collectionSlug}`}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Go to Collection: {selectedEntry.collectionTitle}
                      </Link>
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};
