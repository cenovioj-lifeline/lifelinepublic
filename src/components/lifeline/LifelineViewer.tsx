import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface LifelineViewerProps {
  lifelineId: string;
}

type SelectionStyle = "glow" | "lifted" | "sheen" | "wave";

export function LifelineViewer({ lifelineId }: LifelineViewerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectionStyle, setSelectionStyle] = useState<SelectionStyle>("glow");

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
          {/* Left side - Timeline */}
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-6">
              <label className="text-sm text-muted-foreground">Selection style</label>
              <Select value={selectionStyle} onValueChange={(v) => setSelectionStyle(v as SelectionStyle)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="glow">Glow + Scale</SelectItem>
                  <SelectItem value="lifted">Lifted Card</SelectItem>
                  <SelectItem value="sheen">Animated Sheen</SelectItem>
                  <SelectItem value="wave">Wave Subtle</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="relative flex flex-col items-center gap-3">
              {entries.map((entry) => {
                const isSelected = entry.id === selectedId;
                const positive = (entry.score || 0) >= 0;
                const score = entry.score || 0;
                const width = Math.max(10, Math.min(100, Math.abs(score) * 10));

                const baseClasses = cn(
                  "relative px-4 py-2 rounded-lg font-medium transition-all duration-300 cursor-pointer",
                  "flex items-center justify-between gap-2",
                  positive
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-red-600 text-white hover:bg-red-700"
                );

                const selectedClasses = cn({
                  "scale-110 shadow-lg ring-2 ring-primary": selectionStyle === "glow" && isSelected,
                  "translate-y-[-4px] shadow-xl": selectionStyle === "lifted" && isSelected,
                  "animate-pulse": selectionStyle === "wave" && isSelected,
                });

                return (
                  <div
                    key={entry.id}
                    className={cn(baseClasses, selectedClasses)}
                    style={{ width: `${width}%` }}
                    onClick={() => setSelectedId(entry.id)}
                  >
                    <span className="truncate">{entry.title}</span>
                    <span className="font-bold text-sm">{score}</span>
                  </div>
                );
              })}
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
                      "px-3 py-1 rounded-md font-bold",
                      (selected.score || 0) >= 0
                        ? "bg-green-600 text-white"
                        : "bg-red-600 text-white"
                    )}
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
