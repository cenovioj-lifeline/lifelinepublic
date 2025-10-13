import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CollectionLayout } from "@/components/CollectionLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { useState, useMemo } from "react";

export default function CollectionLifelines() {
  const { slug } = useParams<{ slug: string }>();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "type">("name");
  const [filterType, setFilterType] = useState<string>("all");

  const { data: collection } = useQuery({
    queryKey: ["public-collection", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: lifelines, isLoading } = useQuery({
    queryKey: ["collection-lifelines-all", collection?.id],
    queryFn: async () => {
      if (!collection?.id) return [];

      const { data, error } = await supabase
        .from("lifelines")
        .select(`
          *,
          cover_image:media_assets!lifelines_cover_image_id_fkey(url, alt_text, position_x, position_y),
          profile:profiles!lifelines_profile_id_fkey(
            display_name,
            avatar_image:media_assets!profiles_avatar_image_id_fkey(url, alt_text)
          )
        `)
        .eq("collection_id", collection.id)
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!collection?.id,
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

  if (!collection) {
    return (
      <CollectionLayout collectionTitle="Loading..." collectionSlug={slug || ""}>
        <div>Loading...</div>
      </CollectionLayout>
    );
  }

  return (
    <CollectionLayout
      collectionTitle={collection.title}
      collectionSlug={collection.slug}
      primaryColor={collection.primary_color}
      secondaryColor={collection.secondary_color}
      webPrimary={collection.web_primary}
      webSecondary={collection.web_secondary}
      menuTextColor={collection.menu_text_color}
      menuHoverColor={collection.menu_hover_color}
      menuActiveColor={collection.menu_active_color}
      collectionBgColor={collection.collection_bg_color}
      collectionTextColor={collection.collection_text_color}
      collectionHeadingColor={collection.collection_heading_color}
      collectionAccentColor={collection.collection_accent_color}
      collectionCardBg={collection.collection_card_bg}
      collectionBorderColor={collection.collection_border_color}
      collectionMutedText={collection.collection_muted_text}
      collectionBadgeColor={collection.collection_badge_color}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Lifelines</h1>
          <p className="text-muted-foreground">
            All lifelines in {collection.title}
          </p>
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

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : filteredAndSortedLifelines && filteredAndSortedLifelines.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedLifelines.map((lifeline) => (
              <Link
                key={lifeline.id}
                to={`/public/collections/${slug}/lifelines/${lifeline.slug}`}
                className="group"
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                  <div className="aspect-video relative bg-muted overflow-hidden">
                    {lifeline.cover_image?.url ? (
                      <img
                        src={lifeline.cover_image.url}
                        alt={lifeline.cover_image.alt_text || lifeline.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        style={{
                          objectPosition: `${lifeline.cover_image.position_x ?? 50}% ${lifeline.cover_image.position_y ?? 50}%`
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No image
                      </div>
                    )}
                  </div>
                    <CardHeader>
                      <CardTitle className="text-lg text-foreground transition-colors">
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
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {lifelines && lifelines.length > 0 
                  ? "No lifelines match your search criteria."
                  : "No lifelines found in this collection."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </CollectionLayout>
  );
}
