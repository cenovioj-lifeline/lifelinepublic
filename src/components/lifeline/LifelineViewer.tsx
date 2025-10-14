import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus, Star, Image as ImageIcon } from "lucide-react";
import { ContributeEventDialog } from "@/components/ContributeEventDialog";
import { ContributeImageDialog } from "@/components/ContributeImageDialog";
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
  const [contributeImageDialogOpen, setContributeImageDialogOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const selectionStyle: SelectionStyle = "glow"; // Always use glow

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

  const handlePrevious = () => {
    if (currentIndex > 0 && entries) {
      setSelectedId(entries[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (currentIndex < (entries?.length || 0) - 1 && entries) {
      setSelectedId(entries[currentIndex + 1].id);
    }
  };

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
    <Card className="p-6">
      <CardHeader>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left side - Timeline - Always white background */}
          <div className="space-y-4 bg-white rounded-lg p-6">
            <div className="relative">
              {/* Center vertical line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 -translate-x-1/2" />
              
              <div className="flex flex-col gap-3 py-4">
                {entries.map((entry) => {
                  const isSelected = entry.id === selectedId;
                  const positive = (entry.score || 0) >= 0;
                  const score = entry.score || 0;
                  const width = Math.max(20, Math.min(50, Math.abs(score) * 5));

                  const baseClasses = cn(
                    "relative px-4 py-2 rounded-lg font-medium transition-all duration-300 cursor-pointer",
                    "flex items-center gap-3",
                    positive
                      ? `text-white hover:opacity-90`
                      : `text-white hover:opacity-90`
                  );

                  const bgStyle = positive
                    ? { backgroundColor: positiveColor }
                    : { backgroundColor: negativeColor };

                  const selectedClasses = cn({
                    "scale-110 shadow-lg ring-2 ring-primary": isSelected,
                  });

                  const scoreBoxClasses = cn(
                    "px-2 py-1 rounded bg-white font-bold text-sm min-w-[2rem] text-center"
                  );

                  const scoreTextStyle = positive
                    ? { color: positiveColor }
                    : { color: negativeColor };

                  return (
                    <div
                      key={entry.id}
                      className="relative"
                      style={{ 
                        marginLeft: positive ? 'auto' : '50%',
                        marginRight: positive ? '50%' : 'auto',
                        width: `${width}%`
                      }}
                    >
                      <div
                        className={cn(baseClasses, selectedClasses, positive ? "justify-between" : "justify-between")}
                        onClick={() => setSelectedId(entry.id)}
                        style={bgStyle}
                      >
                        {positive ? (
                          <>
                            <span className={scoreBoxClasses} style={scoreTextStyle}>{score}</span>
                            <span className="truncate text-right flex-1 flex items-center justify-end gap-1">
                              {entry.title}
                              {entry.is_fan_contributed && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="truncate flex-1 flex items-center gap-1">
                              {entry.is_fan_contributed && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />}
                              {entry.title}
                            </span>
                            <span className={scoreBoxClasses} style={scoreTextStyle}>{score}</span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right side - Details */}
          {selected && (
            <Card className="shadow-lg">
              <CardHeader className="bg-muted/50 rounded-t-xl">
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
              <CardContent className="space-y-4 py-6">
                {selected.media && selected.media.length > 0 && (
                  <div className="mb-4">
                    <img
                      src={selected.media[0].url}
                      alt={selected.media[0].alt_text || selected.title}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </div>
                )}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 
                      className="text-2xl font-bold"
                      style={collectionHeadingColor ? { color: collectionHeadingColor } : undefined}
                    >
                      {selected.title}
                    </h2>
                  </div>
                  {!selected.media || selected.media.length === 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setContributeImageDialogOpen(true)}
                    >
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Add Image
                    </Button>
                  )}
                </div>
                <p 
                  className="leading-relaxed"
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
                <div className="flex items-center justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                  >
                    ← Previous
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={currentIndex === (entries?.length || 0) - 1}
                  >
                    Next →
                  </Button>
                </div>
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

      <ContributeImageDialog
        open={contributeImageDialogOpen}
        onOpenChange={setContributeImageDialogOpen}
        entryId={selected?.id || ""}
        entryTitle={selected?.title || ""}
        lifelineId={lifelineId}
        onSignInRequired={() => {
          setContributeImageDialogOpen(false);
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
