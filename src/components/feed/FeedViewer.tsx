import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FeedEntry } from '@/hooks/useFeedData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Loader2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeedViewerProps {
  entries: FeedEntry[];
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}

export const FeedViewer = ({
  entries,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: FeedViewerProps) => {
  const [selectedEntry, setSelectedEntry] = useState<FeedEntry | null>(entries[0] || null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <Card className="p-12 text-center">
        <h3 className="text-xl font-semibold mb-2">No entries found</h3>
        <p className="text-muted-foreground">
          The lifelines you selected don't have any dated events yet.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
      {/* Left Panel - Entry List */}
      <div className="col-span-5 overflow-y-auto space-y-2 pr-2">
        {entries.map((entry) => {
          const isSelected = selectedEntry?.id === entry.id;
          const isNewCollection = entry.type === 'new_collection';
          const scoreColor = isNewCollection 
            ? 'hsl(var(--chart-1))' 
            : entry.score >= 0 
            ? 'hsl(var(--chart-2))' 
            : 'hsl(var(--chart-5))';

          return (
            <button
              key={entry.id}
              onClick={() => setSelectedEntry(entry)}
              className={cn(
                'w-full text-left p-4 rounded-lg border transition-all',
                isSelected ? 'bg-accent border-primary' : 'bg-card hover:bg-accent/50'
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="h-12 rounded transition-all"
                  style={{
                    width: `${Math.min(Math.abs(entry.score) * 8, 100)}%`,
                    backgroundColor: scoreColor,
                  }}
                >
                  <div className="flex items-center justify-center h-full text-sm font-bold text-white px-2">
                    {entry.score > 0 ? '+' : ''}{entry.score}
                  </div>
                </div>
              </div>
              <div>
                <p className="font-semibold text-sm line-clamp-1">
                  {isNewCollection ? `🎉 ${entry.collectionTitle}` : entry.entryTitle}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isNewCollection 
                    ? 'New Collection'
                    : `${entry.profileName || entry.lifelineTitle} • ${entry.collectionTitle}`
                  }
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {entry.date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
            </button>
          );
        })}

        {hasNextPage && (
          <div className="py-4 text-center">
            <Button
              variant="outline"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load More'
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Right Panel - Entry Details */}
      <div className="col-span-7 overflow-y-auto">
        {selectedEntry ? (
          <Card className="p-6">
            {selectedEntry.type === 'new_collection' ? (
              // New Collection View
              <>
                {selectedEntry.collectionHeroImage && (
                  <img
                    src={selectedEntry.collectionHeroImage}
                    alt={selectedEntry.collectionTitle}
                    className="w-full h-64 object-cover rounded-lg mb-6"
                  />
                )}
                <div className="flex items-center gap-2 mb-4">
                  <Badge style={{ backgroundColor: 'hsl(var(--chart-1))' }} className="text-white">
                    New Collection
                  </Badge>
                  <Badge variant="outline">+{selectedEntry.score}</Badge>
                </div>
                <h2 className="text-3xl font-bold mb-4">{selectedEntry.collectionTitle}</h2>
                {selectedEntry.collectionDescription && (
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {selectedEntry.collectionDescription}
                  </p>
                )}
                <div className="flex gap-3">
                  <Button asChild>
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
                    className="w-full h-64 object-cover rounded-lg mb-6"
                  />
                )}
                <div className="flex items-center gap-2 mb-4">
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
                  <p className="text-sm text-muted-foreground">
                    {selectedEntry.date.toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </p>
                </div>
                <h2 className="text-3xl font-bold mb-4">{selectedEntry.entryTitle}</h2>
                {selectedEntry.entryDescription && (
                  <div className="prose prose-sm max-w-none mb-6">
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                      {selectedEntry.entryDescription}
                    </p>
                  </div>
                )}
                
                <div className="border-t pt-6 space-y-3">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase">Source</h3>
                  <div className="space-y-2">
                    <Button variant="outline" asChild className="w-full justify-start">
                      <Link to={`/public/collections/${selectedEntry.collectionSlug}/lifelines/${selectedEntry.lifelineSlug}`}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Full Lifeline: {selectedEntry.lifelineTitle}
                      </Link>
                    </Button>
                    <Button variant="outline" asChild className="w-full justify-start">
                      <Link to={`/public/collections/${selectedEntry.collectionSlug}`}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Go to Collection: {selectedEntry.collectionTitle}
                      </Link>
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Select an entry to view details</p>
          </Card>
        )}
      </div>
    </div>
  );
};
