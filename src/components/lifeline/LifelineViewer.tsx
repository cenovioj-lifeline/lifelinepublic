import { useMemo, useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus, Star } from "lucide-react";
import { ContributeEventDialog } from "@/components/ContributeEventDialog";
import { useAuth } from "@/lib/auth";
import { PublicAuthModal } from "@/components/PublicAuthModal";
import { Link } from "react-router-dom";

interface LifelineViewerProps {
  lifelineId: string;
  lifelineType?: string;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  collectionTextColor?: string | null;
  collectionHeadingColor?: string | null;
}

type SelectionStyle = "glow" | "lifted" | "sheen" | "wave";

export function LifelineViewer({
  lifelineId,
  lifelineType,
  primaryColor,
  secondaryColor,
  collectionTextColor,
  collectionHeadingColor
}: LifelineViewerProps) {
  const { user } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [contributeDialogOpen, setContributeDialogOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const selectionStyle: SelectionStyle = "glow"; // Always use glow
  const timelineRef = useRef<HTMLDivElement>(null);
  const entryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Default colors (green and red)
  const positiveColor = primaryColor || "#16a34a";
  const negativeColor = secondaryColor || "#dc2626";

  const { data: lifeline } = useQuery({
    queryKey: ["lifeline", lifelineId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lifelines")
        .select("*, profiles(display_name)")
        .eq("id", lifelineId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: rawEntries } = useQuery({
    queryKey: ["entries", lifelineId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entries")
        .select("*, entry_media(media_id, order_index)")
        .eq("lifeline_id", lifelineId)
        .order("order_index");

      if (error) throw error;
      
      // Fetch user profiles separately for fan-contributed entries
      if (data) {
        const userIds = data
          .filter((e: any) => e.is_fan_contributed && e.contributed_by_user_id)
          .map((e: any) => e.contributed_by_user_id);
        
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from("user_profiles")
            .select("*")
            .in("user_id", userIds);
          
          // Get media assets for entries
          const entryIds = data.map((e: any) => e.id);
          const { data: entryMedia } = await supabase
            .from("entry_media")
            .select("*, media_assets(*)")
            .in("entry_id", entryIds)
            .order("order_index");
          
          // Attach profiles and media to entries
          return data.map((entry: any) => ({
            ...entry,
            user_profile: profiles?.find((p: any) => p.user_id === entry.contributed_by_user_id),
            media: entryMedia?.filter((m: any) => m.entry_id === entry.id).map((m: any) => m.media_assets) || [],
          }));
        }
        
        // If no user profiles needed, still fetch media
        const entryIds = data.map((e: any) => e.id);
        const { data: entryMedia } = await supabase
          .from("entry_media")
          .select("*, media_assets(*)")
          .in("entry_id", entryIds)
          .order("order_index");
        
        return data.map((entry: any) => ({
          ...entry,
          media: entryMedia?.filter((m: any) => m.entry_id === entry.id).map((m: any) => m.media_assets) || [],
        }));
      }
      
      return data;
    },
    enabled: !!lifelineId,
  });

  // Process entries: sort by score if it's a "list" type with uniform sentiment
  const entries = useMemo(() => {
    if (!rawEntries || lifelineType !== "list") return rawEntries;

    // Check if all entries have the same sentiment (all positive or all negative)
    const allPositive = rawEntries.every((e) => (e.score || 0) >= 0);
    const allNegative = rawEntries.every((e) => (e.score || 0) < 0);

    if (allPositive || allNegative) {
      // Sort by score descending (best to worst for positive, worst to best for negative)
      return [...rawEntries].sort((a, b) => (b.score || 0) - (a.score || 0));
    }

    return rawEntries;
  }, [rawEntries, lifelineType]);

  // Auto-select first entry when entries load
  useEffect(() => {
    if (entries && entries.length > 0 && !selectedId) {
      setSelectedId(entries[0].id);
    }
  }, [entries, selectedId]);

  const selected = useMemo(() => {
    if (!selectedId || !entries) return null;
    return entries.find((e) => e.id === selectedId) || null;
  }, [selectedId, entries]);

  const currentIndex = useMemo(() => {
    if (!selected || !entries) return -1;
    return entries.findIndex((e) => e.id === selected.id);
  }, [selected, entries]);

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
      const newId = entries[currentIndex - 1].id;
      setSelectedId(newId);
      scrollToEntry(newId);
    }
  };

  const handleNext = () => {
    if (currentIndex < (entries?.length || 0) - 1 && entries) {
      const newId = entries[currentIndex + 1].id;
      setSelectedId(newId);
      scrollToEntry(newId);
    }
  };

  // Scroll to selected entry when selection changes
  useEffect(() => {
    if (selectedId) {
      scrollToEntry(selectedId);
    }
  }, [selectedId]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!lifeline || !entries) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="p-6 pb-4">
      <CardHeader className="pt-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle
              className="text-2xl"
              style={collectionHeadingColor ? { color: collectionHeadingColor } : undefined}
            >
              {lifeline.title}
            </CardTitle>
            {lifeline.subtitle && (
              <p
                style={collectionTextColor ? { color: collectionTextColor, opacity: 0.7 } : undefined}
              >
                {lifeline.subtitle}
              </p>
            )}
          </div>
          <Button onClick={() => setContributeDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Contribute a new event
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" style={{ height: 'calc(100vh - 270px)' }}>
          {/* Left side - Timeline */}
          <div
            ref={timelineRef}
            className="bg-white rounded-lg p-5 overflow-y-auto h-full"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: `${positiveColor} #f0f0f0`
            }}
          >
            <div className="relative min-h-full">
              {entries.map((entry) => {
                const isSelected = entry.id === selectedId;
                const positive = (entry.score || 0) >= 0;
                const score = entry.score || 0;
                const absScore = Math.abs(score);
                const stemWidthPercent = Math.min(absScore * 10, 100); // 10% per score point, max 100%

                return (
                  <div
                    key={entry.id}
                    ref={(el) => (entryRefs.current[entry.id] = el)}
                    className={cn(
                      "grid grid-cols-2 gap-0 cursor-pointer transition-colors duration-200",
                      isSelected && "bg-gray-50/50"
                    )}
                    style={{ minHeight: '100px' }}
                    onClick={() => setSelectedId(entry.id)}
                  >
                    {positive ? (
                      <>
                        {/* Left column - Score box at left end, stem extends to center */}
                        <div className="flex items-center justify-end border-r-2 border-gray-200 pr-0 py-3">
                          <div className="flex items-center justify-end" style={{ width: `${stemWidthPercent}%` }}>
                            {/* Score box at left end - square on right side */}
                            <div
                              className="flex-shrink-0 w-[50px] h-[50px] rounded-l-lg flex items-center justify-center font-bold text-xl border-[3px] bg-white z-10 relative"
                              style={{
                                borderColor: positiveColor,
                                color: positiveColor
                              }}
                            >
                              {score}
                            </div>
                            {/* Horizontal stem bar extending to center */}
                            <div
                              className="flex-1 h-[50px]"
                              style={{
                                background: positiveColor
                              }}
                            />
                          </div>
                        </div>
                        {/* Right column - Chat bubble */}
                        <div className="flex items-center pl-4 py-3">
                          <div
                            className={cn(
                              "relative bg-gray-100 rounded-2xl px-4 py-3 max-w-[90%] transition-all duration-300",
                              isSelected && "border-[3px] shadow-lg bg-white"
                            )}
                            style={isSelected ? { borderColor: positiveColor } : {}}
                          >
                            {/* Triangle pointer */}
                            <div
                              className="absolute left-[-10px] top-[30px] w-0 h-0 border-t-[15px] border-b-0 border-r-[15px] border-transparent"
                              style={{
                                borderRightColor: isSelected ? 'white' : '#f0f0f0'
                              }}
                            />
                            <div className="font-bold text-sm mb-1">
                              {entry.title}
                              {entry.is_fan_contributed && (
                                <Star className="inline-block h-3 w-3 ml-1 fill-yellow-400 text-yellow-400" />
                              )}
                            </div>
                            <div className="text-xs text-gray-600 line-clamp-2">
                              {entry.summary || entry.details}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Left column - Chat bubble */}
                        <div className="flex items-center justify-end pr-4 border-r-2 border-gray-200 py-3">
                          <div
                            className={cn(
                              "relative bg-gray-100 rounded-2xl px-4 py-3 max-w-[90%] transition-all duration-300",
                              isSelected && "border-[3px] shadow-lg bg-white"
                            )}
                            style={isSelected ? { borderColor: negativeColor } : {}}
                          >
                            {/* Triangle pointer */}
                            <div
                              className="absolute right-[-10px] top-[30px] w-0 h-0 border-t-[15px] border-b-0 border-l-[15px] border-transparent"
                              style={{
                                borderLeftColor: isSelected ? 'white' : '#f0f0f0'
                              }}
                            />
                            <div className="font-bold text-sm mb-1">
                              {entry.is_fan_contributed && (
                                <Star className="inline-block h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                              )}
                              {entry.title}
                            </div>
                            <div className="text-xs text-gray-600 line-clamp-2">
                              {entry.summary || entry.details}
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
                                background: negativeColor
                              }}
                            />
                            {/* Score box at right end - square on left side */}
                            <div
                              className="flex-shrink-0 w-[50px] h-[50px] rounded-r-lg flex items-center justify-center font-bold text-xl border-[3px] bg-white z-10 relative"
                              style={{
                                borderColor: negativeColor,
                                color: negativeColor
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
            </div>
          </div>

          {/* Right side - Details */}
          {selected && (
            <Card className="shadow-lg flex flex-col h-full overflow-hidden">
              <CardHeader className="bg-muted/50 rounded-t-xl flex-shrink-0">
                {/* Navigation buttons at very top */}
                <div className="grid grid-cols-3 items-center mb-4">
                  <div className="justify-self-start">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevious}
                      disabled={currentIndex === 0}
                      className="w-[100px]"
                    >
                      ← Previous
                    </Button>
                  </div>
                  <div className="text-sm font-semibold text-center">
                    Entry {currentIndex + 1} of {entries.length}
                  </div>
                  <div className="justify-self-end">
                    <Button
                      size="sm"
                      onClick={handleNext}
                      disabled={currentIndex === (entries?.length || 0) - 1}
                      className="w-[100px]"
                    >
                      Next →
                    </Button>
                  </div>
                </div>
                {/* User info and score */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {getInitials(lifeline.profiles?.display_name || "Unknown")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle
                        className="text-base leading-tight"
                        style={collectionHeadingColor ? { color: collectionHeadingColor } : undefined}
                      >
                        {lifeline.profiles?.display_name || "Unknown"}
                      </CardTitle>
                      <p
                        className="text-xs"
                        style={collectionTextColor ? { color: collectionTextColor, opacity: 0.7 } : undefined}
                      >
                        Entry details
                      </p>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "px-3 py-1 rounded-md font-bold text-white"
                    )}
                    style={{
                      backgroundColor: (selected.score || 0) >= 0 ? positiveColor : negativeColor
                    }}
                  >
                    {selected.score || 0}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 py-6 flex-1 overflow-y-auto">
                {selected.media && selected.media.length > 0 && (
                  <div className="mb-4">
                    <img
                      src={selected.media[0].url}
                      alt={selected.media[0].alt_text || selected.title}
                      className="w-full h-64 object-cover rounded-lg"
                      style={{
                        objectPosition: `${selected.media[0].position_x ?? 50}% ${selected.media[0].position_y ?? 50}%`
                      }}
                    />
                  </div>
                )}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2
                      className="text-2xl font-bold text-foreground"
                      style={collectionHeadingColor ? { color: collectionHeadingColor } : undefined}
                    >
                      {selected.title}
                    </h2>
                  </div>
                </div>
                <p
                  className="leading-relaxed text-foreground"
                  style={collectionTextColor ? { color: collectionTextColor } : undefined}
                >
                  {selected.summary || selected.details}
                </p>
                 {selected.is_fan_contributed && selected.user_profile && (
                   <p
                     className="text-sm italic"
                     style={collectionTextColor ? { color: collectionTextColor, opacity: 0.7 } : undefined}
                   >
                     Credit: Created by{" "}
                     <Link
                       to="/top-contributors"
                       className="underline hover:opacity-80 transition-opacity"
                       style={collectionTextColor ? { color: collectionTextColor } : undefined}
                     >
                       {selected.user_profile.first_name}{" "}
                       {selected.user_profile.last_name}
                     </Link>
                   </p>
                 )}
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>

      <ContributeEventDialog
        open={contributeDialogOpen}
        onOpenChange={setContributeDialogOpen}
        lifelineId={lifelineId}
        lifelineTitle={lifeline.title}
        onSignInRequired={() => {
          setContributeDialogOpen(false);
          setTimeout(() => setShowAuthModal(true), 0);
        }}
      />

      <PublicAuthModal
        open={showAuthModal}
        onOpenChange={(open) => {
          setShowAuthModal(open);
          if (!open && user) {
            // User just signed in, reopen contribute dialog
            setContributeDialogOpen(true);
          }
        }}
      />
    </Card>
  );
}
