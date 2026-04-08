/**
 * VideoLifelineViewer
 *
 * Pure presentational copy of `LifelineViewer` for use in Remotion video
 * compositions (see thread [2G-C] "UI to Video Pipeline" / Track C in the
 * OpenClaw vault).
 *
 * This is a DUPLICATE of the production `LifelineViewer.tsx`, not a refactor.
 * The production component is untouched. Nothing in LP's live site imports
 * this file — it exists solely to be consumed by Remotion compositions via
 * a tsconfig path alias.
 *
 * Differences from production:
 *   - All data comes in via props. No Supabase, no useQuery, no data fetching.
 *   - No auth, no useSuperFan, no admin features.
 *   - No mutations, no edit dialogs, no image upload, no SerpAPI/Nano buttons.
 *   - No contribution dialogs or auth modals.
 *   - No `useIsMobile` bail — the video author picks desktop or mobile.
 *   - No scroll-to-selected effects (Remotion renders are stateless per frame).
 *   - Media carousel is simplified to a single image (first media item).
 *   - Navigation Prev/Next buttons are visual unless `onSelectEntry` is provided.
 *   - Colors default to standard green/red; overridable via props.
 *
 * Drift policy: when LP's production lifeline rendering changes, this file
 * must be manually synced. Accepted tradeoff per 2026-04-08 decision — lifeline
 * visual design is considered stable enough for manual sync to be cheap.
 */

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { parseLifelineTitle } from "@/lib/lifelineTitle";
import { Calendar } from "lucide-react";

// --- Types -----------------------------------------------------------------

export interface VideoLifelineEntry {
  id: string;
  title: string;
  summary?: string | null;
  details?: string | null;
  score?: number | null;
  occurred_on?: string | null;
  media?: Array<{
    url: string;
    alt_text?: string | null;
    position_x?: number | null;
    position_y?: number | null;
    scale?: number | null;
  }>;
}

export interface VideoLifeline {
  title: string;
  subtitle?: string | null;
  lifeline_type?: string | null;
}

export interface VideoLifelineViewerProps {
  entries: VideoLifelineEntry[];
  lifeline: VideoLifeline;
  /** Which entry to highlight in the timeline and show in the detail pane. If null, first entry is shown. */
  selectedEntryId?: string | null;
  /** Optional callback for interactive contexts. Videos typically omit this. */
  onSelectEntry?: (id: string) => void;
  /** 'bars-plus-detail' (default) renders the 2-column layout; 'bars-only' hides the detail pane. */
  mode?: "bars-only" | "bars-plus-detail";
  positiveColor?: string;
  negativeColor?: string;
  /** Override `lifeline.lifeline_type` for sorting/title parsing. */
  lifelineType?: string;
}

const DEFAULT_POSITIVE = "#16a34a";
const DEFAULT_NEGATIVE = "#dc2626";
const CENTERLINE_COLOR = "#565D6D";

// --- Component -------------------------------------------------------------

export function VideoLifelineViewer({
  entries,
  lifeline,
  selectedEntryId = null,
  onSelectEntry,
  mode = "bars-plus-detail",
  positiveColor = DEFAULT_POSITIVE,
  negativeColor = DEFAULT_NEGATIVE,
  lifelineType,
}: VideoLifelineViewerProps) {
  const effectiveType = lifelineType || lifeline.lifeline_type || "list";

  // Process entries: sort by score for "rating" type or "list" if uniform sentiment
  const sortedEntries = useMemo(() => {
    if (!entries || entries.length === 0) return [];

    if (effectiveType === "rating") {
      return [...entries].sort((a, b) => {
        const scoreDiff = (b.score || 0) - (a.score || 0);
        if (scoreDiff !== 0) return scoreDiff;
        return (a.title || "").localeCompare(b.title || "");
      });
    }

    if (effectiveType === "list") {
      const allPositive = entries.every((e) => (e.score || 0) >= 0);
      const allNegative = entries.every((e) => (e.score || 0) < 0);
      if (allPositive || allNegative) {
        return [...entries].sort((a, b) => (b.score || 0) - (a.score || 0));
      }
    }

    return entries;
  }, [entries, effectiveType]);

  const selected = useMemo(() => {
    if (sortedEntries.length === 0) return null;
    if (!selectedEntryId) return sortedEntries[0];
    return sortedEntries.find((e) => e.id === selectedEntryId) || sortedEntries[0];
  }, [selectedEntryId, sortedEntries]);

  const currentIndex = useMemo(() => {
    if (!selected) return -1;
    return sortedEntries.findIndex((e) => e.id === selected.id);
  }, [selected, sortedEntries]);

  const handlePrevious = () => {
    if (currentIndex > 0 && onSelectEntry) {
      onSelectEntry(sortedEntries[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (currentIndex < sortedEntries.length - 1 && onSelectEntry) {
      onSelectEntry(sortedEntries[currentIndex + 1].id);
    }
  };

  if (!sortedEntries || sortedEntries.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No entries
      </div>
    );
  }

  const parsed = parseLifelineTitle(lifeline.title, effectiveType);

  return (
    <Card className="lg:p-6 lg:pb-4 md:p-2 p-1 pb-1 border-[hsl(var(--scheme-nav-bg))] bg-[hsl(var(--scheme-ll-display-bg))]">
      <CardHeader className="lg:pt-2 pt-0 px-0 bg-[hsl(var(--scheme-ll-display-bg))]">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-2 lg:gap-0">
          <div className="flex-1">
            {parsed.isPersonType ? (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-2xl lg:text-2xl md:text-xl sm:text-lg font-bold uppercase tracking-wide text-[hsl(var(--scheme-person-name-accent))]">
                  {parsed.personName}
                </span>
                <span className="text-[hsl(var(--scheme-person-name-accent))] opacity-30 text-2xl">│</span>
                <span className="text-xl lg:text-xl md:text-lg sm:text-base text-[hsl(var(--scheme-cards-text))]">
                  {parsed.contextTitle}
                </span>
              </div>
            ) : (
              <CardTitle className="text-2xl lg:text-2xl md:text-xl sm:text-lg leading-tight text-[hsl(var(--scheme-title-text))]">
                {lifeline.title}
              </CardTitle>
            )}
            {lifeline.subtitle && (
              <p className="text-sm lg:text-base text-[hsl(var(--scheme-cards-text))] opacity-70">
                {lifeline.subtitle}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-0 lg:px-6 pt-0 flex flex-col lg:block overflow-visible bg-[hsl(var(--scheme-ll-display-bg))]">
        <div
          className={cn(
            "grid gap-8",
            mode === "bars-plus-detail" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
          )}
        >
          {/* Timeline — vertical bar chart */}
          <div className="bg-[hsl(var(--scheme-ll-graph-bg))] rounded-lg p-5">
            <div className="relative" style={{ paddingTop: "2px", paddingBottom: "2px" }}>
              {sortedEntries.map((entry) => {
                const isSelected = entry.id === selected?.id;
                const rawScore = entry.score || 0;
                const positive = rawScore >= 0;
                const absScore = Math.abs(rawScore);
                const stemWidthPercent = Math.min(absScore * 10, 100);
                const barColor = positive ? positiveColor : negativeColor;

                return (
                  <div
                    key={entry.id}
                    className={cn(
                      "grid grid-cols-2 gap-0 transition-colors duration-200",
                      onSelectEntry && "cursor-pointer",
                      isSelected && "bg-gray-50/50"
                    )}
                    style={{ minHeight: "100px" }}
                    onClick={() => onSelectEntry?.(entry.id)}
                  >
                    {positive ? (
                      <>
                        {/* Left column — score box + stem, ending at centerline */}
                        <div className="flex items-center justify-end relative pr-0 py-3">
                          <div
                            className="absolute right-0 top-0 bottom-0 w-[2px]"
                            style={{ backgroundColor: CENTERLINE_COLOR }}
                          />
                          <div
                            className="flex items-center justify-end"
                            style={{ width: `${stemWidthPercent}%` }}
                          >
                            <div
                              className="flex-shrink-0 w-[50px] h-[50px] rounded-l-lg flex items-center justify-center font-bold text-xl border-[3px] bg-white z-10 relative"
                              style={{ borderColor: barColor, color: barColor }}
                            >
                              {absScore}
                            </div>
                            <div
                              className="flex-1 h-[50px]"
                              style={{ background: barColor }}
                            />
                          </div>
                        </div>
                        {/* Right column — chat bubble */}
                        <div className="flex items-center pl-4 py-3">
                          <div
                            className={cn(
                              "relative bg-white rounded-2xl px-4 py-3 max-w-[90%] transition-all duration-300",
                              isSelected && "border-[3px] shadow-lg"
                            )}
                            style={isSelected ? { borderColor: barColor } : {}}
                          >
                            <div
                              className="absolute left-[-10px] top-[30px] w-0 h-0 border-t-[15px] border-b-0 border-r-[15px] border-transparent"
                              style={{ borderRightColor: "white" }}
                            />
                            <div className="font-bold text-sm mb-1 text-[hsl(var(--scheme-ll-entry-title))]">
                              {entry.title}
                            </div>
                            <div className="text-xs text-[hsl(var(--scheme-title-text))] line-clamp-2">
                              {entry.summary || entry.details}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Left column — chat bubble */}
                        <div className="flex items-center justify-end pr-4 relative py-3">
                          <div
                            className="absolute right-0 top-0 bottom-0 w-[2px]"
                            style={{ backgroundColor: CENTERLINE_COLOR }}
                          />
                          <div
                            className={cn(
                              "relative bg-white rounded-2xl px-4 py-3 max-w-[90%] transition-all duration-300",
                              isSelected && "border-[3px] shadow-lg"
                            )}
                            style={isSelected ? { borderColor: barColor } : {}}
                          >
                            <div
                              className="absolute right-[-10px] top-[30px] w-0 h-0 border-t-[15px] border-b-0 border-l-[15px] border-transparent"
                              style={{ borderLeftColor: "white" }}
                            />
                            <div className="font-bold text-sm mb-1 text-[hsl(var(--scheme-ll-entry-title))]">
                              {entry.title}
                            </div>
                            <div className="text-xs text-[hsl(var(--scheme-title-text))] line-clamp-2">
                              {entry.summary || entry.details}
                            </div>
                          </div>
                        </div>
                        {/* Right column — stem + score box */}
                        <div className="flex items-center justify-start pl-0 py-3">
                          <div
                            className="flex items-center justify-start"
                            style={{ width: `${stemWidthPercent}%` }}
                          >
                            <div
                              className="flex-1 h-[50px]"
                              style={{ background: barColor }}
                            />
                            <div
                              className="flex-shrink-0 w-[50px] h-[50px] rounded-r-lg flex items-center justify-center font-bold text-xl border-[3px] bg-white z-10 relative"
                              style={{ borderColor: barColor, color: barColor }}
                            >
                              {rawScore}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detail pane — bars-plus-detail mode only */}
          {mode === "bars-plus-detail" && selected && (
            <Card className="shadow-lg flex flex-col overflow-hidden bg-[hsl(var(--scheme-ll-graph-bg))] border-0">
              {/* Nav header */}
              <div className="bg-[hsl(var(--scheme-nav-bg))] px-4 py-3 flex-shrink-0">
                <div className="grid grid-cols-3 items-center gap-2">
                  <div className="justify-self-start">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevious}
                      disabled={currentIndex <= 0 || !onSelectEntry}
                      className="w-[100px] text-sm px-2 bg-[hsl(var(--scheme-nav-button))] hover:bg-[hsl(var(--scheme-nav-button)/.8)] text-[hsl(var(--scheme-nav-text))] border-[hsl(var(--scheme-nav-button))]"
                    >
                      ← Prev
                    </Button>
                  </div>
                  <div className="text-sm font-semibold text-center text-[hsl(var(--scheme-nav-text))]">
                    Entry {currentIndex + 1} of {sortedEntries.length}
                  </div>
                  <div className="justify-self-end">
                    <Button
                      size="sm"
                      onClick={handleNext}
                      disabled={currentIndex >= sortedEntries.length - 1 || !onSelectEntry}
                      className="w-[100px] text-sm px-2 bg-[hsl(var(--scheme-nav-button))] hover:bg-[hsl(var(--scheme-nav-button)/.8)] text-[hsl(var(--scheme-nav-text))] border-[hsl(var(--scheme-nav-button))]"
                    >
                      Next →
                    </Button>
                  </div>
                </div>
              </div>

              <CardContent className="space-y-4 py-6 px-6 flex-1 overflow-y-auto">
                {selected.media && selected.media.length > 0 && (
                  <div className="mb-4 relative">
                    <div className="relative overflow-hidden rounded-lg aspect-video bg-muted">
                      <img
                        src={selected.media[0].url}
                        alt={selected.media[0].alt_text || selected.title}
                        className="w-full h-full object-cover"
                        style={{
                          objectPosition: `${selected.media[0].position_x ?? 50}% ${selected.media[0].position_y ?? 50}%`,
                          transform: `scale(${selected.media[0].scale ?? 1})`,
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div
                    className="flex-shrink-0 px-3 py-1 rounded-md font-bold text-white"
                    style={{
                      backgroundColor: (selected.score || 0) >= 0 ? positiveColor : negativeColor,
                    }}
                  >
                    {selected.score || 0}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-[hsl(var(--scheme-title-text))]">
                      {selected.title}
                    </h2>
                    <div className="flex items-center gap-1 text-sm text-[hsl(var(--scheme-title-text))] opacity-70 mt-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {selected.occurred_on
                          ? new Date(selected.occurred_on).toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "No date"}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="leading-relaxed text-[hsl(var(--scheme-title-text))]">
                  {selected.summary || selected.details}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
