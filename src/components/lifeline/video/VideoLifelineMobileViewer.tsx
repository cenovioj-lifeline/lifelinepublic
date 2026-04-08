/**
 * VideoLifelineMobileViewer
 *
 * Pure presentational copy of `MobileLifelineViewer` + `MobileLifelineGraph`
 * for use in Remotion video compositions (see thread [2G-C] "UI to Video
 * Pipeline" / Track C in the OpenClaw vault).
 *
 * This is a DUPLICATE of the production mobile lifeline rendering, not a
 * refactor. Production components are untouched. Nothing in LP's live site
 * imports this file — it exists solely to be consumed by Remotion
 * compositions via a tsconfig path alias.
 *
 * Differences from production:
 *   - All data comes in via props. No Supabase, no useQuery.
 *   - No auth, no favorites, no community contribution menu, no floating
 *     back button, no scroll-to-top button.
 *   - No quote integration (`useCollectionQuote`).
 *   - No bottom-sheet detail modal — selection is visual only (the selected
 *     bar gets a highlight ring, detail text is not shown).
 *   - Colors default to standard green/red; overridable via props.
 *
 * The prop contract matches the desktop `VideoLifelineViewer` so a Remotion
 * composition can choose which component to mount based on the video's
 * intended framing, independent of the canvas size.
 *
 * Drift policy: when LP's production mobile lifeline rendering changes, this
 * file must be manually synced.
 */

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { parseLifelineTitle } from "@/lib/lifelineTitle";
import type {
  VideoLifelineEntry,
  VideoLifeline,
} from "./VideoLifelineViewer";

// --- Types -----------------------------------------------------------------

export interface VideoLifelineMobileViewerProps {
  entries: VideoLifelineEntry[];
  lifeline: VideoLifeline;
  selectedEntryId?: string | null;
  onSelectEntry?: (id: string) => void;
  positiveColor?: string;
  negativeColor?: string;
  lifelineType?: string;
}

const DEFAULT_POSITIVE = "#16a34a";
const DEFAULT_NEGATIVE = "#dc2626";
const CENTERLINE_COLOR = "#565D6D";
const BAR_HEIGHT = 48;

// --- Component -------------------------------------------------------------

export function VideoLifelineMobileViewer({
  entries,
  lifeline,
  selectedEntryId = null,
  onSelectEntry,
  positiveColor = DEFAULT_POSITIVE,
  negativeColor = DEFAULT_NEGATIVE,
  lifelineType,
}: VideoLifelineMobileViewerProps) {
  const effectiveType = lifelineType || lifeline.lifeline_type || "list";

  const sortedEntries = useMemo(() => {
    if (!entries || entries.length === 0) return [];
    if (effectiveType === "rating") {
      return [...entries].sort((a, b) => {
        const scoreDiff = (b.score || 0) - (a.score || 0);
        if (scoreDiff !== 0) return scoreDiff;
        return (a.title || "").localeCompare(b.title || "");
      });
    }
    return entries;
  }, [entries, effectiveType]);

  if (sortedEntries.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No entries
      </div>
    );
  }

  const parsed = parseLifelineTitle(lifeline.title, effectiveType);
  const displayTitle = parsed.isPersonType
    ? `${parsed.personName} | ${parsed.contextTitle}`
    : lifeline.title;

  return (
    <div className="h-full bg-background flex flex-col overflow-hidden">
      {/* Title bar */}
      <div className="px-2 py-3 flex items-center bg-[hsl(var(--scheme-ll-graph-bg))]">
        <h1 className="font-serif font-bold text-lg text-[hsl(var(--scheme-title-text))] truncate flex-1">
          {displayTitle}
        </h1>
      </div>

      {/* Separator tick where centerline meets header */}
      <div className="relative h-[2px] bg-[hsl(var(--scheme-ll-graph-bg))]">
        <div
          className="absolute left-1/2 -translate-x-1/2 w-[2px] h-[2px]"
          style={{ backgroundColor: CENTERLINE_COLOR }}
        />
      </div>

      {/* Vertical timeline */}
      <div className="flex-1 bg-[hsl(var(--scheme-ll-graph-bg))] overflow-hidden">
        <div className="relative min-h-full px-2 py-2">
          {/* Continuous vertical centerline */}
          <div
            className="absolute w-[2px]"
            style={{
              left: "50%",
              top: 0,
              bottom: 0,
              backgroundColor: CENTERLINE_COLOR,
              zIndex: 0,
            }}
          />

          {sortedEntries.map((entry, index) => {
            const isSelected = entry.id === selectedEntryId;
            const rawScore = entry.score || 0;
            const positive = rawScore >= 0;
            const absScore = Math.abs(rawScore);
            const stemWidthPercent = Math.min(absScore * 10, 100);
            const barColor = positive ? positiveColor : negativeColor;

            return (
              <div key={entry.id}>
                <div
                  className={cn(
                    "grid grid-cols-2 gap-0 transition-colors duration-150 py-1.5 px-0 rounded-lg mb-0.5 relative",
                    onSelectEntry && "cursor-pointer hover:bg-gray-100/50",
                    isSelected && "bg-gray-100"
                  )}
                  onClick={() => onSelectEntry?.(entry.id)}
                >
                  {positive ? (
                    <>
                      {/* Score box + stem on left */}
                      <div className="flex items-center justify-end pr-0">
                        <div
                          className="flex items-center justify-end relative"
                          style={{ width: `${stemWidthPercent}%` }}
                        >
                          <div
                            className="flex-shrink-0 w-[40px] rounded-l-lg flex items-center justify-center font-bold text-lg border-2 bg-white z-10"
                            style={{
                              borderColor: barColor,
                              color: barColor,
                              height: `${BAR_HEIGHT}px`,
                            }}
                          >
                            {absScore}
                          </div>
                          <div
                            className="flex-1"
                            style={{
                              background: barColor,
                              height: `${BAR_HEIGHT}px`,
                            }}
                          />
                        </div>
                      </div>
                      {/* Chat bubble on right */}
                      <div className="flex items-center pl-2 relative">
                        <div
                          className={cn(
                            "relative bg-white rounded-2xl px-2 py-2 max-w-full transition-all duration-300",
                            isSelected && "border-2 shadow-lg"
                          )}
                          style={isSelected ? { borderColor: barColor } : {}}
                        >
                          <div
                            className="absolute left-[-8px] top-[20px] w-0 h-0 border-t-[10px] border-b-0 border-r-[10px] border-transparent"
                            style={{ borderRightColor: "white" }}
                          />
                          <div className="font-bold text-xs text-[hsl(var(--scheme-ll-entry-title))] line-clamp-2">
                            {entry.title}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Chat bubble on left */}
                      <div className="flex items-center justify-end pr-2 relative">
                        <div
                          className={cn(
                            "relative bg-white rounded-2xl px-2 py-2 max-w-full transition-all duration-300",
                            isSelected && "border-2 shadow-lg"
                          )}
                          style={isSelected ? { borderColor: barColor } : {}}
                        >
                          <div
                            className="absolute right-[-8px] top-[20px] w-0 h-0 border-t-[10px] border-b-0 border-l-[10px] border-transparent"
                            style={{ borderLeftColor: "white" }}
                          />
                          <div className="font-bold text-xs text-[hsl(var(--scheme-ll-entry-title))] line-clamp-2">
                            {entry.title}
                          </div>
                        </div>
                      </div>
                      {/* Stem + score box on right */}
                      <div className="flex items-center pl-0">
                        <div
                          className="flex items-center relative"
                          style={{ width: `${stemWidthPercent}%` }}
                        >
                          <div
                            className="flex-1"
                            style={{
                              background: barColor,
                              height: `${BAR_HEIGHT}px`,
                            }}
                          />
                          <div
                            className="flex-shrink-0 w-[40px] rounded-r-lg flex items-center justify-center font-bold text-lg border-2 bg-white z-10"
                            style={{
                              borderColor: barColor,
                              color: barColor,
                              height: `${BAR_HEIGHT}px`,
                            }}
                          >
                            {rawScore}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
