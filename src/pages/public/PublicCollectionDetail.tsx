import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CollectionLayout } from "@/components/CollectionLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";

export default function PublicCollectionDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data: collection, isLoading: collectionLoading } = useQuery({
    queryKey: ["public-collection", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select(`
          *,
          hero_image:media_assets!collections_hero_image_id_fkey(url, alt_text)
        `)
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
        .select(`
          *,
          cover_image:media_assets!lifelines_cover_image_id_fkey(url, alt_text),
          profile:profiles!lifelines_profile_id_fkey(
            display_name,
            avatar_image:media_assets!profiles_avatar_image_id_fkey(url, alt_text)
          )
        `)
        .eq("collection_id", collection.id)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;
      return data;
    },
    enabled: !!collection?.id,
  });

  const { data: elections } = useQuery({
    queryKey: ["collection-elections", collection?.id],
    queryFn: async () => {
      if (!collection?.id) return [];

      const { data, error } = await supabase
        .from("mock_elections")
        .select("*")
        .eq("collection_id", collection.id)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
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
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="relative rounded-lg overflow-hidden">
          {collection.hero_image?.url ? (
            <div className="aspect-[21/9] md:aspect-[3/1] relative">
              <img
                src={collection.hero_image.url}
                alt={collection.hero_image.alt_text || collection.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
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

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card style={{ borderColor: collection.primary_color || undefined }}>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold" style={{ color: collection.primary_color || undefined }}>
                  {formatNumber(stats.lifelines)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Lifelines</div>
              </CardContent>
            </Card>
            <Card style={{ borderColor: collection.primary_color || undefined }}>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold" style={{ color: collection.primary_color || undefined }}>
                  {formatNumber(stats.votes)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Votes</div>
              </CardContent>
            </Card>
            <Card style={{ borderColor: collection.primary_color || undefined }}>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold" style={{ color: collection.primary_color || undefined }}>
                  {formatNumber(stats.elections)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Mock Elections</div>
              </CardContent>
            </Card>
            <Card style={{ borderColor: collection.primary_color || undefined }}>
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold" style={{ color: collection.primary_color || undefined }}>
                  {formatNumber(stats.entries)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Entries</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Featured Lifelines */}
        {lifelines && lifelines.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Featured Lifelines</h2>
              <Link
                to="#"
                className="text-sm flex items-center gap-1 hover:underline"
                style={{ color: collection.primary_color || undefined }}
              >
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {lifelines.map((lifeline) => (
                <Link
                  key={lifeline.id}
                  to={`/public/collections/${collection.slug}/lifelines/${lifeline.slug}`}
                  className="group"
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full">
                    <div className="aspect-video relative bg-muted overflow-hidden">
                      {lifeline.cover_image?.url ? (
                        <img
                          src={lifeline.cover_image.url}
                          alt={lifeline.cover_image.alt_text || lifeline.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
          </section>
        )}

        {/* Current Mock Elections */}
        {elections && elections.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-4">Current Mock Elections</h2>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {elections.map((election) => (
                    <Link
                      key={election.id}
                      to={`/public/collections/${collection.slug}/elections/${election.slug}`}
                      className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{election.title}</div>
                        {election.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {election.description}
                          </div>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </CollectionLayout>
  );
}
