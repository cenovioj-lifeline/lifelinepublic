import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Image as ImageIcon, Trash2, SlidersHorizontal, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { FavoriteButton } from "@/components/FavoriteButton";
import { Button } from "@/components/ui/button";
import { useAdminAccess } from "@/lib/useAdminAccess";
import { LifelineSerpApiSearchModal } from "@/components/admin/LifelineSerpApiSearchModal";
import { deleteImage } from "@/lib/storage";
import { toast } from "sonner";

const ITEMS_PER_PAGE = 6;

export default function PublicLifelinesGrid() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "type">("name");
  const [filterType, setFilterType] = useState<string>("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [imageFilter, setImageFilter] = useState<"all" | "has_images" | "needs_images">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);
  const [serpModalOpen, setSerpModalOpen] = useState(false);
  const [selectedLifeline, setSelectedLifeline] = useState<{ id: string; title: string; serpapi_query?: string | null } | null>(null);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  
  const { hasAccess: isAdmin } = useAdminAccess();
  const queryClient = useQueryClient();

  useState(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  });

  const { data: lifelines, isLoading } = useQuery({
    queryKey: ["public-lifelines-grid"],
    queryFn: async () => {
      const { data: lifelinesData, error } = await supabase
        .from("lifelines")
        .select("*, serpapi_query")
        .eq("status", "published")
        .eq("visibility", "public")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Calculate image completeness for each lifeline
      const lifelinesWithImageStatus = await Promise.all(
        (lifelinesData || []).map(async (lifeline) => {
          const { data: entries } = await supabase
            .from("entries")
            .select("id")
            .eq("lifeline_id", lifeline.id);

          const totalEntries = entries?.length || 0;

          if (totalEntries === 0) {
            return { ...lifeline, hasImages: false, imagePercentage: 0 };
          }

          const { data: entriesWithImages } = await supabase
            .from("entry_images")
            .select("entry_id")
            .in("entry_id", entries?.map((e) => e.id) || []);

          const uniqueEntriesWithImages = new Set(entriesWithImages?.map((ei) => ei.entry_id) || []);
          const entriesWithImagesCount = uniqueEntriesWithImages.size;
          const imagePercentage = (entriesWithImagesCount / totalEntries) * 100;

          return {
            ...lifeline,
            hasImages: imagePercentage >= 80,
            imagePercentage,
          };
        })
      );

      return lifelinesWithImageStatus;
    },
  });

  const { data: favorites } = useQuery({
    queryKey: ["user-favorites-lifelines", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("user_favorites")
        .select("item_id")
        .eq("user_id", userId)
        .eq("item_type", "lifeline");
      if (error) throw error;
      return data.map((f) => f.item_id);
    },
    enabled: !!userId,
  });

  const lifelineTypes = useMemo(() => {
    if (!lifelines) return [];
    const types = new Set(lifelines.map((l) => l.lifeline_type));
    return Array.from(types);
  }, [lifelines]);

  const filteredAndSortedLifelines = useMemo(() => {
    if (!lifelines) return [];

    let filtered = lifelines;

    if (searchTerm) {
      filtered = filtered.filter(
        (lifeline) =>
          lifeline.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lifeline.subject?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter((lifeline) => lifeline.lifeline_type === filterType);
    }

    if (showFavoritesOnly && favorites) {
      filtered = filtered.filter((lifeline) => favorites.includes(lifeline.id));
    }

    if (imageFilter === "has_images") {
      filtered = filtered.filter((lifeline: any) => lifeline.hasImages);
    } else if (imageFilter === "needs_images") {
      filtered = filtered.filter((lifeline: any) => !lifeline.hasImages);
    }

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "name") {
        return a.title.localeCompare(b.title);
      } else {
        return a.lifeline_type.localeCompare(b.lifeline_type);
      }
    });

    return sorted;
  }, [lifelines, searchTerm, filterType, sortBy, showFavoritesOnly, favorites, imageFilter]);

  const totalPages = Math.ceil(filteredAndSortedLifelines.length / ITEMS_PER_PAGE);
  const paginatedLifelines = filteredAndSortedLifelines.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleDeleteCoverImage = async (lifelineId: string, coverImagePath: string | null, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm("Are you sure you want to delete this cover image?")) return;

    try {
      // Delete from storage if path exists
      if (coverImagePath) {
        await deleteImage(coverImagePath);
      }

      // Update database
      const { error } = await supabase
        .from("lifelines")
        .update({ cover_image_url: null, cover_image_path: null })
        .eq("id", lifelineId);

      if (error) throw error;

      toast.success("Cover image deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["public-lifelines-grid"] });
    } catch (error) {
      console.error("Error deleting cover image:", error);
      toast.error("Failed to delete cover image");
    }
  };

  const activeFilterCount = [
    filterType !== "all",
    imageFilter !== "all",
    showFavoritesOnly,
    sortBy !== "name"
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSortBy("name");
    setFilterType("all");
    setImageFilter("all");
    setShowFavoritesOnly(false);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Lifelines</h1>
        <p className="text-muted-foreground">Explore all published lifelines</p>
      </div>

      {/* Mobile: Search + Filter Button | Desktop: All Inline */}
      <div className="flex flex-col gap-4">
        {/* Search bar - always visible */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search lifelines..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>

        {/* Mobile: Filter Button | Desktop: Inline Filters */}
        <div className="flex gap-2">
          {/* Mobile Filter Button (visible only on small screens) */}
          <div className="sm:hidden">
            <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="relative">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[90vh]">
                <SheetHeader>
                  <SheetTitle>Filter Lifelines</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 py-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sort By</label>
                    <Select value={sortBy} onValueChange={(value: "name" | "type") => setSortBy(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="type">Type</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Type</label>
                    <Select value={filterType} onValueChange={(val) => {
                      setFilterType(val);
                      setCurrentPage(1);
                    }}>
                      <SelectTrigger>
                        <SelectValue />
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

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Image Status</label>
                    <Select
                      value={imageFilter}
                      onValueChange={(val: "all" | "has_images" | "needs_images") => {
                        setImageFilter(val);
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Stories</SelectItem>
                        <SelectItem value="has_images">Has Images (≥80%)</SelectItem>
                        <SelectItem value="needs_images">Needs Images (&lt;80%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {userId && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Show</label>
                      <Select
                        value={showFavoritesOnly ? "favorites" : "all"}
                        onValueChange={(val) => {
                          setShowFavoritesOnly(val === "favorites");
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Lifelines</SelectItem>
                          <SelectItem value="favorites">Favorites Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <SheetFooter className="flex-row gap-2">
                  <Button variant="outline" onClick={clearAllFilters} className="flex-1">
                    <X className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                  <Button onClick={() => setFilterSheetOpen(false)} className="flex-1">
                    Apply
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop: Inline Filters (hidden on mobile) */}
          <div className="hidden sm:flex gap-2 flex-wrap">
            <Select value={sortBy} onValueChange={(value: "name" | "type") => setSortBy(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Sort by Name</SelectItem>
                <SelectItem value="type">Sort by Type</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={(val) => {
              setFilterType(val);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-[140px]">
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

            <Select
              value={imageFilter}
              onValueChange={(val: "all" | "has_images" | "needs_images") => {
                setImageFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Image status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stories</SelectItem>
                <SelectItem value="has_images">Has Images (≥80%)</SelectItem>
                <SelectItem value="needs_images">Needs Images (&lt;80%)</SelectItem>
              </SelectContent>
            </Select>

            {userId && (
              <Select
                value={showFavoritesOnly ? "favorites" : "all"}
                onValueChange={(val) => {
                  setShowFavoritesOnly(val === "favorites");
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Lifelines</SelectItem>
                  <SelectItem value="favorites">Favorites Only</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : paginatedLifelines.length > 0 ? (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {paginatedLifelines.map((lifeline) => (
              <Link
                key={lifeline.id}
                to={`/public/lifelines/${lifeline.slug}`}
                className="group relative"
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full bg-[hsl(var(--scheme-cards-bg))] border-[hsl(var(--scheme-cards-border))]">
                  <div className="absolute top-2 right-2 z-10 flex gap-2">
                    {isAdmin && lifeline.cover_image_url && (
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={(e) => handleDeleteCoverImage(lifeline.id, lifeline.cover_image_path, e)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    <FavoriteButton itemId={lifeline.id} itemType="lifeline" />
                  </div>
                  {isAdmin && !lifeline.cover_image_url && (
                    <div className="absolute top-2 left-2 z-10">
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedLifeline({ id: lifeline.id, title: lifeline.title, serpapi_query: lifeline.serpapi_query });
                          setSerpModalOpen(true);
                        }}
                        className="h-8 w-8 rounded-full shadow-md"
                      >
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <div className="aspect-video relative bg-white overflow-hidden">
                    {lifeline.cover_image_url ? (
                      <img
                        src={lifeline.cover_image_url}
                        alt={lifeline.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        style={{
                          objectPosition: `${lifeline.cover_image_position_x ?? 50}% ${lifeline.cover_image_position_y ?? 50}%`
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No image
                      </div>
                    )}
                  </div>
                  <CardHeader className="bg-[hsl(var(--scheme-cards-bg))]">
                    <CardTitle className="text-lg transition-colors text-[hsl(var(--scheme-cards-text))]">
                      {lifeline.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="bg-[hsl(var(--scheme-cards-bg))]">
                    <p className="text-sm line-clamp-2 text-[hsl(var(--scheme-cards-text))]">
                      {lifeline.subtitle || lifeline.intro || "Explore this lifeline"}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {[...Array(totalPages)].map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      onClick={() => setCurrentPage(i + 1)}
                      isActive={currentPage === i + 1}
                      className="cursor-pointer"
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {showFavoritesOnly
                ? "No favorite lifelines found."
                : "No lifelines match your search criteria."}
            </p>
          </CardContent>
        </Card>
      )}

      {selectedLifeline && (
        <LifelineSerpApiSearchModal
          open={serpModalOpen}
          onClose={() => {
            setSerpModalOpen(false);
            setSelectedLifeline(null);
          }}
          lifelineId={selectedLifeline.id}
          initialQuery={selectedLifeline.serpapi_query || ''}
          onImportComplete={() => {
            queryClient.invalidateQueries({ queryKey: ["public-lifelines-grid"] });
          }}
        />
      )}
    </div>
  );
}
