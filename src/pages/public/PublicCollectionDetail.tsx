import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CollectionLayout } from "@/components/CollectionLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Share2, Rss, Users, Settings } from "lucide-react";
import { CollectionShareModal } from "@/components/CollectionShareModal";
import { JoinCommunityDialog } from "@/components/JoinCommunityDialog";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { PublicAuthModal } from "@/components/PublicAuthModal";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { FavoriteButton } from "@/components/FavoriteButton";
import { lifelineLink } from "@/lib/navigationLinks";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function PublicCollectionDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [constructionAlertOpen, setConstructionAlertOpen] = useState(false);
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

  const { data: featuredItems } = useQuery({
    queryKey: ["collection-featured-items", collection?.id],
    queryFn: async () => {
      if (!collection?.id) return [];

      const { data: featuredItemsData, error: featuredError } = await supabase
        .from("collection_featured_items")
        .select("*")
        .eq("collection_id", collection.id)
        .order("order_index");

      if (featuredError) throw featuredError;
      if (!featuredItemsData || featuredItemsData.length === 0) return [];

      // Fetch the actual content for each item
      const items = await Promise.all(
        featuredItemsData.map(async (item) => {
          if (item.item_type === "lifeline") {
            const { data } = await supabase
              .from("lifelines")
              .select("*")
              .eq("id", item.item_id)
              .eq("status", "published")
              .single();
            return data ? { ...data, _type: "lifeline" } : null;
          } else if (item.item_type === "election") {
            const { data } = await supabase
              .from("mock_elections")
              .select("*")
              .eq("id", item.item_id)
              .eq("status", "published")
              .single();
            return data ? { ...data, _type: "election" } : null;
          } else if (item.item_type === "profile") {
            const { data } = await supabase
              .from("profiles")
              .select("id, slug, name, short_description, primary_image_url, primary_image_path, status")
              .eq("id", item.item_id)
              .eq("status", "published")
              .single();
            return data ? { ...data, _type: "profile" } : null;
          }
          return null;
        })
      );

      return items.filter(Boolean);
    },
    enabled: !!collection?.id,
  });

  const { data: customSectionItems } = useQuery({
    queryKey: ["collection-custom-section-items", collection?.id],
    queryFn: async () => {
      if (!collection?.id) return [];

      const { data: customItemsData, error: customError } = await supabase
        .from("collection_custom_section_items")
        .select("*")
        .eq("collection_id", collection.id)
        .order("order_index");

      if (customError) throw customError;
      if (!customItemsData || customItemsData.length === 0) return [];

      // Fetch the actual content for each item
      const items = await Promise.all(
        customItemsData.map(async (item) => {
          if (item.item_type === "lifeline") {
            const { data } = await supabase
              .from("lifelines")
              .select("*")
              .eq("id", item.item_id)
              .eq("status", "published")
              .single();
            return data ? { ...data, _type: "lifeline" } : null;
          } else if (item.item_type === "election") {
            const { data } = await supabase
              .from("mock_elections")
              .select("*")
              .eq("id", item.item_id)
              .eq("status", "published")
              .single();
            return data ? { ...data, _type: "election" } : null;
          } else if (item.item_type === "profile") {
            const { data } = await supabase
              .from("profiles")
              .select("id, slug, name, short_description, primary_image_url, primary_image_path, status")
              .eq("id", item.item_id)
              .eq("status", "published")
              .single();
            return data ? { ...data, _type: "profile" } : null;
          }
          return null;
        })
      );

      return items.filter(Boolean);
    },
    enabled: !!collection?.id,
  });

  // Fetch lifelines when no featured items exist
  const { data: recentLifelines } = useQuery({
    queryKey: ["collection-recent-lifelines", collection?.id],
    enabled: !!collection?.id && (!featuredItems || featuredItems.length === 0),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lifelines")
        .select(`
          id,
          title,
          slug,
          subtitle,
          is_featured,
          cover_image_id,
          cover_image_url,
          cover_image_position_x,
          cover_image_position_y,
          created_at
        `)
        .eq("collection_id", collection!.id)
        .eq("status", "published")
        .order("is_featured", { ascending: false })
        .order("cover_image_id", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      return data;
    },
  });

  // Fetch profiles when no featured items exist
  const { data: recentProfiles } = useQuery({
    queryKey: ["collection-recent-profiles", collection?.id],
    enabled: !!collection?.id && (!featuredItems || featuredItems.length === 0),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          name,
          slug,
          short_description,
          avatar_image_id,
          primary_image_url,
          created_at,
          avatar_image:media_assets!avatar_image_id(url),
          profile_collections!inner(is_featured, collection_id)
        `)
        .eq("profile_collections.collection_id", collection!.id)
        .eq("status", "published")
        .order("avatar_image_id", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      // Sort by is_featured client-side and take top 3
      return (data || [])
        .sort((a: any, b: any) => {
          const aFeatured = a.profile_collections?.is_featured || false;
          const bFeatured = b.profile_collections?.is_featured || false;
          if (aFeatured === bFeatured) return 0;
          return aFeatured ? -1 : 1;
        })
        .slice(0, 3);
    },
  });

  const { data: memberCount } = useQuery({
    queryKey: ["collection-member-count", collection?.id],
    queryFn: async () => {
      if (!collection?.id) return 0;

      const { count, error } = await supabase
        .from("collection_members")
        .select("*", { count: "exact", head: true })
        .eq("collection_id", collection.id);

      if (error) throw error;
      return count || 0;
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

  const renderContentCard = (item: any, collectionSlug: string) => {
    if (item._type === "lifeline") {
      // Use lifelineLink helper with collection referrer
      const lifelinePath = lifelineLink(item.slug, {
        collectionSlug,
        from: { type: 'collection' }
      });
      return (
        <Link
          key={item.id}
          to={lifelinePath}
          className="group"
        >
          <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full bg-[hsl(var(--scheme-card-bg))] border-[hsl(var(--scheme-card-border))]">
            <div className="absolute top-2 right-2 z-10">
              <FavoriteButton itemId={item.id} itemType="lifeline" />
            </div>
            <div className="aspect-video relative bg-white overflow-hidden">
              {item.cover_image_url ? (
                <img
                  src={item.cover_image_url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  style={{
                    objectPosition: `${item.cover_image_position_x ?? 50}% ${item.cover_image_position_y ?? 50}%`
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
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="bg-[hsl(var(--scheme-card-bg))]">
              <p className="text-sm line-clamp-2 text-[hsl(var(--scheme-cards-text))]">
                {item.subtitle || item.intro || "Explore this lifeline"}
              </p>
            </CardContent>
          </Card>
        </Link>
      );
    } else if (item._type === "election") {
      return (
        <Link
          key={item.id}
          to={`/public/collections/${collectionSlug}/elections/${item.slug}`}
          className="group"
        >
          <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full bg-[hsl(var(--scheme-card-bg))] border-[hsl(var(--scheme-card-border))]">
            <div className="aspect-video relative bg-white overflow-hidden">
              {item.hero_image_url ? (
                <img
                  src={item.hero_image_url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  style={{
                    objectPosition: `${item.hero_image_position_x ?? 50}% ${item.hero_image_position_y ?? 50}%`
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
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="bg-[hsl(var(--scheme-card-bg))]">
              <p className="text-sm line-clamp-2 text-[hsl(var(--scheme-cards-text))]">
                {item.description || "View this election"}
              </p>
            </CardContent>
          </Card>
        </Link>
      );
    } else if (item._type === "profile") {
      return (
        <Link
          key={item.id}
          to={`/public/collections/${collectionSlug}/profiles/${item.slug}`}
          className="group"
        >
          <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full bg-[hsl(var(--scheme-card-bg))] border-[hsl(var(--scheme-card-border))]">
            <div className="aspect-video relative bg-white overflow-hidden">
              {item.primary_image_url ? (
                <img
                  src={item.primary_image_url}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No image
                </div>
              )}
            </div>
            <CardHeader className="bg-[hsl(var(--scheme-card-bg))]">
              <CardTitle className="text-lg transition-colors text-[hsl(var(--scheme-card-text))]">
                {item.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="bg-[hsl(var(--scheme-card-bg))]">
              <p className="text-sm line-clamp-2 text-[hsl(var(--scheme-cards-text))]">
                {item.short_description || "View this profile"}
              </p>
            </CardContent>
          </Card>
        </Link>
      );
    }
    return null;
  };

  return (
    <CollectionLayout
      collectionTitle={collection.title}
      collectionSlug={collection.slug}
      collectionId={collection.id}
    >
      <div className="space-y-4">
        {/* Hero Section */}
        <div className="relative rounded-lg overflow-hidden">
          {collection.hero_image_url ? (
            <div className="aspect-[4/1] relative">
              <img
                src={collection.hero_image_url}
                alt={collection.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 z-10">
                <FavoriteButton itemId={collection.id} itemType="collection" className="bg-white/80 hover:bg-white" />
              </div>
              <div className="hidden absolute bottom-0 left-0 right-0 p-6 md:p-8" style={{ color: 'hsl(var(--scheme-ch-banner-text))' }}>
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
        <div className="grid grid-cols-4 gap-2 md:gap-4">
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            style={{ backgroundColor: 'hsl(var(--scheme-actions-bg))', borderColor: 'hsl(var(--scheme-actions-border))' }}
            onClick={() => setConstructionAlertOpen(true)}
          >
            <CardContent className="p-3 md:p-6 text-center">
              <Rss
                className="h-5 w-5 md:h-8 md:w-8 mx-auto mb-1 md:mb-2"
                style={{ color: 'hsl(var(--scheme-actions-icon))' }}
              />
              <div className="text-[10px] md:text-sm mt-1" style={{ color: 'hsl(var(--scheme-actions-text))' }}>Feed</div>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            style={{ backgroundColor: 'hsl(var(--scheme-ch-actions-bg))', borderColor: 'hsl(var(--scheme-ch-actions-border))' }}
            onClick={() => setShareModalOpen(true)}
          >
            <CardContent className="p-3 md:p-6 text-center">
              <Share2
                className="h-5 w-5 md:h-8 md:w-8 mx-auto mb-1 md:mb-2"
                style={{ color: 'hsl(var(--scheme-ch-actions-icon))' }}
              />
              <div className="text-[10px] md:text-sm mt-1" style={{ color: 'hsl(var(--scheme-ch-actions-text))' }}>Share</div>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            style={{ backgroundColor: 'hsl(var(--scheme-ch-actions-bg))', borderColor: 'hsl(var(--scheme-ch-actions-border))' }}
            onClick={() => setJoinDialogOpen(true)}
          >
            <CardContent className="p-3 md:p-6 text-center">
              <Users
                className="h-5 w-5 md:h-8 md:w-8 mx-auto mb-1 md:mb-2"
                style={{ color: 'hsl(var(--scheme-ch-actions-icon))' }}
              />
              <div className="text-[10px] md:text-sm mt-1" style={{ color: 'hsl(var(--scheme-ch-actions-text))' }}>
                {memberCount || 0} Members
              </div>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            style={{ backgroundColor: 'hsl(var(--scheme-ch-actions-bg))', borderColor: 'hsl(var(--scheme-ch-actions-border))' }}
            onClick={() => navigate(`/public/collections/${collection.slug}/settings`)}
          >
            <CardContent className="p-3 md:p-6 text-center">
              <Settings
                className="h-5 w-5 md:h-8 md:w-8 mx-auto mb-1 md:mb-2"
                style={{ color: 'hsl(var(--scheme-ch-actions-icon))' }}
              />
              <div className="text-[10px] md:text-sm mt-1" style={{ color: 'hsl(var(--scheme-ch-actions-text))' }}>Settings</div>
            </CardContent>
          </Card>
        </div>

        {/* Featured Content */}
        {featuredItems && featuredItems.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-[hsl(var(--scheme-title-text))]">Featured</h2>
            </div>
            {featuredItems.length <= 3 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {featuredItems.map((item: any) => renderContentCard(item, collection.slug))}
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
                  {featuredItems.map((item: any) => (
                    <CarouselItem key={item.id} className="md:basis-1/2 lg:basis-1/3">
                      {renderContentCard(item, collection.slug)}
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            )}
          </section>
        )}

        {/* Custom Section */}
        {customSectionItems && customSectionItems.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-[hsl(var(--scheme-title-text))]">
                {collection.custom_section_name || "New Content"}
              </h2>
            </div>
            {customSectionItems.length <= 3 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {customSectionItems.map((item: any) => renderContentCard(item, collection.slug))}
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
                  {customSectionItems.map((item: any) => (
                    <CarouselItem key={item.id} className="md:basis-1/2 lg:basis-1/3">
                      {renderContentCard(item, collection.slug)}
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            )}
          </section>
        )}

        {/* Fallback: Show recent content when no featured items */}
        {(!featuredItems || featuredItems.length === 0) && (
          <>
            {/* Recent Lifelines Section */}
            {recentLifelines && recentLifelines.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-[hsl(var(--scheme-title-text))]">Lifelines</h2>
                  <Link to={`/public/collections/${collection.slug}/lifelines`}>
                    <button className="flex items-center gap-2 text-sm hover:underline">
                      View All <ArrowRight className="h-4 w-4" />
                    </button>
                  </Link>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {recentLifelines.map((lifeline: any) => {
                    // Use lifelineLink helper with collection referrer
                    const lifelinePath = lifelineLink(lifeline.slug, {
                      collectionSlug: collection.slug,
                      from: { type: 'collection' }
                    });
                    return (
                      <Link
                        key={lifeline.id}
                        to={lifelinePath}
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
                              {lifeline.subtitle || "Explore this lifeline"}
                            </p>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Recent Profiles Section */}
            {recentProfiles && recentProfiles.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-[hsl(var(--scheme-title-text))]">People</h2>
                  <Link to={`/public/collections/${collection.slug}/profiles`}>
                    <button className="flex items-center gap-2 text-sm hover:underline">
                      View All <ArrowRight className="h-4 w-4" />
                    </button>
                  </Link>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {recentProfiles.map((profile: any) => (
                    <Link
                      key={profile.id}
                      to={`/public/collections/${collection.slug}/profiles/${profile.slug}`}
                      className="group"
                    >
                      <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full bg-[hsl(var(--scheme-card-bg))] border-[hsl(var(--scheme-card-border))]">
                        <div className="aspect-video relative bg-white overflow-hidden">
                          {(profile.primary_image_url || profile.avatar_image?.url) ? (
                            <img
                              src={profile.primary_image_url || profile.avatar_image?.url}
                              alt={profile.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              No image
                            </div>
                          )}
                        </div>
                        <CardHeader className="bg-[hsl(var(--scheme-card-bg))]">
                          <CardTitle className="text-lg transition-colors text-[hsl(var(--scheme-card-text))]">
                            {profile.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="bg-[hsl(var(--scheme-card-bg))]">
                          <p className="text-sm line-clamp-2 text-[hsl(var(--scheme-cards-text))]">
                            {profile.short_description || "View this profile"}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <CollectionShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        collectionSlug={collection.slug}
        collectionTitle={collection.title}
      />

      <JoinCommunityDialog
        open={joinDialogOpen}
        onOpenChange={setJoinDialogOpen}
        collectionId={collection.id}
        collectionTitle={collection.title}
        collectionSlug={collection.slug}
        onSignInRequired={() => {
          setJoinDialogOpen(false);
          setAuthModalOpen(true);
        }}
      />

      <PublicAuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
      />

      <AlertDialog open={constructionAlertOpen} onOpenChange={setConstructionAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Site Under Construction</AlertDialogTitle>
            <AlertDialogDescription>
              This feature is still under construction and will be available soon.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CollectionLayout>
  );
}
