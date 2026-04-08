import { useMemo, useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSuperFan } from "@/hooks/useSuperFan";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CroppedImage } from "@/components/ui/CroppedImage";
import { preloadImage } from "@/lib/imageUrl";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { parseLifelineTitle } from "@/lib/lifelineTitle";
import { Plus, Star, Menu, Image as ImageIcon, ImageUp, Pencil, Check, X, Search, Calendar, Move } from "lucide-react";
import { ContributeEventDialog } from "@/components/ContributeEventDialog";
import { useAuth } from "@/lib/auth";
import { PublicAuthModal } from "@/components/PublicAuthModal";
import { SuperFanImageUpload, SuperFanImageDelete } from "@/components/SuperFanImageUpload";
import { ImageLockToggle } from "@/components/ImageLockToggle";
import { CoverImagePicker } from "@/components/CoverImagePicker";
import { EntryImageRepositioner } from "@/components/EntryImageRepositioner";
import { SerpApiSearchModal } from "@/components/admin/SerpApiSearchModal";
import { AiImageEditModal } from "@/components/admin/AiImageEditModal";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileLifelineViewer } from "./MobileLifelineViewer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { LifelineSerpApiSearchModal } from "../admin/LifelineSerpApiSearchModal";
import { useAdminAccess } from "@/lib/useAdminAccess";
import { ContributionButton } from "@/components/ContributionButton";
import { CommunityContributionMenu } from "@/components/CommunityContributionMenu";
import { ContributionStatusBadge } from "@/components/ContributionStatusBadge";

interface LifelineViewerProps {
  lifelineId: string;
  lifelineType?: string;
}

type SelectionStyle = "glow" | "lifted" | "sheen" | "wave";

export function LifelineViewer({
  lifelineId,
  lifelineType,
}: LifelineViewerProps) {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isSuperFan } = useSuperFan();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [contributeDialogOpen, setContributeDialogOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [contributePictureMode, setContributePictureMode] = useState(false);
  const [coverImagePickerOpen, setCoverImagePickerOpen] = useState(false);
  const [coverImageUrl, setCoverImageUrl] = useState<string | undefined>(undefined);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDetails, setEditingDetails] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDetails, setEditedDetails] = useState("");
  const [serpApiModalOpen, setSerpApiModalOpen] = useState(false);
  const [aiEditModalOpen, setAiEditModalOpen] = useState(false);
  const [repositionMedia, setRepositionMedia] = useState<{ id: string; url: string; position_x?: number; position_y?: number } | null>(null);
  const [repositionPickerOpen, setRepositionPickerOpen] = useState(false);
  const selectionStyle: SelectionStyle = "glow"; // Always use glow
  const timelineRef = useRef<HTMLDivElement>(null);
  const entryRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // FIX: Use state for colors so they update reactively when CSS variables change
  const [positiveColor, setPositiveColor] = useState("#16a34a");
  const [negativeColor, setNegativeColor] = useState("#dc2626");

  // FIX: Read CSS variables reactively after they're applied by useColorScheme
  useEffect(() => {
    const readColorsFromCSS = () => {
      const root = document.documentElement;
      const positiveHSL = getComputedStyle(root).getPropertyValue('--scheme-ll-graph-positive').trim();
      const negativeHSL = getComputedStyle(root).getPropertyValue('--scheme-ll-graph-negative').trim();
      
      if (positiveHSL) {
        setPositiveColor(`hsl(${positiveHSL})`);
      }
      if (negativeHSL) {
        setNegativeColor(`hsl(${negativeHSL})`);
      }
    };

    // Read immediately in case CSS vars are already set
    readColorsFromCSS();

    // Also read after a short delay to catch async color scheme loading
    const timer = setTimeout(readColorsFromCSS, 150);

    // Set up a MutationObserver to detect CSS variable changes on :root
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          readColorsFromCSS();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style']
    });
    
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [lifelineId]); // Re-run when lifeline changes (new collection = new color scheme)

  const { data: lifeline, isError: lifelineError } = useQuery({
    queryKey: ["lifeline", lifelineId],
    queryFn: async () => {
      const { data, error} = await supabase
        .from("lifelines")
        .select("*, profiles!lifelines_profile_id_fkey(name)")
        .eq("id", lifelineId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: rawEntries, isError: entriesError } = useQuery({
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
            .select("id, entry_id, media_id, order_index, locked, media_assets(*)")
            .in("entry_id", entryIds)
            .order("order_index");
          
          // Attach profiles and media to entries with lock status
          return data.map((entry: any) => ({
            ...entry,
            user_profile: profiles?.find((p: any) => p.user_id === entry.contributed_by_user_id),
            media: entryMedia?.filter((m: any) => m.entry_id === entry.id).map((m: any) => ({
              ...m.media_assets,
              entryMediaId: m.id,
              locked: m.locked
            })) || [],
          }));
        }
        
        // If no user profiles needed, still fetch media
        const entryIds = data.map((e: any) => e.id);
        const { data: entryMedia } = await supabase
          .from("entry_media")
          .select("id, entry_id, media_id, order_index, locked, media_assets(*)")
          .in("entry_id", entryIds)
          .order("order_index");
        
        return data.map((entry: any) => ({
          ...entry,
          media: entryMedia?.filter((m: any) => m.entry_id === entry.id).map((m: any) => ({
            ...m.media_assets,
            entryMediaId: m.id,
            locked: m.locked
          })) || [],
        }));
      }
      
      return data;
    },
    enabled: !isMobile && !!lifelineId,
  });

  // Process entries: sort by score for "rating" type (always) or "list" type (if uniform sentiment)
  const entries = useMemo(() => {
    if (!rawEntries) return rawEntries;

    // For "rating" type: ALWAYS sort by score descending, then by title alphabetically
    if (lifelineType === "rating") {
      return [...rawEntries].sort((a, b) => {
        const scoreDiff = (b.score || 0) - (a.score || 0);
        if (scoreDiff !== 0) return scoreDiff;
        return (a.title || '').localeCompare(b.title || '');
      });
    }

    // For "list" type: only sort by score if uniform sentiment
    if (lifelineType === "list") {
      const allPositive = rawEntries.every((e) => (e.score || 0) >= 0);
      const allNegative = rawEntries.every((e) => (e.score || 0) < 0);

      if (allPositive || allNegative) {
        return [...rawEntries].sort((a, b) => (b.score || 0) - (a.score || 0));
      }
    }

    return rawEntries;
  }, [rawEntries, lifelineType]);

  // Auto-select first entry when entries load
  useEffect(() => {
    if (entries && entries.length > 0 && !selectedId) {
      setSelectedId(entries[0].id);
    }
  }, [entries, selectedId]);

  const selectedIndex = useMemo(() => {
    if (!selectedId || !entries) return -1;
    return entries.findIndex((e) => e.id === selectedId);
  }, [selectedId, entries]);

  const selected = useMemo(() => {
    if (selectedIndex < 0 || !entries) return null;
    return entries[selectedIndex] || null;
  }, [selectedIndex, entries]);

  // Preload neighbor entry images so Prev/Next feels instant.
  useEffect(() => {
    if (!entries || selectedIndex < 0) return;
    const neighbors = [entries[selectedIndex - 1], entries[selectedIndex + 1]];
    for (const neighbor of neighbors) {
      const url = neighbor?.media?.[0]?.url;
      if (url) preloadImage(url, { preset: "entry" });
    }
  }, [entries, selectedIndex]);

  // Validation schema
  const titleSchema = z.string().trim().min(1, "Title cannot be empty").max(200, "Title must be less than 200 characters");
  const detailsSchema = z.string().trim().min(1, "Details cannot be empty").max(5000, "Details must be less than 5000 characters");

  // Update mutation for entry
  const updateEntryMutation = useMutation({
    mutationFn: async ({ entryId, title, details }: { entryId: string; title?: string; details?: string }) => {
      const updates: any = {};
      if (title !== undefined) updates.title = title;
      if (details !== undefined) updates.summary = details;

      const { error } = await supabase
        .from("entries")
        .update(updates)
        .eq("id", entryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries", lifelineId] });
      toast.success("Event updated successfully");
      setEditingTitle(false);
      setEditingDetails(false);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  const handleStartEditTitle = () => {
    if (selected) {
      setEditedTitle(selected.title);
      setEditingTitle(true);
    }
  };

  const handleStartEditDetails = () => {
    if (selected) {
      setEditedDetails(selected.summary || selected.details || "");
      setEditingDetails(true);
    }
  };

  const handleSaveTitle = () => {
    try {
      const validated = titleSchema.parse(editedTitle);
      if (selected) {
        updateEntryMutation.mutate({ entryId: selected.id, title: validated });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  const handleSaveDetails = () => {
    try {
      const validated = detailsSchema.parse(editedDetails);
      if (selected) {
        updateEntryMutation.mutate({ entryId: selected.id, details: validated });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingTitle(false);
    setEditingDetails(false);
    setEditedTitle("");
    setEditedDetails("");
  };

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

  // Scroll horizontal chart to selected entry (mobile)
  useEffect(() => {
    if (selectedId && typeof window !== 'undefined') {
      const isMobile = window.innerWidth <= 1024;
      if (isMobile) {
        // Find the selected bar in the horizontal chart
        const chartContainer = document.querySelector('.overflow-x-auto');
        const selectedIndex = entries?.findIndex(e => e.id === selectedId);

        if (chartContainer && selectedIndex !== -1) {
          const barWidth = 16; // w-4 = 16px
          const gap = 4; // gap-1 = 4px
          const scrollPosition = selectedIndex * (barWidth + gap) - (chartContainer.clientWidth / 2) + (barWidth / 2);

          chartContainer.scrollTo({
            left: Math.max(0, scrollPosition),
            behavior: 'smooth'
          });
        }
      }
    }
  }, [selectedId, entries]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Check if user is admin
  const isAdmin = user?.email === 'cenovioj@gmail.com';

  // Mobile view - render after all hooks are called
  if (isMobile) {
    return <MobileLifelineViewer lifelineId={lifelineId} />;
  }

  if (lifelineError || entriesError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-[hsl(var(--scheme-cards-text))]">
        <p className="text-lg">Unable to load this lifeline.</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  if (!lifeline || !entries) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current" />
      </div>
    );
  }

  return (
    <Card className="lg:p-6 lg:pb-4 md:p-2 p-1 pb-1 lg:mt-0 mt-0 border-[hsl(var(--scheme-nav-bg))] bg-[hsl(var(--scheme-ll-display-bg))]" style={{ height: 'calc(100dvh - 90px)' }}>
      <CardHeader className="lg:pt-2 pt-0 px-0 bg-[hsl(var(--scheme-ll-display-bg))]">
        <div className="flex flex-col lg:flex-row items-start lg:items-start justify-between gap-2 lg:gap-0">
          <div className="flex-1">
            {(() => {
              const parsed = parseLifelineTitle(lifeline.title, lifeline.lifeline_type || lifelineType || 'list');
              if (parsed.isPersonType) {
                return (
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-2xl lg:text-2xl md:text-xl sm:text-lg font-bold uppercase tracking-wide text-[hsl(var(--scheme-person-name-accent))]">
                      {parsed.personName}
                    </span>
                    <span className="text-[hsl(var(--scheme-person-name-accent))] opacity-30 text-2xl">│</span>
                    <span className="text-xl lg:text-xl md:text-lg sm:text-base text-[hsl(var(--scheme-cards-text))]">
                      {parsed.contextTitle}
                    </span>
                  </div>
                );
              }
              return (
                <CardTitle className="text-2xl lg:text-2xl md:text-xl sm:text-lg leading-tight text-[hsl(var(--scheme-title-text))]">
                  {lifeline.title}
                </CardTitle>
              );
            })()}
            {lifeline.subtitle && (
              <p className="text-sm lg:text-base text-[hsl(var(--scheme-cards-text))] opacity-70">
                {lifeline.subtitle}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0 lg:px-6 pt-0 h-[calc(100%-100px)] lg:h-auto flex flex-col lg:block overflow-visible bg-[hsl(var(--scheme-ll-display-bg))]">
        {/* Mobile Horizontal Chart - Only visible on mobile */}
        <div className="lg:hidden bg-[hsl(var(--scheme-ll-graph-bg))] rounded-lg mb-1 overflow-x-auto py-1 px-0 shrink-0" style={{ minHeight: '80px' }}>
          <div className="flex items-center justify-center relative" style={{ minWidth: 'fit-content', height: '80px' }}>
            {/* Centerline */}
            <div className="absolute top-0 bottom-0 left-0 right-0 w-full h-full flex items-center z-0">
              <div className="w-full h-[2px]" style={{ backgroundColor: '#565D6D' }} />
            </div>
            {/* Bars */}
            <div className="flex items-end gap-1 h-full relative z-10">
              {entries.map((entry) => {
                const isSelected = entry.id === selectedId;
                const positive = (entry.score || 0) >= 0;
                const score = Math.abs(entry.score || 0);
                const barHeight = Math.max(6, Math.min(35, score * 3.5)); // 3.5px per score point, max 35px

                return (
                  <div
                    key={entry.id}
                    className={cn(
                      "w-4 relative cursor-pointer transition-all duration-300 rounded-t-sm",
                      positive ? "self-end mb-[40px]" : "self-start mt-[40px] rounded-b-sm rounded-t-none",
                      isSelected && "brightness-75 scale-y-110 shadow-lg"
                    )}
                    style={{
                      height: `${barHeight}px`,
                      backgroundColor: positive
                        ? (isSelected ? positiveColor : positiveColor)
                        : (isSelected ? negativeColor : negativeColor),
                      minHeight: '6px'
                    }}
                    onClick={() => setSelectedId(entry.id)}
                    title={`${entry.title} - Score: ${entry.score}`}
                  >
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                      {score}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 lg:flex-none min-h-0 lg:h-[calc(100dvh-270px)]">
          {/* Left side - Timeline - Hidden on mobile */}
          <div
            ref={timelineRef}
            className="hidden lg:block bg-[hsl(var(--scheme-ll-graph-bg))] rounded-lg p-5 overflow-y-auto h-full"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#565D6D #f0f0f0'
            }}
          >
            <div className="relative min-h-full" style={{ paddingTop: '2px', paddingBottom: '2px' }}>
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
                        <div className="flex items-center justify-end relative pr-0 py-3">
                          {/* Vertical centerline extending full height */}
                          <div className="absolute right-0 top-0 bottom-0 w-[2px]" style={{ backgroundColor: '#565D6D' }} />
                          <div className="flex items-center justify-end" style={{ width: `${stemWidthPercent}%` }}>
                            {/* Score box at left end - square on right side */}
                            <div
                              className="shrink-0 w-[50px] h-[50px] rounded-l-lg flex items-center justify-center font-bold text-xl border-[3px] bg-white z-10 relative"
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
                              "relative bg-white rounded-2xl px-4 py-3 max-w-[90%] transition-all duration-300",
                              isSelected && "border-[3px] shadow-lg"
                            )}
                            style={isSelected ? { borderColor: positiveColor } : {}}
                          >
                            {/* Triangle pointer */}
                            <div
                              className="absolute left-[-10px] top-[30px] w-0 h-0 border-t-15 border-b-0 border-r-15 border-transparent"
                              style={{
                                borderRightColor: 'white'
                              }}
                            />
                            <div className="font-bold text-sm mb-1 text-[hsl(var(--scheme-ll-entry-title))]">
                              {entry.title}
                              {entry.is_fan_contributed && (
                                <Star className="inline-block h-3 w-3 ml-1 fill-yellow-400 text-yellow-400" />
                              )}
                            </div>
                            <div className="text-xs text-[hsl(var(--scheme-title-text))] line-clamp-2">
                              {entry.summary || entry.details}
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
                            style={isSelected ? { borderColor: negativeColor } : {}}
                          >
                            {/* Triangle pointer */}
                            <div
                              className="absolute right-[-10px] top-[30px] w-0 h-0 border-t-15 border-b-0 border-l-15 border-transparent"
                              style={{
                                borderLeftColor: 'white'
                              }}
                            />
                            <div className="font-bold text-sm mb-1 text-[hsl(var(--scheme-ll-entry-title))]">
                              {entry.is_fan_contributed && (
                                <Star className="inline-block h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                              )}
                              {entry.title}
                            </div>
                            <div className="text-xs text-[hsl(var(--scheme-title-text))] line-clamp-2">
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
                              className="shrink-0 w-[50px] h-[50px] rounded-r-lg flex items-center justify-center font-bold text-xl border-[3px] bg-white z-10 relative"
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

           {/* Right side - Details - Full width on mobile */}
          {selected && (
            <Card className="shadow-lg flex flex-col h-full overflow-hidden lg:col-span-1 col-span-1 lg:mx-0 mx-0 bg-[hsl(var(--scheme-ll-graph-bg))] border-0">
              {/* Navigation Header */}
              <div className="bg-[hsl(var(--scheme-nav-bg))] px-4 py-3 shrink-0 border-0">
                <div className="grid grid-cols-3 items-center gap-2">
                  <div className="justify-self-start">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevious}
                      disabled={currentIndex === 0}
                      className="w-[100px] lg:w-[100px] md:w-[80px] sm:w-[70px] text-xs lg:text-sm px-2 bg-[hsl(var(--scheme-nav-button))] hover:bg-[hsl(var(--scheme-nav-button)/.8)] text-[hsl(var(--scheme-nav-text))] border-[hsl(var(--scheme-nav-button))]"
                    >
                      ← Prev
                    </Button>
                  </div>
                  <div className="text-xs lg:text-sm font-semibold text-center text-[hsl(var(--scheme-nav-text))]">
                    Entry {currentIndex + 1} of {entries.length}
                  </div>
                  <div className="justify-self-end">
                    <Button
                      size="sm"
                      onClick={handleNext}
                      disabled={currentIndex === (entries?.length || 0) - 1}
                      className="w-[100px] lg:w-[100px] md:w-[80px] sm:w-[70px] text-xs lg:text-sm px-2 bg-[hsl(var(--scheme-nav-button))] hover:bg-[hsl(var(--scheme-nav-button)/.8)] text-[hsl(var(--scheme-nav-text))] border-[hsl(var(--scheme-nav-button))]"
                    >
                      Next →
                    </Button>
                  </div>
                </div>
              </div>
              
              <CardContent className="space-y-4 lg:py-6 py-4 flex-1 overflow-y-auto lg:px-6 px-4">
                {selected.media && selected.media.length > 0 && (
                  <div className="mb-4 relative">
                    <Carousel className="w-full">
                       <CarouselContent>
                         {selected.media.map((media) => (
                           <CarouselItem key={media.id}>
                             <div className="relative overflow-hidden rounded-lg">
                               {isSuperFan && (
                                 <>
                                   <ImageLockToggle
                                     entryMediaId={media.entryMediaId}
                                     isLocked={media.locked}
                                     onLockChange={() => {
                                       queryClient.invalidateQueries({ queryKey: ["entries", lifelineId] });
                                     }}
                                   />
                                   <Button
                                     variant="secondary"
                                     size="sm"
                                     onClick={() => {
                                       setCoverImageUrl(media.url);
                                       setCoverImagePickerOpen(true);
                                     }}
                                     className="absolute top-12 left-2 z-10"
                                     title="Use as cover image"
                                   >
                                      <ImageUp className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => {
                                        setRepositionMedia({
                                          id: media.id,
                                          url: media.url,
                                          position_x: media.position_x,
                                          position_y: media.position_y,
                                        });
                                        setRepositionPickerOpen(true);
                                      }}
                                      className="absolute top-22 left-2 z-10"
                                      title="Reposition image"
                                    >
                                      <Move className="h-4 w-4" />
                                    </Button>
                                    {!media.locked && (
                                     <SuperFanImageDelete
                                       mediaId={media.id}
                                       entryId={selected.id}
                                       onDeleteComplete={() => {
                                         queryClient.invalidateQueries({ queryKey: ["entries", lifelineId] });
                                       }}
                                     />
                                   )}
                                 </>
                               )}
                               <CroppedImage
                                 src={media.url}
                                 alt={media.alt_text || selected.title}
                                 centerX={media.position_x ?? 50}
                                 centerY={media.position_y ?? 50}
                                 scale={media.scale ?? 1}
                                 className="w-full aspect-video rounded-lg"
                                 preset="entry"
                                 priority
                                 fallback={
                                   <img src="/placeholder.svg" alt="Image failed to load" className="w-8 h-8 opacity-50" />
                                 }
                               />
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      {selected.media.length > 1 && (
                        <>
                          <CarouselPrevious className="left-2" />
                          <CarouselNext className="right-2" />
                        </>
                      )}
                    </Carousel>
                  </div>
                )}
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "shrink-0 px-3 py-1 rounded-md font-bold text-white"
                    )}
                    style={{
                      backgroundColor: (selected.score || 0) >= 0 ? positiveColor : negativeColor
                    }}
                  >
                    {selected.score || 0}
                  </div>
                  <div className="flex-1">
                    {editingTitle ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editedTitle}
                          onChange={(e) => setEditedTitle(e.target.value)}
                          className="text-xl font-bold"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleSaveTitle}
                          disabled={updateEntryMutation.isPending}
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          disabled={updateEntryMutation.isPending}
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold text-[hsl(var(--scheme-title-text))]">
                          {selected.title}
                        </h2>
                        {isSuperFan && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleStartEditTitle}
                            className="p-1 h-auto"
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          </Button>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-sm text-[hsl(var(--scheme-title-text))] opacity-70 mt-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {selected.occurred_on 
                          ? new Date(selected.occurred_on).toLocaleDateString('en-US', { 
                              month: 'long', day: 'numeric', year: 'numeric' 
                            })
                          : "No date"}
                      </span>
                    </div>
                  </div>
                </div>
                {editingDetails ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editedDetails}
                      onChange={(e) => setEditedDetails(e.target.value)}
                      rows={6}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveDetails}
                        disabled={updateEntryMutation.isPending}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={updateEntryMutation.isPending}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <p className="flex-1 leading-relaxed text-[hsl(var(--scheme-title-text))]">
                      {selected.summary || selected.details}
                    </p>
                    {isSuperFan && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleStartEditDetails}
                        className="p-1 h-auto shrink-0"
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </Button>
                    )}
                  </div>
                )}
                 {selected.is_fan_contributed && selected.user_profile && (
                   <p className="text-sm italic text-[hsl(var(--scheme-cards-text))] opacity-70">
                      Credit: Created by{" "}
                      <Link
                        to="/top-contributors"
                        className="underline hover:opacity-80 transition-opacity text-[hsl(var(--scheme-cards-text))]"
                      >
                        {selected.user_profile.first_name}{" "}
                        {selected.user_profile.last_name}
                      </Link>
                    </p>
                  )}
                {selected.contributed_by_user_id === user?.id && selected.contribution_status !== 'approved' && (
                  <div className="pb-2">
                    <ContributionStatusBadge 
                      status={selected.contribution_status || 'pending'}
                      adminMessage={selected.admin_message}
                    />
                  </div>
                )}
                
                <div className="pt-4 flex justify-center gap-2">
                  <CommunityContributionMenu
                    lifelineId={lifelineId}
                    lifelineTitle={lifeline?.title || ""}
                    currentEntryId={selected.id}
                  />

                  {/* Admin Buttons - Only for cenovioj@gmail.com */}
                  {isAdmin && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => setSerpApiModalOpen(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white border-0"
                      >
                        <Search className="h-4 w-4 mr-2" />
                        SerpAPI
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setAiEditModalOpen(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white border-0"
                      >
                        <span className="mr-2">🍌</span>
                        Nano
                      </Button>
                    </>
                  )}
                </div>

                {isSuperFan && (
                  <div className="mt-4">
                    <SuperFanImageUpload 
                      entryId={selected.id}
                      onUploadComplete={() => {
                        queryClient.invalidateQueries({ queryKey: ["entries", lifelineId] });
                      }}
                    />
                  </div>
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
        lifelineTitle={lifeline?.title || ""}
        contributePictureMode={contributePictureMode}
        initialEntryId={contributePictureMode ? selectedId || undefined : undefined}
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

      {isSuperFan && (
        <CoverImagePicker
          lifelineId={lifelineId}
          currentImageUrl={coverImageUrl}
          open={coverImagePickerOpen}
          onOpenChange={setCoverImagePickerOpen}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["lifeline", lifelineId] });
          }}
        />
      )}

      {/* SerpAPI Search Modal - Only for admin */}
      {isAdmin && selected && (
        <SerpApiSearchModal
          open={serpApiModalOpen}
          onClose={() => setSerpApiModalOpen(false)}
          entryId={selected.id}
          initialQuery={selected.serpapi_query || `${selected.title} ${lifeline.title}`}
          onImportComplete={() => {
            queryClient.invalidateQueries({ queryKey: ["entries", lifelineId] });
            queryClient.invalidateQueries({ queryKey: ["lifeline-entries-mobile", lifelineId] });
          }}
        />
      )}

      {/* AI Image Edit Modal (Nano Banana) - Only for admin */}
      {isAdmin && selected && (
        <AiImageEditModal
          open={aiEditModalOpen}
          onClose={() => setAiEditModalOpen(false)}
          entryId={selected.id}
          entryTitle={selected.title}
          entryDescription={selected.summary || selected.details || null}
          onSaveComplete={() => {
            queryClient.invalidateQueries({ queryKey: ["entries", lifelineId] });
          }}
        />
      )}
      
      {repositionMedia && (
        <EntryImageRepositioner
          open={repositionPickerOpen}
          onOpenChange={(open) => {
            setRepositionPickerOpen(open);
            if (!open) setRepositionMedia(null);
          }}
          mediaId={repositionMedia.id}
          imageUrl={repositionMedia.url}
          lifelineId={lifelineId}
          initialPositionX={repositionMedia.position_x}
          initialPositionY={repositionMedia.position_y}
        />
      )}
    </Card>
  );
}
