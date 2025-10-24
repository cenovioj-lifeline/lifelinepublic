import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StandardizedContentCard } from "@/components/StandardizedContentCard";
import { Card, CardContent } from "@/components/ui/card";
import { Rss, FileQuestion, Share2, Settings } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useNavigate } from "react-router-dom";
import { RequestLifelineDialog } from "@/components/RequestLifelineDialog";
import { useState } from "react";

export default function Home() {
  const navigate = useNavigate();
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  
  const { data: homeSettings } = useQuery({
    queryKey: ["home-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_page_settings")
        .select(`
          *,
          hero_image:media_assets(url, alt_text)
        `)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: featuredItems, isLoading: loadingFeatured } = useQuery({
    queryKey: ["home-featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_page_featured_items")
        .select("*")
        .order("order_index");

      if (error) throw error;

      // Fetch actual content for each item
      const items = await Promise.all(
        data.map(async (item) => {
          if (item.item_type === "collection") {
            const { data: collection } = await supabase
              .from("collections")
              .select(`
                id,
                title,
                slug,
                description,
                card_image_position_x,
                card_image_position_y,
                hero_image:media_assets!collections_hero_image_id_fkey(url, alt_text)
              `)
              .eq("id", item.item_id)
              .eq("status", "published")
              .single();
            return collection ? { ...collection, type: "collection" as const } : null;
          } else if (item.item_type === "lifeline") {
            const { data: lifeline } = await supabase
              .from("lifelines")
              .select(`
                id,
                title,
                slug,
                intro,
                cover_image_position_x,
                cover_image_position_y,
                cover_image:media_assets!lifelines_cover_image_id_fkey(url, alt_text)
              `)
              .eq("id", item.item_id)
              .eq("status", "published")
              .single();
            return lifeline ? { ...lifeline, type: "lifeline" as const } : null;
          } else if (item.item_type === "election") {
            const { data: election } = await supabase
              .from("mock_elections")
              .select("id, title, slug, description")
              .eq("id", item.item_id)
              .eq("status", "published")
              .single();
            return election ? { ...election, type: "election" as const } : null;
          }
          return null;
        })
      );

      return items.filter((item) => item !== null);
    },
  });

  const { data: newContentItems, isLoading: loadingNew } = useQuery({
    queryKey: ["home-new-content"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_page_new_content_items")
        .select("*")
        .order("order_index");

      if (error) throw error;

      const items = await Promise.all(
        data.map(async (item) => {
          if (item.item_type === "collection") {
            const { data: collection } = await supabase
              .from("collections")
              .select(`
                id,
                title,
                slug,
                description,
                card_image_position_x,
                card_image_position_y,
                hero_image:media_assets!collections_hero_image_id_fkey(url, alt_text)
              `)
              .eq("id", item.item_id)
              .eq("status", "published")
              .single();
            return collection ? { ...collection, type: "collection" as const } : null;
          } else if (item.item_type === "lifeline") {
            const { data: lifeline } = await supabase
              .from("lifelines")
              .select(`
                id,
                title,
                slug,
                intro,
                cover_image_position_x,
                cover_image_position_y,
                cover_image:media_assets!lifelines_cover_image_id_fkey(url, alt_text)
              `)
              .eq("id", item.item_id)
              .eq("status", "published")
              .single();
            return lifeline ? { ...lifeline, type: "lifeline" as const } : null;
          } else if (item.item_type === "election") {
            const { data: election } = await supabase
              .from("mock_elections")
              .select("id, title, slug, description")
              .eq("id", item.item_id)
              .eq("status", "published")
              .single();
            return election ? { ...election, type: "election" as const } : null;
          }
          return null;
        })
      );

      return items.filter((item) => item !== null);
    },
  });

  const quickActionCards = [
    { icon: Rss, label: "Feed", path: "/public/feed" },
    { icon: FileQuestion, label: "Request", onClick: () => setRequestDialogOpen(true) },
    { icon: Share2, label: "Share", path: "/public/share" },
    { icon: Settings, label: "Settings", path: "/public/settings" },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div
        className="relative w-full rounded-lg overflow-hidden aspect-[4/1]"
      >
        {homeSettings?.hero_image?.url ? (
          <img
            src={homeSettings.hero_image.url}
            alt={homeSettings.hero_image.alt_text || "Hero"}
            className="w-full h-full object-cover"
            style={{
              objectPosition: `${homeSettings.hero_image_position_x || 50}% ${homeSettings.hero_image_position_y || 50}%`,
            }}
          />
        ) : (
          <div className="w-full h-full bg-[#1e3a5f] flex items-center justify-center text-white">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-2">
                {homeSettings?.hero_title || "Welcome to Lifeline Public"}
              </h1>
              <p className="text-xl">
                {homeSettings?.hero_subtitle || "Explore stories, profiles, and collections"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActionCards.map((action) => {
          const Icon = action.icon;
          
          if (action.onClick) {
            return (
              <Card
                key={action.label}
                className="hover:shadow-md transition-shadow cursor-pointer h-full"
                onClick={action.onClick}
              >
                <CardContent className="flex flex-col items-center justify-center p-6 gap-2">
                  <Icon className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm font-medium">{action.label}</span>
                </CardContent>
              </Card>
            );
          }
          
          return (
            <Link key={action.label} to={action.path!}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="flex flex-col items-center justify-center p-6 gap-2">
                  <Icon className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm font-medium">{action.label}</span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
      
      <RequestLifelineDialog
        open={requestDialogOpen}
        onOpenChange={setRequestDialogOpen}
        onSignInRequired={() => {
          setRequestDialogOpen(false);
          navigate("/auth");
        }}
      />

      {/* Featured Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Featured</h2>
          <Link to="/public/collections" className="text-primary hover:underline text-sm">
            View All
          </Link>
        </div>
        {loadingFeatured ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredItems?.map((item: any) => (
              <StandardizedContentCard
                key={item.id}
                id={item.id}
                title={item.title}
                description={item.description || item.intro}
                imageUrl={item.hero_image?.url || item.cover_image?.url}
                imageAlt={item.hero_image?.alt_text || item.cover_image?.alt_text}
                imagePositionX={item.card_image_position_x ?? item.cover_image_position_x ?? 50}
                imagePositionY={item.card_image_position_y ?? item.cover_image_position_y ?? 50}
                linkPath={
                  item.type === "collection"
                    ? `/public/collections/${item.slug}`
                    : item.type === "lifeline"
                    ? `/public/lifelines/${item.slug}`
                    : `/public/elections/${item.slug}`
                }
                type={item.type}
              />
            ))}
          </div>
        )}
      </section>

      {/* New Content Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">New Content</h2>
          <Link to="/public/lifelines" className="text-primary hover:underline text-sm">
            View All
          </Link>
        </div>
        {loadingNew ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {newContentItems?.map((item: any) => (
              <StandardizedContentCard
                key={item.id}
                id={item.id}
                title={item.title}
                description={item.description || item.intro}
                imageUrl={item.hero_image?.url || item.cover_image?.url}
                imageAlt={item.hero_image?.alt_text || item.cover_image?.alt_text}
                imagePositionX={item.card_image_position_x ?? item.cover_image_position_x ?? 50}
                imagePositionY={item.card_image_position_y ?? item.cover_image_position_y ?? 50}
                linkPath={
                  item.type === "collection"
                    ? `/public/collections/${item.slug}`
                    : item.type === "lifeline"
                    ? `/public/lifelines/${item.slug}`
                    : `/public/elections/${item.slug}`
                }
                type={item.type}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}