import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { FavoriteButton } from "@/components/FavoriteButton";

const ITEMS_PER_PAGE = 6;

export default function PublicLifelinesGrid() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "type">("name");
  const [filterType, setFilterType] = useState<string>("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [imageFilter, setImageFilter] = useState<"all" | "has_images" | "needs_images">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);

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
        .select(`
          *,
          cover_image:media_assets!lifelines_cover_image_id_fkey(url, alt_text)
        `)
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

          const { data: entriesWithMedia } = await supabase
            .from("entry_media")
            .select("entry_id")
            .in("entry_id", entries?.map((e) => e.id) || []);

          const uniqueEntriesWithMedia = new Set(entriesWithMedia?.map((em) => em.entry_id) || []);
          const entriesWithImagesCount = uniqueEntriesWithMedia.size;
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Lifelines</h1>
        <p className="text-muted-foreground">Explore all published lifelines</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
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

        <Select
          value={sortBy}
          onValueChange={(value: "name" | "type") => setSortBy(value)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
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

        <Select
          value={imageFilter}
          onValueChange={(val: "all" | "has_images" | "needs_images") => {
            setImageFilter(val);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
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
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Lifelines</SelectItem>
              <SelectItem value="favorites">Favorites Only</SelectItem>
            </SelectContent>
          </Select>
        )}
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
                <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                  <div className="absolute top-2 right-2 z-10">
                    <FavoriteButton itemId={lifeline.id} itemType="lifeline" />
                  </div>
                  <div className="aspect-video relative bg-muted overflow-hidden">
                    {lifeline.cover_image?.url ? (
                      <img
                        src={lifeline.cover_image.url}
                        alt={lifeline.cover_image.alt_text || lifeline.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        style={{
                          objectPosition: `${lifeline.cover_image_position_x ?? 50}% ${lifeline.cover_image_position_y ?? 50}%`
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No image
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {lifeline.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
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
    </div>
  );
}
