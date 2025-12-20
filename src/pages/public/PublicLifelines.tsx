import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { LifelineViewer } from "@/components/lifeline/LifelineViewer";
import { LifelineBookIcon } from "@/components/icons/LifelineBookIcon";
import { useAdminAccess } from "@/lib/useAdminAccess";
import { LifelineSerpApiSearchModal } from "@/components/admin/LifelineSerpApiSearchModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FavoriteButton } from "@/components/FavoriteButton";
import { parseLifelineTitle } from "@/lib/lifelineTitle";

export default function PublicLifelines() {
  const [selectedLifelineId, setSelectedLifelineId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "type">("name");
  const [filterType, setFilterType] = useState<string>("all");
  const { hasAccess: isAdmin } = useAdminAccess();
  const [serpModalOpen, setSerpModalOpen] = useState(false);
  const [selectedLifeline, setSelectedLifeline] = useState<{ id: string; title: string; serpapi_query?: string | null } | null>(null);

  const { data: lifelines, refetch } = useQuery({
    queryKey: ["public-lifelines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lifelines")
        .select("id, title, slug, lifeline_type, subject, cover_image_url, serpapi_query")
        .eq("status", "published")
        .eq("visibility", "public")
        .order("title");

      if (error) throw error;
      return data;
    },
  });

  const lifelineTypes = useMemo(() => {
    if (!lifelines) return [];
    const types = new Set(lifelines.map(l => l.lifeline_type));
    return Array.from(types);
  }, [lifelines]);

  const filteredAndSortedLifelines = useMemo(() => {
    if (!lifelines) return [];
    
    let filtered = lifelines;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(lifeline =>
        lifeline.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lifeline.subject?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply type filter
    if (filterType !== "all") {
      filtered = filtered.filter(lifeline => lifeline.lifeline_type === filterType);
    }
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "name") {
        return a.title.localeCompare(b.title);
      } else {
        return a.lifeline_type.localeCompare(b.lifeline_type);
      }
    });
    
    return sorted;
  }, [lifelines, searchTerm, filterType, sortBy]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Lifelines</h1>
      </div>

      {/* Search, Sort, and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search lifelines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={sortBy} onValueChange={(value: "name" | "type") => setSortBy(value)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Sort by Name</SelectItem>
            <SelectItem value="type">Sort by Type</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by type..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {lifelineTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="max-w-sm">
        <Select value={selectedLifelineId || ""} onValueChange={setSelectedLifelineId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a lifeline to view" />
          </SelectTrigger>
          <SelectContent>
            {filteredAndSortedLifelines?.map((lifeline) => {
              const parsed = parseLifelineTitle(lifeline.title, lifeline.lifeline_type);
              return (
                <SelectItem key={lifeline.id} value={lifeline.id}>
                  <div className="flex items-center gap-2">
                    <LifelineBookIcon size={16} />
                    {parsed.isPersonType ? (
                      <span>
                        <span className="font-bold uppercase text-xs tracking-wider">{parsed.personName}</span>
                        <span className="mx-1 opacity-40">│</span>
                        <span>{parsed.contextTitle}</span>
                      </span>
                    ) : (
                      <span>{lifeline.title}</span>
                    )}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {selectedLifelineId && <LifelineViewer lifelineId={selectedLifelineId} />}

      {/* SerpAPI Modal */}
      {isAdmin && selectedLifeline && (
        <LifelineSerpApiSearchModal
          open={serpModalOpen}
          onClose={() => {
            setSerpModalOpen(false);
            setSelectedLifeline(null);
          }}
          lifelineId={selectedLifeline.id}
          initialQuery={selectedLifeline.serpapi_query || ''}
          onImportComplete={() => {
            refetch();
          }}
        />
      )}
    </div>
  );
}
