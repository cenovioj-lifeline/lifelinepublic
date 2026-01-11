import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CollectionLayout } from "@/components/CollectionLayout";
import { StandardizedContentCard } from "@/components/StandardizedContentCard";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function CollectionFeed() {
  const { slug } = useParams<{ slug: string }>();

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

  // Check if collection has custom featured items
  const { data: hasFeaturedItems } = useQuery({
    queryKey: ["collection-has-featured", collection?.id],
    enabled: !!collection?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collection_featured_items")
        .select("id")
        .eq("collection_id", collection!.id)
        .limit(1);

      if (error) throw error;
      return data && data.length > 0;
    },
  });

  // Fetch lifelines for this collection
  const { data: lifelines } = useQuery({
    queryKey: ["collection-lifelines", collection?.id],
    enabled: !!collection?.id && !hasFeaturedItems,
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
          created_at,
          cover_image:media_assets!lifelines_cover_image_id_fkey(url, position_x, position_y)
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

  // Fetch profiles for this collection
  const { data: profiles } = useQuery({
    queryKey: ["collection-profiles", collection?.id],
    enabled: !!collection?.id && !hasFeaturedItems,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          name,
          slug,
          short_description,
          avatar_image_id,
          created_at,
          avatar_image:media_assets!profiles_avatar_image_id_fkey(url, position_x, position_y, card_position_x, card_position_y, card_scale),
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

  if (!collection) {
    return (
      <CollectionLayout collectionTitle="Loading..." collectionSlug={slug || ""}>
        <div>Loading...</div>
      </CollectionLayout>
    );
  }

  // If custom featured items exist, show those instead (future implementation)
  if (hasFeaturedItems) {
    return (
      <CollectionLayout
        collectionTitle={collection.title}
        collectionSlug={collection.slug}
        collectionId={collection.id}
      >
        <div className="text-center py-12">
          <p className="text-muted-foreground">Custom featured content configured</p>
        </div>
      </CollectionLayout>
    );
  }

  return (
    <CollectionLayout
      collectionTitle={collection.title}
      collectionSlug={collection.slug}
      collectionId={collection.id}
    >
      <div className="space-y-12">
        {/* Lifelines Section */}
        {lifelines && lifelines.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Lifelines</h2>
              <Link to={`/public/collections/${collection.slug}/lifelines`}>
                <Button variant="ghost" className="gap-2">
                  View All <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lifelines.map((lifeline: any) => (
                <StandardizedContentCard
                  key={lifeline.id}
                  id={lifeline.id}
                  title={lifeline.title}
                  description={lifeline.subtitle || ""}
                  imageUrl={lifeline.cover_image?.url}
                  linkPath={`/public/collections/${collection.slug}/lifelines/${lifeline.slug}`}
                  type="lifeline"
                />
              ))}
            </div>
          </div>
        )}

        {/* Profiles Section */}
        {profiles && profiles.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">People</h2>
              <Link to={`/public/collections/${collection.slug}/profiles`}>
                <Button variant="ghost" className="gap-2">
                  View All <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profiles.map((profile: any) => (
                <StandardizedContentCard
                  key={profile.id}
                  id={profile.id}
                  title={profile.name}
                  description={profile.short_description || ""}
                  imageUrl={profile.avatar_image?.url}
                  imagePositionX={profile.avatar_image?.card_position_x}
                  imagePositionY={profile.avatar_image?.card_position_y}
                  imageScale={profile.avatar_image?.card_scale}
                  linkPath={`/public/collections/${collection.slug}/profiles/${profile.slug}`}
                  type="profile"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </CollectionLayout>
  );
}
