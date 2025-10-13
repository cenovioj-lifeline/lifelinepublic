import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LifelineViewerProps {
  lifelineId: string;
  primaryColor?: string | null;
  secondaryColor?: string | null;
}

type SelectionStyle = "glow" | "lifted" | "sheen" | "wave";

export function LifelineViewer({ lifelineId, primaryColor, secondaryColor }: LifelineViewerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  const { data: entries } = useQuery({
    queryKey: ["entries", lifelineId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entries")
        .select("*")
        .eq("lifeline_id", lifelineId)
        .order("order_index");

      if (error) throw error;
      return data;
    },
    enabled: !!lifelineId,
  });

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
        <CardTitle className="text-2xl">{lifeline.title}</CardTitle>
        {lifeline.subtitle && (
          <p className="text-muted-foreground">{lifeline.subtitle}</p>
        )}
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
                            <span className="truncate text-right flex-1">{entry.title}</span>
                          </>
                        ) : (
                          <>
                            <span className="truncate flex-1">{entry.title}</span>
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
                      <CardTitle className="text-base leading-tight">
                        {lifeline.profiles?.display_name || "Unknown"}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">Entry details</p>
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
                <h2 className="text-2xl font-bold">{selected.title}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {selected.summary || selected.details}
                </p>
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
    </Card>
  );
}
