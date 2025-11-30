import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FeedEntry } from '@/hooks/useFeedData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ExternalLink, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { differenceInMonths } from 'date-fns';

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

  // Pre-process entries to add date metadata for sticky year headers
  const entriesWithDateContext = useMemo(() => {
    if (!entries || entries.length === 0) return [];
    
    let lastYear: number | null = null;
    
    return entries.map((entry, index) => {
      const year = entry.date.getFullYear();
      const isNewYear = year !== lastYear;
      
      // Calculate gap from previous entry
      const prevEntry = index > 0 ? entries[index - 1] : null;
      const gapMonths = prevEntry 
        ? Math.abs(differenceInMonths(entry.date, prevEntry.date))
        : 0;
      
      lastYear = year;
      
      return {
        ...entry,
        showYear: isNewYear,
        gapMonths,
        year
      };
    });
  }, [entries]);

  // Auto-select first entry when entries load
  useEffect(() => {
    if (entriesWithDateContext && entriesWithDateContext.length > 0 && !selectedEntry) {
      setSelectedEntry(entriesWithDateContext[0]);
    }
  }, [entriesWithDateContext, selectedEntry]);

  const currentIndex = useMemo(() => {
    if (!selectedEntry || !entriesWithDateContext) return -1;
    return entriesWithDateContext.findIndex((e) => e.id === selectedEntry.id);
  }, [selectedEntry, entriesWithDateContext]);

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
    if (currentIndex > 0 && entriesWithDateContext) {
      const newEntry = entriesWithDateContext[currentIndex - 1];
      setSelectedEntry(newEntry);
      scrollToEntry(newEntry.id);
    }
  };

  const handleNext = () => {
    if (currentIndex < (entriesWithDateContext?.length || 0) - 1 && entriesWithDateContext) {
      const newEntry = entriesWithDateContext[currentIndex + 1];
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

  if (entriesWithDateContext.length === 0) {
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
        <div className="flex flex-col h-full overflow-hidden">
          {/* Fixed Year Header - Always shows current entry's year */}
          {selectedEntry && (
            <div className="bg-gray-800 text-white font-bold py-2 px-4 text-center rounded-t-lg flex-shrink-0">
              {selectedEntry.date.getFullYear()}
            </div>
          )}
          
          <div
            ref={timelineRef}
            className="bg-[hsl(var(--scheme-ll-graph-bg))] rounded-b-lg p-5 overflow-y-auto overflow-x-hidden flex-1 min-h-0"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#565D6D #f0f0f0'
            }}
          >
            <div className="relative min-h-full" style={{ paddingTop: '2px', paddingBottom: '2px' }}>
              {/* Continuous centerline spanning entire timeline */}
              <div className="absolute left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2 z-0" style={{ backgroundColor: '#565D6D' }} />
              
              {entriesWithDateContext.map((entry, index) => {
                const isSelected = entry.id === selectedEntry?.id;
                const isNewCollection = entry.type === 'new_collection';
                const positive = isNewCollection || (entry.score >= 0);
                const score = entry.score || 0;
                const absScore = Math.abs(score);
                const stemWidthPercent = Math.min(absScore * 10, 100);
                const barColor = isNewCollection ? newCollectionColor : (positive ? positiveColor : negativeColor);
                
                return (
                  <div
                    key={entry.id}
                    ref={(el) => (entryRefs.current[entry.id] = el)}
                    className={cn(
                      "grid grid-cols-[1fr_1fr] gap-0 cursor-pointer transition-colors duration-200 py-3 rounded-lg",
                      isSelected && "bg-gray-100"
                    )}
                    onClick={() => setSelectedEntry(entry)}
                  >
                      {positive ? (
                        <>
                          <div className="flex items-center justify-end relative pr-0">
                            {/* Date pill - positioned at top of row, left of centerline */}
                            <div className="absolute right-[52%] -top-1 px-2 py-0.5 bg-white border border-gray-300 rounded-full text-[9px] font-semibold text-gray-600 shadow-sm z-20">
                              {entry.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                            <div className="flex items-center justify-end relative" style={{ width: `${stemWidthPercent}%` }}>
                              <div
                                className="flex-shrink-0 w-[50px] h-[50px] rounded-l-lg flex items-center justify-center font-bold text-xl border-[3px] bg-white z-10 relative"
                                style={{ borderColor: barColor, color: barColor }}
                              >
                                {score}
                              </div>
                              <div className="flex-1 h-[50px]" style={{ background: barColor }} />
                            </div>
                          </div>
                          <div className="flex items-center pl-4">
                            <div
                              className={cn(
                                "relative bg-white rounded-2xl px-4 py-3 max-w-[90%] transition-all duration-300",
                                isSelected && "border-[3px] shadow-lg"
                              )}
                              style={isSelected ? { borderColor: barColor } : {}}
                            >
                              <div className="absolute left-[-10px] top-[30px] w-0 h-0 border-t-[15px] border-b-0 border-r-[15px] border-transparent" style={{ borderRightColor: 'white' }} />
                              <div className="font-bold text-sm mb-1 text-[hsl(var(--scheme-ll-entry-title))]">
                                {isNewCollection ? `🎉 ${entry.collectionTitle}` : entry.entryTitle}
                              </div>
                              <div className="text-xs text-[hsl(var(--scheme-cards-text))] line-clamp-2">
                                {isNewCollection ? entry.collectionDescription || 'New collection added!' : entry.entryDescription || entry.entryTitle}
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-end pr-4 relative">
                            <div
                              className={cn(
                                "relative bg-white rounded-2xl px-4 py-3 max-w-[90%] transition-all duration-300",
                                isSelected && "border-[3px] shadow-lg"
                              )}
                              style={isSelected ? { borderColor: barColor } : {}}
                            >
                              <div className="absolute right-[-10px] top-[30px] w-0 h-0 border-t-[15px] border-b-0 border-l-[15px] border-transparent" style={{ borderLeftColor: 'white' }} />
                              <div className="font-bold text-sm mb-1 text-[hsl(var(--scheme-ll-entry-title))]">
                                {entry.entryTitle}
                              </div>
                              <div className="text-xs text-[hsl(var(--scheme-cards-text))] line-clamp-2">
                                {entry.entryDescription || entry.entryTitle}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-start pl-0">
                            {/* Date pill - positioned at top of row, left of centerline */}
                            <div className="absolute left-[48%] -translate-x-full -top-1 px-2 py-0.5 bg-white border border-gray-300 rounded-full text-[9px] font-semibold text-gray-600 shadow-sm z-20">
                              {entry.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                            <div className="flex items-center justify-start relative" style={{ width: `${stemWidthPercent}%` }}>
                              <div className="flex-1 h-[50px]" style={{ background: barColor }} />
                              <div
                                className="flex-shrink-0 w-[50px] h-[50px] rounded-r-lg flex items-center justify-center font-bold text-xl border-[3px] bg-white z-10 relative"
                                style={{ borderColor: barColor, color: barColor }}
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
              
              {/* Load More Button */}
              {hasNextPage && (
                <div className="flex justify-center py-4">
                  <Button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="bg-[hsl(var(--scheme-nav-button))] text-white"
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
      </div>

        {/* Right Panel - Entry Detail */}
        {selectedEntry && (
          <div className="flex flex-col h-full">
            <div className="overflow-y-auto flex-1 bg-white rounded-lg p-6">
              {/* Navigation Header with Dark Blue Background */}
              <div className="bg-[hsl(var(--scheme-nav-bg))] rounded-t-lg px-4 py-3 -mx-6 -mt-6 mb-6">
                <div className="flex justify-between items-center">
                  <Button
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    size="sm"
                    className="bg-[#e07857] hover:bg-[#d06847] text-white disabled:bg-gray-300"
                  >
                    ← Prev
                  </Button>
                  <div className="text-sm font-medium text-white">
                    Entry {currentIndex + 1} of {entriesWithDateContext.length}
                  </div>
                  <Button
                    onClick={handleNext}
                    disabled={currentIndex === (entriesWithDateContext?.length || 0) - 1}
                    size="sm"
                    className="bg-[#e07857] hover:bg-[#d06847] text-white disabled:bg-gray-300"
                  >
                    Next →
                  </Button>
                </div>
              </div>

              {selectedEntry.type === 'lifeline_entry' ? (
                <>
                  {selectedEntry.entryImage && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <img 
                        src={selectedEntry.entryImage} 
                        alt={selectedEntry.entryTitle}
                        className="w-full h-[300px] object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 mb-3">
                    <Badge 
                      className="text-lg px-4 py-1" 
                      style={{ 
                        backgroundColor: selectedEntry.score >= 0 ? positiveColor : negativeColor,
                        color: 'white'
                      }}
                    >
                      {selectedEntry.score}
                    </Badge>
                    <h2 className="text-2xl font-bold text-[hsl(var(--scheme-ll-entry-title))]">
                      {selectedEntry.entryTitle}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {selectedEntry.date.toLocaleDateString('en-US', { 
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  <div className="text-[hsl(var(--scheme-cards-text))] mb-6 whitespace-pre-wrap">
                    {selectedEntry.entryDescription || selectedEntry.entryTitle}
                  </div>

                  {/* Source Links Section */}
                  <div className="border-t pt-4 space-y-2">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">View in context:</h3>
                    <div className="flex flex-col gap-2">
                      {selectedEntry.lifelineId && selectedEntry.lifelineTitle && (
                        <Link
                          to={`/lifelines/${selectedEntry.lifelineId}`}
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>Full Lifeline: {selectedEntry.lifelineTitle}</span>
                        </Link>
                      )}
                      {selectedEntry.collectionId && selectedEntry.collectionTitle && (
                        <Link
                          to={`/collections/${selectedEntry.collectionId}`}
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>Collection: {selectedEntry.collectionTitle}</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                // New Collection Entry
                <>
                  {selectedEntry.collectionHeroImage && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <img 
                        src={selectedEntry.collectionHeroImage} 
                        alt={selectedEntry.collectionTitle}
                        className="w-full h-[300px] object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge className="bg-green-600 text-white">New Collection</Badge>
                    <Badge variant="outline">+10</Badge>
                  </div>
                  <h2 className="text-2xl font-bold mb-2 text-[hsl(var(--scheme-ll-entry-title))]">
                    {selectedEntry.collectionTitle}
                  </h2>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Added {selectedEntry.date.toLocaleDateString('en-US', { 
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  <div className="text-[hsl(var(--scheme-cards-text))] mb-6">
                    {selectedEntry.collectionDescription || 'New collection added!'}
                  </div>

                  <Link to={`/collections/${selectedEntry.collectionId}`}>
                    <Button className="bg-[#e07857] hover:bg-[#d06847] text-white">
                      Explore Collection <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
