import { useQuery, useQueryClient } from "@tanstack/react-query";
import { InlineSvgIcon } from "@/components/InlineSvgIcon";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CollectionLayout } from "@/components/CollectionLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Share2, Rss, Users, Settings } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { CollectionShareModal } from "@/components/CollectionShareModal";
import { JoinCommunityDialog } from "@/components/JoinCommunityDialog";
import { GrowComingSoonDialog } from "@/components/GrowComingSoonDialog";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { PublicAuthModal } from "@/components/PublicAuthModal";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { MobileSectionCarousel } from "@/components/MobileSectionCarousel";
import { FavoriteButton } from "@/components/FavoriteButton";
import { lifelineLink } from "@/lib/navigationLinks";
import { fetchColorScheme } from "@/hooks/useColorScheme";
import { ContentCardImageUpload } from "@/components/ContentCardImageUpload";
import { usePageLayoutWithContent } from "@/hooks/usePageLayout";
import type { PageLayoutItemWithContent } from "@/types/pageLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { ContentTypeBanner } from "@/components/ContentTypeBanner";

// Dynamic icon component for action cards
const DynamicIcon = ({ name, className }: { name: string | null; className?: string }) => {
  if (!name) return null;
  const Icon = (LucideIcons as any)[name];
  if (!Icon) return null;
  return <Icon className={className} />;
};

// Define action card type
interface ActionCardData {
  id: string;
  slug: string;
  name: string;
  icon_name: string | null;
  icon_url: string | null;
  label_override?: string | null;
}

export default function PublicCollectionDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [constructionAlertOpen, setConstructionAlertOpen] = useState(false);
  const [growDialogOpen, setGrowDialogOpen] = useState(false);
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

  // Try new page layout system
  const { 
    layout: pageLayout, 
    items: layoutItems,
    sections: layoutSections,
    unsectionedItems,
    isLoading: layoutLoading, 
    isEmpty: layoutEmpty 
  } = usePageLayoutWithContent('collection', collection?.id);

  // Determine if we should use new layout system
  const useNewLayout = !layoutEmpty && layoutItems.length > 0;

  // Prefetch color scheme as soon as collection data is available
  useEffect(() => {
    if (collection?.id) {
      queryClient.prefetchQuery({
        queryKey: ["color-scheme", collection.id],
        queryFn: () => fetchColorScheme(collection.id),
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    }
  }, [collection?.id, queryClient]);

  // Fetch action cards for this collection (custom or defaults)
  const { data: actionCards } = useQuery({
    queryKey: ["collection-action-cards-display", collection?.id],
    queryFn: async () => {
      if (!collection?.id) return [];

      // First try to get custom cards for this collection
      const { data: customCards, error: customError } = await supabase
        .from("collection_action_cards")
        .select(`
          id,
          label_override,
          action_card:action_cards(id, slug, name, icon_name, icon_url)
        `)
        .eq("collection_id", collection.id)
        .eq("is_enabled", true)
        .order("display_order");

      if (!customError && customCards && customCards.length > 0) {
        // Return custom cards with label overrides
        return customCards.map((cc: any) => ({
          id: cc.action_card.id,
          slug: cc.action_card.slug,
          name: cc.action_card.name,
          icon_name: cc.action_card.icon_name,
          icon_url: cc.action_card.icon_url,
          label_override: cc.label_override,
        })) as ActionCardData[];
      }

      // Fall back to default cards
      const { data: defaultCards, error: defaultError } = await supabase
        .from("action_cards")
        .select("id, slug, name, icon_name, icon_url")
        .eq("is_default", true)
        .eq("status", "active")
        .order("default_order");

      if (defaultError) throw defaultError;
      return (defaultCards || []) as ActionCardData[];
    },
    enabled: !!collection?.id,
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

  // Legacy: Fetch featured items (only if not using new layout)
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
              .select(`
                id, slug, name, short_description, primary_image_url, primary_image_path, status,
                avatar_image:media_assets!avatar_image_id(url, card_position_x, card_position_y, card_scale)
              `)
              .eq("id", item.item_id)
              .eq("status", "published")
              .single();
            return data ? { ...data, _type: "profile" } : null;
          } else if (item.item_type === "book") {
            const { data } = await supabase
              .from("books")
              .select("*")
              .eq("id", item.item_id)
              .eq("status", "published")
              .single();
            return data ? { ...data, _type: "book" } : null;
          }
          return null;
        })
      );

      return items.filter(Boolean);
    },
    enabled: !!collection?.id && !useNewLayout && !layoutLoading,
  });

  // Legacy: Fetch custom section items (only if not using new layout)
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
              .select(`
                id, slug, name, short_description, primary_image_url, primary_image_path, status,
                avatar_image:media_assets!avatar_image_id(url, card_position_x, card_position_y, card_scale)
              `)
              .eq("id", item.item_id)
              .eq("status", "published")
              .single();
            return data ? { ...data, _type: "profile" } : null;
          } else if (item.item_type === "book") {
            const { data } = await supabase
              .from("books")
              .select("*")
              .eq("id", item.item_id)
              .eq("status", "published")
              .single();
            return data ? { ...data, _type: "book" } : null;
          }
          return null;
        })
      );

      return items.filter(Boolean);
    },
    enabled: !!collection?.id && !useNewLayout && !layoutLoading,
  });

  // Fetch lifelines when no featured items exist (legacy fallback)
  const { data: recentLifelines } = useQuery({
    queryKey: ["collection-recent-lifelines", collection?.id],
    enabled: !!collection?.id && !useNewLayout && !layoutLoading && (!featuredItems || featuredItems.length === 0),
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

  // Fetch profiles when no featured items exist (legacy fallback)
  const { data: recentProfiles } = useQuery({
    queryKey: ["collection-recent-profiles", collection?.id],
    enabled: !!collection?.id && !useNewLayout && !layoutLoading && (!featuredItems || featuredItems.length === 0),
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
          avatar_image:media_assets!avatar_image_id(url, card_position_x, card_position_y, card_scale),
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

  // Helper to invalidate content queries after image upload
  const handleImageUploadComplete = () => {
    queryClient.invalidateQueries({ queryKey: ["collection-featured-items", collection?.id] });
    queryClient.invalidateQueries({ queryKey: ["collection-custom-section-items", collection?.id] });
    queryClient.invalidateQueries({ queryKey: ["page-layout-content"] });
  };

  // Handle action card click based on slug
  const handleActionCardClick = (card: ActionCardData) => {
    switch (card.slug) {
      case "feed":
        navigate(`/public/collections/${collection?.slug}/feed`);
        break;
      case "share":
        setShareModalOpen(true);
        break;
      case "members":
        setJoinDialogOpen(true);
        break;
      case "settings":
        navigate(`/public/collections/${collection?.slug}/settings`);
        break;
      case "grow":
        setGrowDialogOpen(true);
        break;
      default:
        // For unimplemented cards, show construction alert
        setConstructionAlertOpen(true);
        break;
    }
  };

  // Render dynamic icon for action card
  const renderActionCardIcon = (card: ActionCardData, className: string) => {
    if (card.icon_url) {
      // Use inline SVG for SVG files to inherit theme color
      if (card.icon_url.endsWith('.svg')) {
        return <InlineSvgIcon url={card.icon_url} className={className} />;
      }
      return <img src={card.icon_url} alt="" className={className} />;
    }
    if (card.icon_name) {
      return <DynamicIcon name={card.icon_name} className={className} />;
    }
    // Fallback icons based on slug
    switch (card.slug) {
      case "feed":
        return <Rss className={className} />;
      case "share":
        return <Share2 className={className} />;
      case "members":
        return <Users className={className} />;
      case "settings":
        return <Settings className={className} />;
      default:
        return null;
    }
  };

  // Get display label for action card
  const getActionCardLabel = (card: ActionCardData): string => {
    // Use label override if set
    if (card.label_override) {
      return card.label_override;
    }
    // Special handling for members to show count
    if (card.slug === "members") {
      return `${memberCount || 0} Members`;
    }
    return card.name;
  };

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

  // Render card from new page layout system
  const renderLayoutCard = (item: PageLayoutItemWithContent) => {
    const { item_type, content } = item;
    
    if (!content) return null;

    // Action cards render differently
    if (item_type === 'action_card' && content.isActionCard) {
      return null; // Action cards handled separately
    }

    // Lifeline cards
    if (item_type === 'lifeline') {
      const lifelinePath = lifelineLink(content.slug || '', {
        collectionSlug: collection.slug,
        from: { type: 'collection' }
      });
      return (
        <Link
          key={item.id}
          to={lifelinePath}
          className="group"
        >
          <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full bg-[hsl(var(--scheme-card-bg))] border-[hsl(var(--scheme-card-border))]">
            <div className="aspect-video relative bg-white overflow-hidden">
              <div className="absolute top-2 right-2 z-10">
                <FavoriteButton itemId={item.item_id} itemType="lifeline" />
              </div>
              {content.image_url ? (
                <img
                  src={content.image_url}
                  alt={content.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No image
                </div>
              )}
            </div>
            <ContentTypeBanner type="lifeline" />
            <CardHeader className="bg-[hsl(var(--scheme-card-bg))]">
              <CardTitle className="text-lg transition-colors text-[hsl(var(--scheme-card-text))]">
                {content.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="bg-[hsl(var(--scheme-card-bg))]">
              <p className="text-sm line-clamp-2 text-[hsl(var(--scheme-cards-text))]">
                {content.subtitle || "Explore this lifeline"}
              </p>
            </CardContent>
          </Card>
        </Link>
      );
    }

    // Profile cards
    if (item_type === 'profile') {
      return (
        <Link
          key={item.id}
          to={`/public/collections/${collection.slug}/profiles/${content.slug}`}
          className="group"
        >
          <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full bg-[hsl(var(--scheme-card-bg))] border-[hsl(var(--scheme-card-border))]">
            <div className="aspect-video relative bg-white overflow-hidden">
              {content.image_url ? (
                <img
                  src={content.image_url}
                  alt={content.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No image
                </div>
              )}
            </div>
            <ContentTypeBanner type="profile" />
            <CardHeader className="bg-[hsl(var(--scheme-card-bg))]">
              <CardTitle className="text-lg transition-colors text-[hsl(var(--scheme-card-text))]">
                {content.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="bg-[hsl(var(--scheme-card-bg))]">
              <p className="text-sm line-clamp-2 text-[hsl(var(--scheme-cards-text))]">
                {content.subtitle || "View this profile"}
              </p>
            </CardContent>
          </Card>
        </Link>
      );
    }

    // Election cards
    if (item_type === 'election') {
      return (
        <Link
          key={item.id}
          to={`/public/collections/${collection.slug}/elections/${content.slug}`}
          className="group"
        >
          <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full bg-[hsl(var(--scheme-card-bg))] border-[hsl(var(--scheme-card-border))]">
            <div className="aspect-video relative bg-white overflow-hidden">
              {content.image_url ? (
                <img
                  src={content.image_url}
                  alt={content.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No image
                </div>
              )}
            </div>
            <ContentTypeBanner type="election" />
            <CardHeader className="bg-[hsl(var(--scheme-card-bg))]">
              <CardTitle className="text-lg transition-colors text-[hsl(var(--scheme-card-text))]">
                {content.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="bg-[hsl(var(--scheme-card-bg))]">
              <p className="text-sm line-clamp-2 text-[hsl(var(--scheme-cards-text))]">
                {content.subtitle || "View the awards"}
              </p>
            </CardContent>
          </Card>
        </Link>
      );
    }

    // Book cards
    if (item_type === 'book') {
      return (
        <Link
          key={item.id}
          to={`/public/collections/${collection.slug}/books/${content.slug}`}
          className="group"
        >
          <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full bg-[hsl(var(--scheme-card-bg))] border-[hsl(var(--scheme-card-border))]">
            <div className="aspect-video relative bg-white overflow-hidden">
              {content.image_url ? (
                <img
                  src={content.image_url}
                  alt={content.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <div className="text-center px-4">
                    <div className="text-4xl mb-2">📚</div>
                    <div className="text-sm font-medium text-gray-600">{content.title}</div>
                  </div>
                </div>
              )}
            </div>
            <ContentTypeBanner type="book" />
            <CardHeader className="bg-[hsl(var(--scheme-card-bg))]">
              <CardTitle className="text-lg transition-colors text-[hsl(var(--scheme-card-text))]">
                {content.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="bg-[hsl(var(--scheme-card-bg))]">
              <p className="text-sm line-clamp-2 text-[hsl(var(--scheme-cards-text))]">
                {content.subtitle}
              </p>
            </CardContent>
          </Card>
        </Link>
      );
    }

    // Custom link cards
    if (item_type === 'custom_link') {
      // Normalize link - ensure internal paths start with /
      let linkPath = content.link || '#';
      if (linkPath !== '#' && !linkPath.startsWith('http') && !linkPath.startsWith('/')) {
        linkPath = '/' + linkPath;
      }
      
      const isExternal = linkPath.startsWith('http');
      const posX = content.image_position_x ?? 50;
      const posY = content.image_position_y ?? 50;
      
      const cardElement = (
        <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full bg-[hsl(var(--scheme-card-bg))] border-[hsl(var(--scheme-card-border))]">
          <div className="aspect-video relative bg-white overflow-hidden">
            {content.image_url ? (
              <img
                src={content.image_url}
                alt={content.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                style={{ objectPosition: `${posX}% ${posY}%` }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <div className="text-center px-4">
                  <div className="text-4xl mb-2">🔗</div>
                  <div className="text-sm font-medium text-gray-600">{content.title}</div>
                </div>
              </div>
            )}
          </div>
          <ContentTypeBanner type="link" />
          <CardHeader className="bg-[hsl(var(--scheme-card-bg))]">
            <CardTitle className="text-lg transition-colors text-[hsl(var(--scheme-card-text))]">
              {content.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-[hsl(var(--scheme-card-bg))]">
            <p className="text-sm line-clamp-2 text-[hsl(var(--scheme-cards-text))]">
              {content.subtitle || "View more"}
            </p>
          </CardContent>
        </Card>
      );

      if (isExternal) {
        return (
          <a
            key={item.id}
            href={linkPath}
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            {cardElement}
          </a>
        );
      }

      return (
        <Link key={item.id} to={linkPath} className="group">
          {cardElement}
        </Link>
      );
    }

    return null;
  };

  // Legacy: Render content card from old system
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
            <div className="aspect-video relative bg-white overflow-hidden">
              <div className="absolute top-2 right-2 z-10">
                <FavoriteButton itemId={item.id} itemType="lifeline" />
              </div>
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
            <ContentTypeBanner type="lifeline" />
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
                <>
                  <img
                    src={item.hero_image_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    style={{
                      objectPosition: `${item.hero_image_position_x ?? 50}% ${item.hero_image_position_y ?? 50}%`
                    }}
                  />
                  {/* Admin can change the image */}
                  <ContentCardImageUpload
                    contentType="election"
                    contentId={item.id}
                    onUploadComplete={handleImageUploadComplete}
                    hasImage={true}
                  />
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 relative">
                  No image
                  <ContentCardImageUpload
                    contentType="election"
                    contentId={item.id}
                    onUploadComplete={handleImageUploadComplete}
                    hasImage={false}
                  />
                </div>
              )}
            </div>
            <ContentTypeBanner type="election" />
            <CardHeader className="bg-[hsl(var(--scheme-card-bg))]">
              <CardTitle className="text-lg transition-colors text-[hsl(var(--scheme-card-text))]">
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="bg-[hsl(var(--scheme-card-bg))]">
              <p className="text-sm line-clamp-2 text-[hsl(var(--scheme-cards-text))]">
                {item.description || "View the awards"}
              </p>
            </CardContent>
          </Card>
        </Link>
      );
    } else if (item._type === "profile") {
      const cardPosX = item.avatar_image?.card_position_x ?? 50;
      const cardPosY = item.avatar_image?.card_position_y ?? 50;
      const cardScale = item.avatar_image?.card_scale ?? 1;
      // Prefer avatar_image.url (media asset) as it has the crop data
      const imageUrl = item.avatar_image?.url ?? item.primary_image_url;
      return (
        <Link
          key={item.id}
          to={`/public/collections/${collectionSlug}/profiles/${item.slug}`}
          className="group"
        >
          <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full bg-[hsl(var(--scheme-card-bg))] border-[hsl(var(--scheme-card-border))]">
            <div className="aspect-video relative bg-white overflow-hidden">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  style={{
                    objectPosition: `${cardPosX}% ${cardPosY}%`,
                    transform: `scale(${cardScale})`,
                    transformOrigin: `${cardPosX}% ${cardPosY}%`
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No image
                </div>
              )}
            </div>
            <ContentTypeBanner type="profile" />
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
    } else if (item._type === "book") {
      return (
        <Link
          key={item.id}
          to={`/public/collections/${collectionSlug}/books/${item.slug}`}
          className="group"
        >
          <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full bg-[hsl(var(--scheme-card-bg))] border-[hsl(var(--scheme-card-border))]">
            <div className="aspect-video relative bg-white overflow-hidden">
              {item.cover_image_url ? (
                <img
                  src={item.cover_image_url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <div className="text-center px-4">
                    <div className="text-4xl mb-2">📚</div>
                    <div className="text-sm font-medium text-gray-600">{item.title}</div>
                  </div>
                </div>
              )}
            </div>
            <ContentTypeBanner type="book" />
            <CardHeader className="bg-[hsl(var(--scheme-card-bg))]">
              <CardTitle className="text-lg transition-colors text-[hsl(var(--scheme-card-text))]">
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="bg-[hsl(var(--scheme-card-bg))]">
              <p className="text-sm line-clamp-2 text-[hsl(var(--scheme-cards-text))]">
                by {item.author_name}
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

        {/* Dynamic Action Cards - Only show if show_action_cards !== false */}
        {collection.show_action_cards !== false && actionCards && actionCards.length > 0 && (
          <div 
            className="grid gap-2 md:gap-4 items-start"
            style={{ gridTemplateColumns: `repeat(${actionCards.length}, minmax(0, 1fr))`, gridAutoRows: 'min-content' }}
          >
            {actionCards.map((card, index) => (
              <Card
                key={card.id}
                className="cursor-pointer hover:shadow-lg transition-shadow self-start"
                style={{
                  backgroundColor: index === 0 ? 'hsl(var(--scheme-actions-bg))' : 'hsl(var(--scheme-ch-actions-bg))',
                  borderColor: index === 0 ? 'hsl(var(--scheme-actions-border))' : 'hsl(var(--scheme-ch-actions-border))'
                }}
                onClick={() => handleActionCardClick(card)}
              >
                <CardContent className="flex flex-col items-center justify-center p-2 md:p-6 gap-1 md:gap-2">
                  {renderActionCardIcon(
                    card,
                    `h-5 w-5 md:h-8 md:w-8`
                  )}
                  <span
                    className="text-[10px] md:text-sm font-medium"
                    style={{ color: index === 0 ? 'hsl(var(--scheme-actions-text))' : 'hsl(var(--scheme-ch-actions-text))' }}
                  >
                    {getActionCardLabel(card)}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Content Section - New unified layout OR Legacy two-section layout */}
        {useNewLayout ? (
          // New unified layout from page_layout_items with sections
          <>
            {/* Render each section with its title */}
            {layoutSections.map(section => {
              const sectionItems = section.items.filter(item => item.content);
              if (sectionItems.length === 0) return null;
              
              // Mobile: use carousel for sections with items
              if (isMobile) {
                return (
                  <MobileSectionCarousel key={section.id} title={section.section_title}>
                    {sectionItems.map(item => renderLayoutCard(item))}
                  </MobileSectionCarousel>
                );
              }
              
              // Desktop: use grid
              const cols = Math.min(section.columns_count ?? 3, 4);
              return (
                <section key={section.id} className="space-y-4">
                  {section.section_title && (
                    <h2 className="text-2xl font-bold text-[hsl(var(--scheme-title-text))]">
                      {section.section_title}
                    </h2>
                  )}
                  <div 
                    className="grid gap-6 items-start" 
                    style={{ 
                      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` 
                    }}
                  >
                    {sectionItems.map(renderLayoutCard)}
                  </div>
                </section>
              );
            })}
            
            {/* Unsectioned items fallback */}
            {unsectionedItems.length > 0 && (
              <section className="space-y-4">
                {layoutSections.length === 0 && (
                  <h2 className="text-2xl font-bold text-[hsl(var(--scheme-title-text))]">
                    {collection.custom_section_name || "Explore"}
                  </h2>
                )}
                {isMobile ? (
                  <MobileSectionCarousel title={null}>
                    {unsectionedItems.filter(item => item.content).map(item => renderLayoutCard(item))}
                  </MobileSectionCarousel>
                ) : (
                  <div className="grid gap-6 items-start grid-cols-2 lg:grid-cols-3">
                    {unsectionedItems.filter(item => item.content).map(renderLayoutCard)}
                  </div>
                )}
              </section>
            )}
          </>
        ) : (
          // Legacy system with Featured + Custom Section
          <>
            {/* Featured Content */}
            {featuredItems && featuredItems.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-[hsl(var(--scheme-title-text))]">Featured</h2>
                </div>
                {featuredItems.length <= 3 ? (
                  <div className="grid gap-6 items-start grid-cols-2 lg:grid-cols-3">
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
                  <div className="grid gap-6 items-start grid-cols-2 lg:grid-cols-3">
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
                    <div className="grid gap-6 items-start grid-cols-2 lg:grid-cols-3">
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
                            <Card className="overflow-hidden hover:shadow-lg transition-shadow bg-[hsl(var(--scheme-card-bg))] border-[hsl(var(--scheme-card-border))]">
                              <div className="aspect-video relative bg-white overflow-hidden">
                                <div className="absolute top-2 right-2 z-10">
                                  <FavoriteButton itemId={lifeline.id} itemType="lifeline" />
                                </div>
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
                              <ContentTypeBanner type="lifeline" />
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
                    <div className="grid gap-6 items-start grid-cols-2 lg:grid-cols-3">
                      {recentProfiles.map((profile: any) => {
                        const cardPosX = profile.avatar_image?.card_position_x ?? 50;
                        const cardPosY = profile.avatar_image?.card_position_y ?? 50;
                        const cardScale = profile.avatar_image?.card_scale ?? 1;
                        const imageUrl = profile.avatar_image?.url ?? profile.primary_image_url;

                        return (
                          <Link
                            key={profile.id}
                            to={`/public/collections/${collection.slug}/profiles/${profile.slug}`}
                            className="group"
                          >
                            <Card className="overflow-hidden hover:shadow-lg transition-shadow bg-[hsl(var(--scheme-card-bg))] border-[hsl(var(--scheme-card-border))]">
                              <div className="aspect-video relative bg-white overflow-hidden">
                                {imageUrl ? (
                                  <img
                                    src={imageUrl}
                                    alt={profile.name}
                                    className="w-full h-full object-cover"
                                    style={{
                                      objectPosition: `${cardPosX}% ${cardPosY}%`,
                                      transform: `scale(${cardScale})`,
                                      transformOrigin: `${cardPosX}% ${cardPosY}%`
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    No image
                                  </div>
                                )}
                              </div>
                              <ContentTypeBanner type="profile" />
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
                        );
                      })}
                    </div>
                  </section>
                )}
              </>
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

      <GrowComingSoonDialog
        open={growDialogOpen}
        onOpenChange={setGrowDialogOpen}
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
