import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FeedEntry } from '@/hooks/useFeedData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

type TimelineStyle = 'bands' | 'axis' | 'dividers' | 'compact';

export const FeedViewer = ({
  entries,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: FeedViewerProps) => {
  const [selectedEntry, setSelectedEntry] = useState<FeedEntry | null>(null);
  const [timelineStyle, setTimelineStyle] = useState<TimelineStyle>('bands');
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

  // Pre-process entries to add date metadata for time axis
  const entriesWithDateContext = useMemo(() => {
    if (!entries || entries.length === 0) return [];
    
    let lastYear: number | null = null;
    let lastMonth: number | null = null;
    
    return entries.map((entry, index) => {
      const year = entry.date.getFullYear();
      const month = entry.date.getMonth();
      const isNewYear = year !== lastYear;
      const isNewMonth = month !== lastMonth || isNewYear;
      
      // Calculate gap from previous entry
      const prevEntry = index > 0 ? entries[index - 1] : null;
      const gapMonths = prevEntry 
        ? Math.abs(differenceInMonths(entry.date, prevEntry.date))
        : 0;
      
      lastYear = year;
      lastMonth = month;
      
      return {
        ...entry,
        showYear: isNewYear,
        showMonth: isNewMonth,
        gapMonths,
        year,
        monthName: entry.date.toLocaleDateString('en-US', { month: 'short' })
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

  // Helper to format gap text
  const formatGap = (months: number) => {
    if (months >= 12) {
      const years = Math.floor(months / 12);
      return `${years} year${years > 1 ? 's' : ''}`;
    }
    return `${months} month${months > 1 ? 's' : ''}`;
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
        <div className="flex flex-col h-full">
          {/* Timeline Style Selector */}
          <div className="mb-3 flex items-center gap-2">
            <span className="text-sm font-medium text-[hsl(var(--scheme-cards-text))]">Timeline Style:</span>
            <Select value={timelineStyle} onValueChange={(value) => setTimelineStyle(value as TimelineStyle)}>
              <SelectTrigger className="w-[180px] bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bands">Color Bands</SelectItem>
                <SelectItem value="axis">Classic Axis</SelectItem>
                <SelectItem value="dividers">Divider Lines</SelectItem>
                <SelectItem value="compact">Compact Pills</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div
            ref={timelineRef}
            className="bg-[hsl(var(--scheme-ll-graph-bg))] rounded-lg p-5 overflow-y-auto flex-1"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#565D6D #f0f0f0'
            }}
          >
            <div className="relative min-h-full" style={{ paddingTop: '2px', paddingBottom: '2px' }}>
              {timelineStyle === 'bands' && (
                // Color Bands Style
                <>
                  {entriesWithDateContext.map((entry, index) => {
                    const isSelected = entry.id === selectedEntry?.id;
                    const isNewCollection = entry.type === 'new_collection';
                    const positive = isNewCollection || (entry.score >= 0);
                    const score = entry.score || 0;
                    const absScore = Math.abs(score);
                    const stemWidthPercent = Math.min(absScore * 10, 100);
                    const barColor = isNewCollection ? newCollectionColor : (positive ? positiveColor : negativeColor);
                    
                    // Alternating background for months
                    const bgColor = entry.showMonth ? (index % 2 === 0 ? 'bg-gray-50/30' : 'bg-blue-50/20') : '';
                    
                    return (
                      <div key={entry.id}>
                        {/* Year header with bold background */}
                        {entry.showYear && (
                          <div className="sticky top-0 z-20 bg-gray-800 text-white font-bold py-2 px-4 text-center mb-2">
                            {entry.year}
                          </div>
                        )}
                        {/* Month header if new month but not new year */}
                        {entry.showMonth && !entry.showYear && (
                          <div className="sticky top-0 z-20 bg-gray-200 text-gray-700 font-semibold py-1 px-4 text-sm mb-2">
                            {entry.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          </div>
                        )}
                        
                        <div
                          ref={(el) => (entryRefs.current[entry.id] = el)}
                          className={cn(
                            "grid grid-cols-[1fr_1fr] gap-0 cursor-pointer transition-colors duration-200 py-3",
                            bgColor,
                            isSelected && "ring-2 ring-offset-2 ring-blue-500"
                          )}
                          onClick={() => setSelectedEntry(entry)}
                        >
                          {positive ? (
                            <>
                              <div className="flex items-center justify-end relative pr-0">
                                <div className="absolute right-0 top-0 bottom-0 w-[2px]" style={{ backgroundColor: '#565D6D' }} />
                                <div className="flex items-center justify-end" style={{ width: `${stemWidthPercent}%` }}>
                                  {/* Date badge above score box */}
                                  <div className="absolute -top-6 left-0 text-[10px] text-muted-foreground font-medium px-2 py-0.5 bg-white rounded border border-gray-200">
                                    {entry.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </div>
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
                                <div className="absolute right-0 top-0 bottom-0 w-[2px]" style={{ backgroundColor: '#565D6D' }} />
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
                                <div className="flex items-center justify-start relative" style={{ width: `${stemWidthPercent}%` }}>
                                  {/* Date badge above score box */}
                                  <div className="absolute -top-6 right-0 text-[10px] text-muted-foreground font-medium px-2 py-0.5 bg-white rounded border border-gray-200">
                                    {entry.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </div>
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
                </>
              )}
              
              {timelineStyle === 'axis' && (
                // Classic Axis Style
                <>
                  {entriesWithDateContext.map((entry, index) => {
                    const isSelected = entry.id === selectedEntry?.id;
                    const isNewCollection = entry.type === 'new_collection';
                    const positive = isNewCollection || (entry.score >= 0);
                    const score = entry.score || 0;
                    const absScore = Math.abs(score);
                    const stemWidthPercent = Math.min(absScore * 10, 100);
                    const barColor = isNewCollection ? newCollectionColor : (positive ? positiveColor : negativeColor);
                    
                    return (
                      <div key={entry.id}>
                        {/* Year tick mark */}
                        {entry.showYear && (
                          <div className="flex items-center my-3">
                            <div className="w-3 h-3 bg-gray-700 rounded-full" />
                            <div className="h-[2px] w-16 bg-gray-700" />
                            <span className="ml-2 font-bold text-gray-700">{entry.year}</span>
                          </div>
                        )}
                        {/* Month tick mark */}
                        {entry.showMonth && !entry.showYear && (
                          <div className="flex items-center my-2">
                            <div className="w-2 h-2 bg-gray-500 rounded-full" />
                            <div className="h-[1px] w-12 bg-gray-500" />
                            <span className="ml-2 text-xs text-gray-600">{entry.monthName}</span>
                          </div>
                        )}
                        
                        <div
                          ref={(el) => (entryRefs.current[entry.id] = el)}
                          className={cn(
                            "grid grid-cols-[16px_1fr_1fr] gap-0 cursor-pointer transition-colors duration-200",
                            isSelected && "bg-gray-50/50"
                          )}
                          style={{ minHeight: '100px' }}
                          onClick={() => setSelectedEntry(entry)}
                        >
                          {/* Vertical axis line */}
                          <div className="flex justify-center relative">
                            <div className="w-[3px] bg-gray-600 absolute top-0 bottom-0" />
                            <div className="w-2 h-2 bg-gray-600 rounded-full absolute top-[40px] z-10" />
                          </div>
                          
                          {positive ? (
                            <>
                              <div className="flex items-center justify-end relative pr-0 py-3">
                                <div className="absolute right-0 top-0 bottom-0 w-[2px]" style={{ backgroundColor: '#565D6D' }} />
                                <div className="flex items-center justify-end" style={{ width: `${stemWidthPercent}%` }}>
                                  <div className="absolute -top-6 left-0 text-[10px] text-muted-foreground font-medium px-2 py-0.5 bg-white rounded border border-gray-200">
                                    {entry.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </div>
                                  <div
                                    className="flex-shrink-0 w-[50px] h-[50px] rounded-l-lg flex items-center justify-center font-bold text-xl border-[3px] bg-white z-10 relative"
                                    style={{ borderColor: barColor, color: barColor }}
                                  >
                                    {score}
                                  </div>
                                  <div className="flex-1 h-[50px]" style={{ background: barColor }} />
                                </div>
                              </div>
                              <div className="flex items-center pl-4 py-3">
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
                              <div className="flex items-center justify-end pr-4 relative py-3">
                                <div className="absolute right-0 top-0 bottom-0 w-[2px]" style={{ backgroundColor: '#565D6D' }} />
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
                              <div className="flex items-center justify-start pl-0 py-3">
                                <div className="flex items-center justify-start relative" style={{ width: `${stemWidthPercent}%` }}>
                                  <div className="absolute -top-6 right-0 text-[10px] text-muted-foreground font-medium px-2 py-0.5 bg-white rounded border border-gray-200">
                                    {entry.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </div>
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
                </>
              )}
              
              {timelineStyle === 'dividers' && (
                // Divider Lines Style
                <>
                  {entriesWithDateContext.map((entry, index) => {
                    const isSelected = entry.id === selectedEntry?.id;
                    const isNewCollection = entry.type === 'new_collection';
                    const positive = isNewCollection || (entry.score >= 0);
                    const score = entry.score || 0;
                    const absScore = Math.abs(score);
                    const stemWidthPercent = Math.min(absScore * 10, 100);
                    const barColor = isNewCollection ? newCollectionColor : (positive ? positiveColor : negativeColor);
                    
                    return (
                      <div key={entry.id}>
                        {/* Month/Year divider */}
                        {entry.showMonth && (
                          <div className="flex items-center gap-3 my-4">
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-gray-300" />
                            <div className="px-4 py-1.5 bg-gradient-to-r from-gray-100 to-gray-50 rounded-full border border-gray-300 text-sm font-semibold text-gray-700 shadow-sm">
                              {entry.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </div>
                            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-gray-300 to-gray-300" />
                          </div>
                        )}
                        
                        <div
                          ref={(el) => (entryRefs.current[entry.id] = el)}
                          className={cn(
                            "grid grid-cols-[1fr_1fr] gap-0 cursor-pointer transition-colors duration-200 py-3",
                            isSelected && "bg-gray-50/50"
                          )}
                          onClick={() => setSelectedEntry(entry)}
                        >
                          {positive ? (
                            <>
                              <div className="flex items-center justify-end relative pr-0">
                                <div className="absolute right-0 top-0 bottom-0 w-[2px]" style={{ backgroundColor: '#565D6D' }} />
                                <div className="flex items-center justify-end" style={{ width: `${stemWidthPercent}%` }}>
                                  <div className="absolute -top-6 left-0 text-[10px] text-muted-foreground font-medium px-2 py-0.5 bg-white rounded border border-gray-200">
                                    {entry.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </div>
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
                                <div className="absolute right-0 top-0 bottom-0 w-[2px]" style={{ backgroundColor: '#565D6D' }} />
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
                                <div className="flex items-center justify-start relative" style={{ width: `${stemWidthPercent}%` }}>
                                  <div className="absolute -top-6 right-0 text-[10px] text-muted-foreground font-medium px-2 py-0.5 bg-white rounded border border-gray-200">
                                    {entry.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </div>
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
                </>
              )}
              
              {timelineStyle === 'compact' && (
                // Compact with Date Pills Style
                <>
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
                          "grid grid-cols-[1fr_1fr] gap-0 cursor-pointer transition-colors duration-200 py-3 relative",
                          isSelected && "bg-gray-50/50"
                        )}
                        onClick={() => setSelectedEntry(entry)}
                      >
                        {positive ? (
                          <>
                            <div className="flex items-center justify-end relative pr-0">
                              <div className="absolute right-0 top-0 bottom-0 w-[2px]" style={{ backgroundColor: '#565D6D' }} />
                              {/* Date pill on centerline */}
                              <div className="absolute right-[-28px] top-2 px-2 py-1 bg-white border border-gray-300 rounded-full text-[9px] font-semibold text-gray-600 shadow-sm z-20" style={{ transform: 'translateX(-50%)' }}>
                                {entry.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </div>
                              <div className="flex items-center justify-end" style={{ width: `${stemWidthPercent}%` }}>
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
                              <div className="absolute right-0 top-0 bottom-0 w-[2px]" style={{ backgroundColor: '#565D6D' }} />
                              {/* Date pill on centerline */}
                              <div className="absolute right-[-28px] top-2 px-2 py-1 bg-white border border-gray-300 rounded-full text-[9px] font-semibold text-gray-600 shadow-sm z-20" style={{ transform: 'translateX(-50%)' }}>
                                {entry.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </div>
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
                              <div className="flex items-center justify-start" style={{ width: `${stemWidthPercent}%` }}>
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
                </>
              )}
              
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
                  Entry {currentIndex + 1} of {entriesWithDateContext.length}
                </div>
                <div className="justify-self-end">
                  <Button
                    size="sm"
                    onClick={handleNext}
                    disabled={currentIndex === entriesWithDateContext.length - 1}
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
                  <h2 className="text-3xl font-bold mb-2 text-[hsl(var(--scheme-title-text))]">
                    {selectedEntry.collectionTitle}
                  </h2>
                  <div className="flex items-center gap-1.5 text-sm text-[hsl(var(--scheme-cards-text))] opacity-70 mb-4">
                    <Calendar className="h-4 w-4" />
                    Added {selectedEntry.date.toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
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
                      <div className="flex items-center gap-1.5 text-sm text-[hsl(var(--scheme-cards-text))] opacity-70 mt-1">
                        <Calendar className="h-4 w-4" />
                        {selectedEntry.date.toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
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