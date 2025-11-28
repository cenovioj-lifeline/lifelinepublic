import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { CollectionCard } from "@/components/CollectionCard";

const ITEMS_PER_PAGE = 6;

export default function PublicCollections() {
  const [featuredOpen, setFeaturedOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "members" | "image">("name");
  const [currentPage, setCurrentPage] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);

  useState(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  });

  const { data: collections, isLoading } = useQuery({
    queryKey: ["public-collections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select(`
          *,
          collection_members(count)
        `)
        .eq("status", "published")
        .order("is_featured", { ascending: false })
        .order("title");

      if (error) throw error;
      return data;
    },
  });

  const { data: favorites } = useQuery({
    queryKey: ["user-favorites-collections", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("user_favorites")
        .select("item_id")
        .eq("user_id", userId)
        .eq("item_type", "collection");
      if (error) throw error;
      return data.map((f) => f.item_id);
    },
    enabled: !!userId,
  });

  const featuredCollections = collections?.filter((c) => c.is_featured) || [];
  const nonFeaturedCollections = collections?.filter((c) => !c.is_featured) || [];

  const filteredCollections = useMemo(() => {
    let filtered = nonFeaturedCollections;

    if (searchTerm) {
      filtered = filtered.filter((collection) =>
        collection.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        collection.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (showFavoritesOnly && favorites) {
      filtered = filtered.filter((collection) => favorites.includes(collection.id));
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "name") {
        return a.title.localeCompare(b.title);
      } else if (sortBy === "members") {
        const aCount = (a as any).collection_members?.[0]?.count || 0;
        const bCount = (b as any).collection_members?.[0]?.count || 0;
        return bCount - aCount; // Descending
      } else if (sortBy === "image") {
        const aHasImage = a.hero_image_url ? 1 : 0;
        const bHasImage = b.hero_image_url ? 1 : 0;
        return bHasImage - aHasImage; // Collections with images first
      }
      return 0;
    });

    return sorted;
  }, [nonFeaturedCollections, searchTerm, showFavoritesOnly, favorites, sortBy]);

  const totalPages = Math.ceil(filteredCollections.length / ITEMS_PER_PAGE);
  const paginatedCollections = filteredCollections.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Collections</h1>
        <p className="text-muted-foreground">
          Explore curated collections of lifelines, stories, and elections
        </p>
      </div>

      {featuredCollections.length > 0 && (
        <Collapsible open={featuredOpen} onOpenChange={setFeaturedOpen}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Featured Collections</h2>
            <CollapsibleTrigger className="hover:opacity-75 transition-opacity">
              <ChevronDown
                className={`h-5 w-5 transition-transform duration-200 ${featuredOpen ? "" : "-rotate-90"}`}
              />
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent className="space-y-4">
            <Carousel
              opts={{
                align: "start",
                loop: false,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-4">
                {featuredCollections.map((collection) => (
                  <CarouselItem
                    key={collection.id}
                    className="pl-4 basis-full md:basis-1/2 lg:basis-1/3"
                  >
                    <CollectionCard collection={collection} showFeaturedBadge />
                  </CarouselItem>
                ))}
              </CarouselContent>
              {featuredCollections.length > 3 && (
                <>
                  <CarouselPrevious className="hidden md:flex" />
                  <CarouselNext className="hidden md:flex" />
                </>
              )}
            </Carousel>
          </CollapsibleContent>
        </Collapsible>
      )}

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">All Collections</h2>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search collections..."
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
            onValueChange={(val: "name" | "members" | "image") => {
              setSortBy(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Sort by Name</SelectItem>
              <SelectItem value="members">Sort by Members</SelectItem>
              <SelectItem value="image">Has Image</SelectItem>
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
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filter..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Collections</SelectItem>
                <SelectItem value="favorites">Favorites Only</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {paginatedCollections.length > 0 ? (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {paginatedCollections.map((collection) => (
                <CollectionCard key={collection.id} collection={collection} />
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
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {showFavoritesOnly
                ? "No favorite collections found."
                : searchTerm
                ? "No collections match your search criteria."
                : "No collections available yet."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
