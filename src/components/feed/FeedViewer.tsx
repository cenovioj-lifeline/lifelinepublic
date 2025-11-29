import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FeedEntry } from '@/hooks/useFeedData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
  const [selectedEntry, setSelectedEntry] = useState<FeedEntry | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const entryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Get colors from CSS variables with fallbacks
  const positiveColor = getComputedStyle(document.documentElement).getPropertyValue('--scheme-ll-graph-positive') 
    ? `hsl(${getComputedStyle(document.documentElement).getPropertyValue('--scheme-ll-graph-positive')})` 
    : "#16a34a";
  const negativeColor = getComputedStyle(document.documentElement).getPropertyValue('--scheme-ll-graph-negative')
    ? `hsl(${getComputedStyle(document.documentElement).getPropertyValue('--scheme-ll-graph-negative')})`
    : "#dc2626";
  const newCollectionColor = "#2563eb"; // Blue for new collections

  // Auto-select first entry when entries load
  useEffect(() => {
    if (entries && entries.length > 0 && !selectedEntry) {
      setSelectedEntry(entries[0]);
    }
  }, [entries, selectedEntry]);

  const currentIndex = useMemo(() => {
    if (!selectedEntry || !entries) return -1;
    return entries.findIndex((e) => e.id === selectedEntry.id);
  }, [selectedEntry, entries]);

  const scrollToEntry = (entryId: string) => {
    const entryElement = entryRefs.current[entryId];
    if (entryElement && timelineRef.current) {
      const container = timelineRef.current;
      const containerRect = container.getBoundingClientRect();
      const elementRect = entryElement.getBoundingClientRect();

      const isVisible =
        elementRect.top >= containerRect.top &&
        elementRect.bottom <= containerRect.bottom;

      if (!isVisible) {
        const elementTop = entryElement.offsetTop;
        const containerHeight = container.clientHeight;
        const elementHeight = entryElement.clientHeight;
        const scrollTop = elementTop - (containerHeight / 2) + (elementHeight / 2);

        container.scrollTo({
          top: scrollTop,
          behavior: 'smooth'
        });
      }
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0 && entries) {
      const newEntry = entries[currentIndex - 1];
      setSelectedEntry(newEntry);
      scrollToEntry(newEntry.id);
    }
  };

  const handleNext = () => {
    if (currentIndex < (entries?.length || 0) - 1 && entries) {
      const newEntry = entries[currentIndex + 1];
      setSelectedEntry(newEntry);
      scrollToEntry(newEntry.id);
    }
  };

  // Scroll to selected entry when selection changes
  useEffect(() => {
    if (selectedEntry) {
      scrollToEntry(selectedEntry.id);
    }
  }, [selectedEntry?.id]);

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
    <Card className="p-6 pb-4 border-[hsl(var(--scheme-nav-bg))] bg-[hsl(var(--scheme-ll-display-bg))]" style={{ height: 'calc(100dvh - 160px)' }}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
        {/* Left Panel - Timeline Graph */}
        <div
          ref={timelineRef}
          className="bg-[hsl(var(--scheme-ll-graph-bg))] rounded-lg p-5 overflow-y-auto h-full"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#565D6D #f0f0f0'
          }}
        >
          <div className="relative min-h-full" style={{ paddingTop: '2px', paddingBottom: '2px' }}>
            {entries.map((entry) => {
              const isSelected = entry.id === selectedEntry?.id;
              const isNewCollection = entry.type === 'new_collection';
              const positive = isNewCollection || (entry.score >= 0);
              const score = entry.score || 0;
              const absScore = Math.abs(score);
              const stemWidthPercent = Math.min(absScore * 10, 100); // 10% per score point, max 100%
              
              // Color logic: Blue for new collections, green for positive, red for negative
              const barColor = isNewCollection ? newCollectionColor : (positive ? positiveColor : negativeColor);

              return (
                <div
                  key={entry.id}
                  ref={(el) => (entryRefs.current[entry.id] = el)}
                  className={cn(
                    "grid grid-cols-2 gap-0 cursor-pointer transition-colors duration-200",
                    isSelected && "bg-gray-50/50"
                  )}
                  style={{ minHeight: '100px' }}
                  onClick={() => setSelectedEntry(entry)}
                >
                  {positive ? (
                    <>
                      {/* Left column - Score box at left end, stem extends to center */}
                      <div className="flex items-center justify-end relative pr-0 py-3">
                        {/* Vertical centerline extending full height */}
                        <div className="absolute right-0 top-0 bottom-0 w-[2px]" style={{ backgroundColor: '#565D6D' }} />
                        <div className="flex items-center justify-end" style={{ width: `${stemWidthPercent}%` }}>
                          {/* Score box at left end - square on right side */}
                          <div
                            className="flex-shrink-0 w-[50px] h-[50px] rounded-l-lg flex items-center justify-center font-bold text-xl border-[3px] bg-white z-10 relative"
                            style={{
                              borderColor: barColor,
                              color: barColor
                            }}
                          >
                            {score}
                          </div>
                          {/* Horizontal stem bar extending to center */}
                          <div
                            className="flex-1 h-[50px]"
                            style={{
                              background: barColor
                            }}
                          />
                        </div>
                      </div>
                      {/* Right column - Chat bubble */}
                      <div className="flex items-center pl-4 py-3">
                        <div
                          className={cn(
                            "relative bg-white rounded-2xl px-4 py-3 max-w-[90%] transition-all duration-300",
                            isSelected && "border-[3px] shadow-lg"
                          )}
                          style={isSelected ? { borderColor: barColor } : {}}
                        >
                          {/* Triangle pointer */}
                          <div
                            className="absolute left-[-10px] top-[30px] w-0 h-0 border-t-[15px] border-b-0 border-r-[15px] border-transparent"
                            style={{
                              borderRightColor: 'white'
                            }}
                          />
                          <div className="font-bold text-sm mb-1 text-[hsl(var(--scheme-ll-entry-title))]">
                            {isNewCollection ? `🎉 ${entry.collectionTitle}` : entry.entryTitle}
                          </div>
                          <div className="text-xs text-[hsl(var(--scheme-cards-text))] line-clamp-2">
                            {isNewCollection 
                              ? entry.collectionDescription || 'New collection added!' 
                              : entry.entryDescription || entry.entryTitle
                            }
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Left column - Chat bubble */}
                      <div className="flex items-center justify-end pr-4 relative py-3">
                        {/* Vertical centerline extending full height */}
                        <div className="absolute right-0 top-0 bottom-0 w-[2px]" style={{ backgroundColor: '#565D6D' }} />
                        <div
                          className={cn(
                            "relative bg-white rounded-2xl px-4 py-3 max-w-[90%] transition-all duration-300",
                            isSelected && "border-[3px] shadow-lg"
                          )}
                          style={isSelected ? { borderColor: barColor } : {}}
                        >
                          {/* Triangle pointer */}
                          <div
                            className="absolute right-[-10px] top-[30px] w-0 h-0 border-t-[15px] border-b-0 border-l-[15px] border-transparent"
                            style={{
                              borderLeftColor: 'white'
                            }}
                          />
                          <div className="font-bold text-sm mb-1 text-[hsl(var(--scheme-ll-entry-title))]">
                            {entry.entryTitle}
                          </div>
                          <div className="text-xs text-[hsl(var(--scheme-cards-text))] line-clamp-2">
                            {entry.entryDescription || entry.entryTitle}
                          </div>
                        </div>
                      </div>
                      {/* Right column - Stem extends from center, score box at right end */}
                      <div className="flex items-center justify-start pl-0 py-3">
                        <div className="flex items-center justify-start" style={{ width: `${stemWidthPercent}%` }}>
                          {/* Horizontal stem bar extending from center */}
                          <div
                            className="flex-1 h-[50px]"
                            style={{
                              background: barColor
                            }}
                          />
                          {/* Score box at right end - square on left side */}
                          <div
                            className="flex-shrink-0 w-[50px] h-[50px] rounded-r-lg flex items-center justify-center font-bold text-xl border-[3px] bg-white z-10 relative"
                            style={{
                              borderColor: barColor,
                              color: barColor
                            }}
                          >
                            {score}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
            
            {/* Load More Section */}
            {hasNextPage && (
              <div className="py-6 text-center">
                <Button
                  variant="outline"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="bg-white"
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
        </div>

        {/* Right Panel - Entry Details */}
        {selectedEntry && (
          <Card className="shadow-lg flex flex-col h-full overflow-hidden bg-[hsl(var(--scheme-ll-graph-bg))] border-0">
            {/* Navigation Header */}
            <div className="bg-[hsl(var(--scheme-nav-bg))] px-4 py-3 flex-shrink-0 border-0">
              <div className="grid grid-cols-3 items-center gap-2">
                <div className="justify-self-start">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    className="w-[100px] text-sm px-2 bg-[hsl(var(--scheme-nav-button))] hover:bg-[hsl(var(--scheme-nav-button)/.8)] text-[hsl(var(--scheme-nav-text))] border-[hsl(var(--scheme-nav-button))]"
                  >
                    ← Prev
                  </Button>
                </div>
                <div className="text-sm font-semibold text-center text-[hsl(var(--scheme-nav-text))]">
                  Entry {currentIndex + 1} of {entries.length}
                </div>
                <div className="justify-self-end">
                  <Button
                    size="sm"
                    onClick={handleNext}
                    disabled={currentIndex === entries.length - 1}
                    className="w-[100px] text-sm px-2 bg-[hsl(var(--scheme-nav-button))] hover:bg-[hsl(var(--scheme-nav-button)/.8)] text-[hsl(var(--scheme-nav-text))] border-[hsl(var(--scheme-nav-button))]"
                  >
                    Next →
                  </Button>
                </div>
              </div>
            </div>
            
            <CardContent className="space-y-4 py-6 flex-1 overflow-y-auto px-6">
              {selectedEntry.type === 'new_collection' ? (
                // New Collection View
                <>
                  {selectedEntry.collectionHeroImage && (
                    <img
                      src={selectedEntry.collectionHeroImage}
                      alt={selectedEntry.collectionTitle}
                      className="w-full aspect-video object-cover rounded-lg mb-4"
                    />
                  )}
                  <div className="flex items-center gap-2 mb-4">
                    <Badge 
                      className="text-white font-semibold"
                      style={{ backgroundColor: newCollectionColor }}
                    >
                      New Collection
                    </Badge>
                    <Badge 
                      variant="outline"
                      style={{ 
                        backgroundColor: `${newCollectionColor}15`,
                        borderColor: newCollectionColor,
                        color: newCollectionColor
                      }}
                    >
                      +{selectedEntry.score}
                    </Badge>
                  </div>
                  <h2 className="text-3xl font-bold mb-4 text-[hsl(var(--scheme-title-text))]">
                    {selectedEntry.collectionTitle}
                  </h2>
                  {selectedEntry.collectionDescription && (
                    <p className="text-[hsl(var(--scheme-cards-text))] mb-6 leading-relaxed">
                      {selectedEntry.collectionDescription}
                    </p>
                  )}
                  <div className="flex gap-3">
                    <Button asChild className="bg-[hsl(var(--scheme-nav-button))] hover:bg-[hsl(var(--scheme-nav-button)/.8)] text-[hsl(var(--scheme-nav-text))]">
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
                      className="w-full aspect-video object-cover rounded-lg mb-4"
                    />
                  )}
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className="flex-shrink-0 px-3 py-1 rounded-md font-bold text-white"
                      style={{
                        backgroundColor: selectedEntry.score >= 0 ? positiveColor : negativeColor
                      }}
                    >
                      {selectedEntry.score}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-[hsl(var(--scheme-ll-entry-title))]">
                        {selectedEntry.entryTitle}
                      </h2>
                    </div>
                  </div>
                  {selectedEntry.entryDescription && (
                    <div className="prose prose-sm max-w-none mb-6">
                      <p className="text-[hsl(var(--scheme-cards-text))] leading-relaxed whitespace-pre-wrap">
                        {selectedEntry.entryDescription}
                      </p>
                    </div>
                  )}
                  
                  {/* Source Links Section */}
                  <div className="border-t border-[hsl(var(--scheme-cards-border))] pt-6 mt-6 space-y-3">
                    <h3 className="font-semibold text-sm text-[hsl(var(--scheme-cards-text))] opacity-70 uppercase">
                      Source
                    </h3>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        asChild 
                        className="w-full justify-start bg-white hover:bg-gray-50 text-left"
                      >
                        <Link to={`/public/collections/${selectedEntry.collectionSlug}/lifelines/${selectedEntry.lifelineSlug}`}>
                          <ExternalLink className="mr-2 h-4 w-4 flex-shrink-0" />
                          <span className="truncate">View Full Lifeline: {selectedEntry.lifelineTitle}</span>
                        </Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        asChild 
                        className="w-full justify-start bg-white hover:bg-gray-50 text-left"
                      >
                        <Link to={`/public/collections/${selectedEntry.collectionSlug}`}>
                          <ExternalLink className="mr-2 h-4 w-4 flex-shrink-0" />
                          <span className="truncate">Go to Collection: {selectedEntry.collectionTitle}</span>
                        </Link>
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Card>
  );
};