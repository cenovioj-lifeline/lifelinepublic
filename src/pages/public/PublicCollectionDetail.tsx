import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CollectionLayout } from "@/components/CollectionLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Share2, Rss, Users, Settings, Heart } from "lucide-react";
import { CollectionShareModal } from "@/components/CollectionShareModal";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { FavoriteButton } from "@/components/FavoriteButton";

export default function PublicCollectionDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [voteFlipped, setVoteFlipped] = useState(false);
  const [followFlipped, setFollowFlipped] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

  const { data: collection, isLoading: collectionLoading } = useQuery({
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

  const { data: stats } = useQuery({
    queryKey: ["collection-stats", collection?.id],
    queryFn: async () => {
      if (!collection?.id) return null;

      // First get entry IDs for this collection
      const { data: entries } = await supabase
        .from("entries")
        .select("id")
        .eq("collection_id", collection.id);

      const entryIds = entries?.map((e) => e.id) || [];

      const [lifelinesRes, electionsRes, entriesRes, votesRes] = await Promise.all([
        supabase
          .from("lifelines")
          .select("id", { count: "exact", head: true })
          .eq("collection_id", collection.id)
          .eq("status", "published"),
        supabase
          .from("mock_elections")
          .select("id", { count: "exact", head: true })
          .eq("collection_id", collection.id)
          .eq("status", "published"),
        supabase
          .from("entries")
          .select("id", { count: "exact", head: true })
          .eq("collection_id", collection.id),
        entryIds.length > 0
          ? supabase
              .from("entry_votes")
              .select("id", { count: "exact", head: true })
              .in("entry_id", entryIds)
          : { count: 0 },
      ]);

      return {
        lifelines: lifelinesRes.count || 0,
        elections: electionsRes.count || 0,
        entries: entriesRes.count || 0,
        votes: votesRes.count || 0,
      };
    },
    enabled: !!collection?.id,
  });

  const { data: lifelines } = useQuery({
    queryKey: ["collection-lifelines", collection?.id],
    queryFn: async () => {
      if (!collection?.id) return [];

      const { data, error } = await supabase
        .from("lifelines")
        .select('*')
        .eq("collection_id", collection.id)
        .eq("status", "published")
        .eq("is_featured", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!collection?.id,
  });

  const { data: profiles } = useQuery({
    queryKey: ["collection-profiles", collection?.id],
    queryFn: async () => {
      if (!collection?.id) return [];

      const { data, error } = await supabase
        .from("profile_collections")
        .select(`
          profiles!inner(
            id,
            slug,
            display_name,
            summary,
            avatar_image:media_assets!profiles_avatar_image_id_fkey(url, alt_text, position_x, position_y)
          )
        `)
        .eq("collection_id", collection.id)
        .eq("is_featured", true)
        .eq("profiles.status", "published")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data?.map(item => item.profiles).filter(Boolean);
    },
    enabled: !!collection?.id,
  });

  const { data: fanCount } = useQuery({
    queryKey: ["collection-fan-count", collection?.id],
    queryFn: async () => {
      if (!collection?.id) return 0;

      // Get lifelines in this collection
      const { data: collectionLifelines } = await supabase
        .from("lifelines")
        .select("id")
        .eq("collection_id", collection.id);

      const lifelineIds = collectionLifelines?.map((l) => l.id) || [];

      // Get unique users who favorited this collection OR any lifeline in it
      const { data: favorites, error } = await supabase
        .from("user_favorites")
        .select("user_id")
        .or(`and(item_type.eq.collection,item_id.eq.${collection.id}),and(item_type.eq.lifeline,item_id.in.(${lifelineIds.join(",")}))`);

      if (error) throw error;

      // Count unique user_ids
      const uniqueUsers = new Set(favorites?.map((f) => f.user_id) || []);
      return uniqueUsers.size;
    },
    enabled: !!collection?.id,
  });

  if (collectionLoading) {
    return (
      <CollectionLayout collectionTitle="Loading..." collectionSlug={slug || ""}>
        <div className="space-y-6">
          <Skeleton className="h-64 w-full" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </CollectionLayout>
    );
  }

  if (!collection) {
    return (
      <CollectionLayout collectionTitle="Not Found" collectionSlug={slug || ""}>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Collection not found</h2>
          <p className="text-muted-foreground">
            This collection doesn't exist or is not published.
          </p>
        </div>
      </CollectionLayout>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(num >= 10000 ? 0 : 1)}K`;
    }
    return num.toString();
  };

  return (
    <CollectionLayout
      collectionTitle={collection.title}
      collectionSlug={collection.slug}
      collectionId={collection.id}
    >
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="relative rounded-lg overflow-hidden">
          {collection.hero_image_url ? (
            <div className="aspect-[21/9] md:aspect-[3/1] relative">
              <img
                src={collection.hero_image_url}
                alt={collection.title}
                className="w-full h-full object-cover"
                style={{
                  objectPosition: `${collection.hero_image_position_x || 50}% ${collection.hero_image_position_y || 50}%`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute top-4 right-4 z-10">
                <FavoriteButton itemId={collection.id} itemType="collection" className="bg-white/80 hover:bg-white" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8" style={{ color: 'hsl(var(--scheme-ch-banner-text))' }}>
                <h1 className="text-3xl md:text-5xl font-bold mb-2">
                  {collection.title}
                </h1>
                {collection.description && (
                  <p className="text-lg md:text-xl opacity-90 max-w-3xl">
                    {collection.description}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 md:p-12 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg">
              <h1 className="text-3xl md:text-5xl font-bold mb-2">
                {collection.title}
              </h1>
              {collection.description && (
                <p className="text-lg md:text-xl text-muted-foreground max-w-3xl">
                  {collection.description}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            style={{ backgroundColor: 'hsl(var(--scheme-actions-bg))', borderColor: 'hsl(var(--scheme-actions-border))' }}
            onClick={() => navigate(`/public/collections/${collection.slug}/feed`)}
          >
            <CardContent className="pt-6 text-center">
              <Rss
                className="h-8 w-8 mx-auto mb-2"
                style={{ color: 'hsl(var(--scheme-actions-icon))' }}
              />
              <div className="text-sm mt-1" style={{ color: 'hsl(var(--scheme-actions-text))' }}>Feed</div>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            style={{ backgroundColor: 'hsl(var(--scheme-ch-actions-bg))', borderColor: 'hsl(var(--scheme-ch-actions-border))' }}
            onClick={() => setShareModalOpen(true)}
          >
            <CardContent className="pt-6 text-center">
              <Share2
                className="h-8 w-8 mx-auto mb-2"
                style={{ color: 'hsl(var(--scheme-ch-actions-icon))' }}
              />
              <div className="text-sm mt-1" style={{ color: 'hsl(var(--scheme-ch-actions-text))' }}>Share</div>
            </CardContent>
          </Card>
          <Card
            className="relative cursor-pointer hover:shadow-lg transition-shadow"
            style={{ backgroundColor: 'hsl(var(--scheme-ch-actions-bg))', borderColor: 'hsl(var(--scheme-ch-actions-border))' }}
          >
            <div className="absolute top-2 right-2 z-10">
              <FavoriteButton itemId={collection.id} itemType="collection" className="bg-white/80 hover:bg-white" />
            </div>
            <CardContent className="pt-6 text-center">
              <Heart
                className="h-8 w-8 mx-auto mb-2"
                style={{ color: 'hsl(var(--scheme-ch-actions-icon))' }}
              />
              <div 
                className="text-2xl font-bold mb-1"
                style={{ color: 'hsl(var(--scheme-ch-actions-text))' }}
              >
                {fanCount || 0}
              </div>
              <div 
                className="text-sm"
                style={{ color: 'hsl(var(--scheme-ch-actions-text))' }}
              >
                Fans
              </div>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            style={{ backgroundColor: 'hsl(var(--scheme-ch-actions-bg))', borderColor: 'hsl(var(--scheme-ch-actions-border))' }}
            onClick={() => navigate(`/public/collections/${collection.slug}/settings`)}
          >
            <CardContent className="pt-6 text-center">
              <Settings
                className="h-8 w-8 mx-auto mb-2"
                style={{ color: 'hsl(var(--scheme-ch-actions-icon))' }}
              />
              <div className="text-sm mt-1" style={{ color: 'hsl(var(--scheme-ch-actions-text))' }}>Settings</div>
            </CardContent>
          </Card>
        </div>

        {/* Featured Lifelines */}
        {lifelines && lifelines.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-[hsl(var(--scheme-title-text))]">Featured Lifelines</h2>
              <Link
                to={`/public/collections/${collection.slug}/lifelines`}
                className="text-sm flex items-center gap-1 hover:underline"
                style={{ color: collection.primary_color || undefined }}
              >
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {lifelines.length <= 3 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {lifelines.map((lifeline) => (
                  <Link
                    key={lifeline.id}
                    to={`/public/collections/${collection.slug}/lifelines/${lifeline.slug}`}
                    className="group"
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full bg-[hsl(var(--scheme-card-bg))] border-[hsl(var(--scheme-card-border))]">
                      <div className="absolute top-2 right-2 z-10">
                        <FavoriteButton itemId={lifeline.id} itemType="lifeline" />
                      </div>
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
                      <CardHeader className="bg-[hsl(var(--scheme-card-bg))]">
                        <CardTitle className="text-lg transition-colors text-[hsl(var(--scheme-card-text))]">
                          {lifeline.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="bg-[hsl(var(--scheme-card-bg))]">
                        <p className="text-sm line-clamp-2 text-[hsl(var(--scheme-cards-text))]">
                          {lifeline.subtitle || lifeline.intro || "Explore this lifeline"}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Carousel
                opts={{
                  align: "start",
                  loop: false,
                }}
                className="w-full"
              >
                <CarouselContent>
                  {lifelines.map((lifeline) => (
                    <CarouselItem key={lifeline.id} className="md:basis-1/2 lg:basis-1/3">
                      <Link
                        to={`/public/collections/${collection.slug}/lifelines/${lifeline.slug}`}
                        className="group block h-full"
                      >
                        <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full bg-[hsl(var(--scheme-card-bg))] border-[hsl(var(--scheme-card-border))]">
                          <div className="absolute top-2 right-2 z-10">
                            <FavoriteButton itemId={lifeline.id} itemType="lifeline" />
                          </div>
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
                          <CardHeader className="bg-[hsl(var(--scheme-card-bg))]">
                            <CardTitle className="text-lg transition-colors text-[hsl(var(--scheme-card-text))]">
                              {lifeline.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="bg-[hsl(var(--scheme-card-bg))]">
                            <p className="text-sm line-clamp-2 text-[hsl(var(--scheme-cards-text))]">
                              {lifeline.subtitle || lifeline.intro || "Explore this lifeline"}
                            </p>
                          </CardContent>
                        </Card>
                      </Link>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            )}
          </section>
        )}

        {/* Featured Profiles */}
        {profiles && profiles.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-[hsl(var(--scheme-title-text))]">Featured Profiles</h2>
              <Link
                to={`/public/collections/${collection.slug}/profiles`}
                className="text-sm flex items-center gap-1 hover:underline"
                style={{ color: collection.primary_color || undefined }}
              >
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {profiles.length <= 3 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {profiles.map((profile: any) => (
                  <Link
                    key={profile.id}
                    to={`/public/collections/${collection.slug}/profiles/${profile.slug}`}
                    className="group"
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full bg-[hsl(var(--scheme-card-bg))] border-[hsl(var(--scheme-card-border))]">
                      <div className="aspect-video relative bg-white overflow-hidden">
                        {profile.avatar_image?.url ? (
                          <img
                            src={profile.avatar_image.url}
                            alt={profile.avatar_image.alt_text || profile.display_name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            style={{
                              objectPosition: `${profile.avatar_image.position_x ?? 50}% ${profile.avatar_image.position_y ?? 50}%`
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            No image
                          </div>
                        )}
                      </div>
                      <CardHeader className="bg-[hsl(var(--scheme-card-bg))]">
                        <CardTitle className="text-lg transition-colors text-[hsl(var(--scheme-card-text))]">
                          {profile.display_name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="bg-[hsl(var(--scheme-card-bg))]">
                        <p className="text-sm line-clamp-2 text-[hsl(var(--scheme-cards-text))]">
                          {profile.summary || "View this profile"}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Carousel
                opts={{
                  align: "start",
                  loop: false,
                }}
                className="w-full"
              >
                <CarouselContent>
                  {profiles.map((profile: any) => (
                    <CarouselItem key={profile.id} className="md:basis-1/2 lg:basis-1/3">
                      <Link
                        to={`/public/collections/${collection.slug}/profiles/${profile.slug}`}
                        className="group block h-full"
                      >
                        <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full bg-[hsl(var(--scheme-card-bg))] border-[hsl(var(--scheme-card-border))]">
                          <div className="aspect-video relative bg-white overflow-hidden">
                            {profile.avatar_image?.url ? (
                              <img
                                src={profile.avatar_image.url}
                                alt={profile.avatar_image.alt_text || profile.display_name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                style={{
                                  objectPosition: `${profile.avatar_image.position_x ?? 50}% ${profile.avatar_image.position_y ?? 50}%`
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                No image
                              </div>
                            )}
                          </div>
                          <CardHeader className="bg-[hsl(var(--scheme-card-bg))]">
                            <CardTitle className="text-lg transition-colors text-[hsl(var(--scheme-card-text))]">
                              {profile.display_name}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="bg-[hsl(var(--scheme-card-bg))]">
                            <p className="text-sm line-clamp-2 text-[hsl(var(--scheme-cards-text))]">
                              {profile.summary || "View this profile"}
                            </p>
                          </CardContent>
                        </Card>
                      </Link>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            )}
          </section>
        )}
      </div>

      <CollectionShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        collectionSlug={collection.slug}
        collectionTitle={collection.title}
      />
    </CollectionLayout>
  );
}
