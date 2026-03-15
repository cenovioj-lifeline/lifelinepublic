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
import { PublicLayout } from "@/components/PublicLayout";

const ITEMS_PER_PAGE = 6;

export default function PublicCollectionsGrid() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);

  useState(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  });

  const { data: collections, isLoading } = useQuery({
    queryKey: ["public-collections-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("*")
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

  const filteredCollections = useMemo(() => {
    if (!collections) return [];

    let filtered = collections;

    if (searchTerm) {
      filtered = filtered.filter((collection) =>
        collection.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        collection.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (showFavoritesOnly && favorites) {
      filtered = filtered.filter((collection) => favorites.includes(collection.id));
    }

    return filtered;
  }, [collections, searchTerm, showFavoritesOnly, favorites]);

  const totalPages = Math.ceil(filteredCollections.length / ITEMS_PER_PAGE);
  const paginatedCollections = filteredCollections.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">All Collections</h1>
          <p className="text-muted-foreground">Browse and explore all collections</p>
        </div>

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

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : paginatedCollections.length > 0 ? (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {paginatedCollections.map((collection) => (
                <Link
                  key={collection.id}
                  to={`/public/collections/${collection.slug}`}
                  className="group relative"
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full bg-[hsl(var(--scheme-cards-bg))] border-[hsl(var(--scheme-cards-border))]">
                    <div className="absolute top-2 right-2 z-10">
                      <FavoriteButton itemId={collection.id} itemType="collection" />
                    </div>
                    <div className="aspect-video relative bg-white overflow-hidden">
                      {(collection.card_image_url || collection.hero_image_url) ? (
                        <img
                          src={collection.card_image_url || collection.hero_image_url!}
                          alt={collection.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          No image
                        </div>
                      )}
                    </div>
                    <CardHeader className="bg-[hsl(var(--scheme-cards-bg))]">
                      <CardTitle className="text-lg transition-colors text-[hsl(var(--scheme-cards-text))]">
                        {collection.title}
                      </CardTitle>
                    </CardHeader>
                    {collection.description && (
                      <CardContent className="bg-[hsl(var(--scheme-cards-bg))]">
                        <p className="text-sm line-clamp-2 text-[hsl(var(--scheme-cards-text))]">
                          {collection.description}
                        </p>
                      </CardContent>
                    )}
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
                  ? "No favorite collections found."
                  : "No collections match your search criteria."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PublicLayout>
  );
}
