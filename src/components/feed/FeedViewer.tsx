import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FeedEntry } from '@/hooks/useFeedData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

import { Loader2, ExternalLink, Calendar, ArrowUp, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { differenceInMonths } from 'date-fns';

interface FeedViewerProps {
  entries: FeedEntry[];
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  seenIds: Set<string>;
  seenFilter: 'unseen' | 'seen' | 'all';
  onToggleSeen: (entryId: string) => void;
}

export const FeedViewer = ({
  entries,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  seenIds,
  seenFilter,
  onToggleSeen,
}: FeedViewerProps) => {
  const [selectedEntry, setSelectedEntry] = useState<FeedEntry | null>(null);
  const [visibleYear, setVisibleYear] = useState<number | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [highlightedEntryId, setHighlightedEntryId] = useState<string | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const entryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const yearHeaderRefs = useRef<{ [year: number]: HTMLDivElement | null }>({});
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get colors from CSS variables with fallbacks
  const positiveColor = getComputedStyle(document.documentElement).getPropertyValue('--scheme-ll-graph-positive') 
    ? `hsl(${getComputedStyle(document.documentElement).getPropertyValue('--scheme-ll-graph-positive')})` 
    : "#16a34a";
  const negativeColor = getComputedStyle(document.documentElement).getPropertyValue('--scheme-ll-graph-negative')
    ? `hsl(${getComputedStyle(document.documentElement).getPropertyValue('--scheme-ll-graph-negative')})`
    : "#dc2626";
  const newCollectionColor = "#2563eb"; // Blue for new collections

  // Filter entries based on seen status
  const filteredEntries = useMemo(() => {
    if (seenFilter === 'all') return entries;
    if (seenFilter === 'seen') return entries.filter(e => seenIds.has(e.id));
    return entries.filter(e => !seenIds.has(e.id)); // unseen
  }, [entries, seenIds, seenFilter]);

  // Pre-process entries to add date metadata for sticky year headers
  const entriesWithDateContext = useMemo(() => {
    if (!filteredEntries || filteredEntries.length === 0) return [];
    
    let lastYear: number | null = null;
    
    return filteredEntries.map((entry, index) => {
      const year = entry.date.getFullYear();
      const isNewYear = year !== lastYear;
      
      // Calculate gap from previous entry
      const prevEntry = index > 0 ? filteredEntries[index - 1] : null;
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
  }, [filteredEntries]);

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

  // Track visible year and handle scroll-driven selection
  useEffect(() => {
    const handleScroll = () => {
      if (!timelineRef.current) return;
      
      // Mark as scrolling
      setIsScrolling(true);
      
      // Clear previous timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      const container = timelineRef.current;
      const containerRect = container.getBoundingClientRect();
      const containerTop = containerRect.top;
      const targetY = containerTop + containerRect.height * 0.25; // Focus zone at 25% from top
      
      // Track scroll position for back-to-top button
      setShowBackToTop(container.scrollTop > 300);
      
      // Find which entry is at the target position (focus zone)
      let closestEntry: FeedEntry | null = null;
      let closestDistance = Infinity;
      
      entriesWithDateContext.forEach((entry) => {
        const el = entryRefs.current[entry.id];
        if (el) {
          const rect = el.getBoundingClientRect();
          const entryCenter = rect.top + rect.height / 2;
          const distance = Math.abs(entryCenter - targetY);
          
          if (distance < closestDistance) {
            closestDistance = distance;
            closestEntry = entry;
          }
        }
      });
      
      // Update highlighted entry (visual only during scroll)
      if (closestEntry) {
        setHighlightedEntryId(closestEntry.id);
      }
      
      // Track visible year for year headers
      let currentYear = entriesWithDateContext[0]?.year;
      Object.entries(yearHeaderRefs.current).forEach(([year, el]) => {
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= containerTop + 60) {
            currentYear = parseInt(year);
          }
        }
      });
      setVisibleYear(currentYear);
      
      // Debounce: After 250ms of no scrolling, commit selection
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
        if (closestEntry) {
          setSelectedEntry(closestEntry);
        }
      }, 250);
    };
    
    const container = timelineRef.current;
    container?.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    
    return () => {
      container?.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [entriesWithDateContext]);

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
          {/* Fixed Year Header - Shows year of highlighted entry during scroll, or selected entry */}
          {(() => {
            const highlightedEntry = entriesWithDateContext.find(e => e.id === highlightedEntryId);
            const displayYear = isScrolling 
              ? highlightedEntry?.year
              : selectedEntry?.date?.getFullYear();
            return displayYear || visibleYear || entriesWithDateContext[0]?.year;
          })() && (
            <div className="bg-gray-800 text-white font-bold py-2 px-4 text-center rounded-t-lg flex-shrink-0">
              {(() => {
                const highlightedEntry = entriesWithDateContext.find(e => e.id === highlightedEntryId);
                const displayYear = isScrolling 
                  ? highlightedEntry?.year
                  : selectedEntry?.date?.getFullYear();
                return displayYear || visibleYear || entriesWithDateContext[0]?.year;
              })()}
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
              {/* Continuous timeline line - absolute positioned at container level */}
              <div 
                className="absolute w-[1px] bg-gray-300" 
                style={{ 
                  left: '25px', // Center of 50px timeline column
                  top: 0,
                  bottom: 0,
                  zIndex: 0
                }}
              />
              
              {/* Continuous graph centerline - absolute positioned at container level */}
              <div 
                className="absolute w-[2px] bg-[#565D6D]" 
                style={{ 
                  left: 'calc(50% + 25px)', // 50% of container + half of timeline column = exact center of graph area
                  top: 0,
                  bottom: 0,
                  zIndex: 0
                }}
              />
              {entriesWithDateContext.map((entry, index) => {
                const isSelected = entry.id === selectedEntry?.id;
                const isNewCollection = entry.type === 'new_collection';
                const positive = isNewCollection || (entry.score >= 0);
                const score = entry.score || 0;
                const absScore = Math.abs(score);
                const stemWidthPercent = Math.min(absScore * 10, 100);
                const barColor = isNewCollection ? newCollectionColor : (positive ? positiveColor : negativeColor);
                
                return (
                  <div key={`wrapper-${entry.id}`}>
                    {/* Year break header - appears when year changes AND not same as first entry year (which is in sticky header) */}
                    {entry.showYear && entry.year !== entriesWithDateContext[0]?.year && (
                      <div className="grid gap-0 grid-cols-[50px_1fr_1fr]">
                        {/* Timeline axis column - line continues through year header */}
                        <div className="relative flex items-center justify-center">
                        </div>
                        {/* Year header spanning both graph columns */}
                        <div 
                          ref={(el) => (yearHeaderRefs.current[entry.year] = el)}
                          className="bg-gray-700 text-white font-bold py-2 px-4 text-center rounded-lg mb-2 mt-2 z-10 relative col-span-2"
                        >
                          {entry.year}
                        </div>
                      </div>
                    )}
                    
                    {/* Entry row */}
                    <div
                      ref={(el) => (entryRefs.current[entry.id] = el)}
                      className={cn(
                        "grid gap-0 cursor-pointer transition-colors duration-150 py-3 rounded-lg grid-cols-[50px_1fr_1fr] relative",
                        (isScrolling ? entry.id === highlightedEntryId : isSelected) && "bg-gray-100"
                      )}
                      onClick={() => setSelectedEntry(entry)}
                    >
                      {/* Eye icon - upper right of entire gray area */}
                      {(isScrolling ? entry.id === highlightedEntryId : isSelected) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleSeen(entry.id);
                          }}
                          className="absolute top-2 right-2 z-40 p-1.5 rounded-full hover:bg-gray-200 transition-colors"
                          title={seenIds.has(entry.id) ? "Mark as unseen" : "Mark as seen"}
                        >
                          {seenIds.has(entry.id) ? (
                            <EyeOff className="h-4 w-4 text-gray-600" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-600" />
                          )}
                        </button>
                      )}
                      {/* TIMELINE AXIS COLUMN */}
                      <div className="relative flex items-center justify-center">
                        {/* Date pill centered on line - using numeric format for narrow width */}
                        <div className="relative z-10 px-2 py-0.5 bg-white border border-gray-300 rounded-full text-[9px] font-semibold text-gray-600 shadow-sm whitespace-nowrap">
                          {entry.date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                        </div>
                      </div>
                      {positive ? (
                        <>
                          <div className="flex items-center justify-end relative pr-0">
                            {isNewCollection && entry.collectionHeroImage ? (
                              // Hero image with vertical NEW ribbon
                              <div className="flex items-center justify-end" style={{ width: `${stemWidthPercent}%` }}>
                                <div 
                                  className="flex-shrink-0 bg-[#2563eb] flex items-center justify-center rounded-l-lg"
                                  style={{ height: '50px', width: '28px' }}
                                >
                                  <span 
                                    className="text-white font-bold text-xs tracking-wider"
                                    style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                                  >
                                    NEW
                                  </span>
                                </div>
                                <div className="flex-1 overflow-hidden" style={{ height: '50px' }}>
                                  <img 
                                    src={entry.collectionHeroImage} 
                                    alt={entry.collectionTitle || 'New Collection'}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </div>
                            ) : (
                              // Score bar (default or fallback for collections without images)
                              <div className="flex items-center justify-end relative" style={{ width: `${stemWidthPercent}%` }}>
                                <div
                                  className="flex-shrink-0 w-[50px] h-[50px] rounded-l-lg flex items-center justify-center font-bold text-xl border-[3px] bg-white z-10 relative"
                                  style={{ borderColor: barColor, color: barColor }}
                                >
                                  {isNewCollection ? 'NC' : score}
                                </div>
                                <div 
                                  className="flex-1 h-[50px] flex items-center justify-center" 
                                  style={{ background: barColor }}
                                >
                                  {isNewCollection && (
                                    <span className="text-white font-bold text-sm whitespace-nowrap">
                                      New Collection
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                           <div className="flex items-center pl-4 relative">
                            <div
                              className={cn(
                                "relative bg-white rounded-2xl px-4 py-3 max-w-[90%] transition-all duration-300",
                                isSelected && "border-[3px] shadow-lg"
                              )}
                              style={isSelected ? { borderColor: barColor } : {}}
                            >
                              <div className="absolute left-[-10px] top-[30px] w-0 h-0 border-t-[15px] border-b-0 border-r-[15px] border-transparent" style={{ borderRightColor: 'white' }} />
                              <div className="font-bold text-sm mb-1 text-[hsl(var(--scheme-ll-entry-title))]">
                                {isNewCollection ? `🎉 ${entry.collectionTitle}` : (entry.collectionTitle || entry.lifelineTitle || 'News')}
                              </div>
                              <div className="text-xs text-[hsl(var(--scheme-cards-text))] line-clamp-2">
                                {isNewCollection ? entry.collectionDescription || 'New collection added!' : entry.entryTitle}
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
                                {entry.collectionTitle || entry.lifelineTitle || 'News'}
                              </div>
                              <div className="text-xs text-[hsl(var(--scheme-cards-text))] line-clamp-2">
                                {entry.entryTitle}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-start pl-0">
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
                  </div>
                );
              })}
              
              {/* Load More Button */}
              {hasNextPage && (
                <div className="flex justify-center py-4 z-10 relative">
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
              
              {/* Back to Top Button */}
              {showBackToTop && (
                <Button
                  onClick={() => {
                    if (timelineRef.current) {
                      timelineRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className="absolute bottom-4 right-4 z-20 rounded-full bg-[hsl(var(--scheme-nav-button))] hover:bg-[hsl(var(--scheme-nav-button))]/90 shadow-lg"
                  size="icon"
                  title="Back to top"
                >
                  <ArrowUp className="h-5 w-5" />
                </Button>
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
                    className="bg-[hsl(var(--scheme-nav-button))] hover:bg-[hsl(var(--scheme-nav-button))]/90 text-white disabled:bg-gray-300"
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
                    className="bg-[hsl(var(--scheme-nav-button))] hover:bg-[hsl(var(--scheme-nav-button))]/90 text-white disabled:bg-gray-300"
                  >
                    Next →
                  </Button>
                </div>
              </div>

              {isScrolling ? (
                // Show scrolling indicator
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Scrolling...</span>
                </div>
              ) : selectedEntry.type === 'lifeline_entry' ? (
                <>
                  {selectedEntry.entryImages && selectedEntry.entryImages.length > 0 && (
                    <div className="mb-4 relative">
                      <Carousel className="w-full">
                        <CarouselContent>
                          {selectedEntry.entryImages.map((img) => (
                            <CarouselItem key={img.id}>
                              <div className="relative overflow-hidden rounded-lg">
                                <img
                                  src={img.url}
                                  alt={img.alt_text || selectedEntry.entryTitle}
                                  className="w-full aspect-video object-cover rounded-lg"
                                  style={{
                                    objectPosition: `${img.position_x ?? 50}% ${img.position_y ?? 50}%`,
                                    transform: `scale(${img.scale ?? 1})`,
                                    transformOrigin: `${img.position_x ?? 50}% ${img.position_y ?? 50}%`
                                  }}
                                />
                              </div>
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        {selectedEntry.entryImages.length > 1 && (
                          <>
                            <CarouselPrevious className="left-2" />
                            <CarouselNext className="right-2" />
                          </>
                        )}
                      </Carousel>
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
                    <button
                      onClick={() => onToggleSeen(selectedEntry.id)}
                      className="ml-2 p-1 hover:bg-muted rounded-md transition-colors"
                      title={seenIds.has(selectedEntry.id) ? "Mark as unseen" : "Mark as seen"}
                    >
                      {seenIds.has(selectedEntry.id) ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  <div className="text-[hsl(var(--scheme-cards-text))] mb-6 whitespace-pre-wrap">
                    {selectedEntry.entryDescription || selectedEntry.entryTitle}
                  </div>

                  {/* Source Links Section */}
                  <div className="border-t pt-4 space-y-2">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">View in context:</h3>
                    <div className="flex flex-col gap-2">
                      {selectedEntry.lifelineSlug && selectedEntry.collectionSlug && (
                        <Link
                          to={`/public/collections/${selectedEntry.collectionSlug}/lifelines/${selectedEntry.lifelineSlug}`}
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>Full Lifeline: {selectedEntry.lifelineTitle}</span>
                        </Link>
                      )}
                      {selectedEntry.collectionSlug && selectedEntry.collectionTitle && (
                        <Link
                          to={`/public/collections/${selectedEntry.collectionSlug}`}
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
                    <button
                      onClick={() => onToggleSeen(selectedEntry.id)}
                      className="ml-2 p-1 hover:bg-muted rounded-md transition-colors"
                      title={seenIds.has(selectedEntry.id) ? "Mark as unseen" : "Mark as seen"}
                    >
                      {seenIds.has(selectedEntry.id) ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  <div className="text-[hsl(var(--scheme-cards-text))] mb-6">
                    {selectedEntry.collectionDescription || 'New collection added!'}
                  </div>

                  <Link to={`/public/collections/${selectedEntry.collectionSlug}`}>
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
