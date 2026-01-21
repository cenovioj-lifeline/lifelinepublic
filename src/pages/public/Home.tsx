import { ContentTypeBanner } from "@/components/ContentTypeBanner";
import { InlineSvgIcon } from "@/components/InlineSvgIcon";
import { StandardizedContentCard } from "@/components/StandardizedContentCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useNavigate } from "react-router-dom";
import { GrowComingSoonDialog } from "@/components/GrowComingSoonDialog";
import { CollectionShareModal } from "@/components/CollectionShareModal";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useHomePageData } from "@/hooks/useHomePageData";
import { usePageLayoutWithContent } from "@/hooks/usePageLayout";
import type { PageLayoutItemWithContent } from "@/types/pageLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import * as LucideIcons from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ActionCardData {
  id: string;
  slug: string;
  name: string;
  icon_name: string | null;
  icon_url: string | null;
  label_override?: string | null;
}

const DynamicIcon = ({ name, className }: { name: string | null; className?: string }) => {
  if (!name) return null;
  const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  const IconComponent = icons[name];
  if (!IconComponent) return null;
  return <IconComponent className={className} />;
};

export default function Home() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [growDialogOpen, setGrowDialogOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [constructionAlertOpen, setConstructionAlertOpen] = useState(false);
  
  // Fetch action cards from database
  const { data: actionCards, isLoading: actionCardsLoading } = useQuery({
    queryKey: ["home-action-cards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("action_cards")
        .select("id, slug, name, icon_name, icon_url")
        .eq("is_default", true)
        .eq("status", "active")
        .order("default_order");
      if (error) throw error;
      return data as ActionCardData[];
    },
  });
  
  // Try new page layout system first
  const { 
    layout, 
    items: layoutItems, 
    sections: layoutSections,
    unsectionedItems,
    isLoading: layoutLoading, 
    isEmpty: layoutEmpty 
  } = usePageLayoutWithContent('home');
  
  // Only fetch old data if we need it for settings (hero image) - not for content
  const { settings: homeSettings, isLoading: settingsLoading } = useHomePageData();
  
  // Page layout is the only source of content - no legacy fallback
  const isLoading = layoutLoading || settingsLoading || actionCardsLoading;

  const handleActionCardClick = (card: ActionCardData) => {
    switch (card.slug) {
      case 'feed':
        navigate('/feed');
        break;
      case 'share':
        setShareModalOpen(true);
        break;
      case 'grow':
        setGrowDialogOpen(true);
        break;
      case 'settings':
        setConstructionAlertOpen(true);
        break;
      default:
        // For other action cards, show under construction
        setConstructionAlertOpen(true);
    }
  };

  const renderActionCardIcon = (card: ActionCardData, className: string) => {
    if (card.icon_url) {
      // Use inline SVG for SVG files to inherit theme color
      if (card.icon_url.endsWith('.svg')) {
        return <InlineSvgIcon url={card.icon_url} className={className} />;
      }
      return <img src={card.icon_url} alt={card.name} className={className} />;
    }
    return <DynamicIcon name={card.icon_name} className={className} />;
  };

  // Unified loading state - show skeleton for entire page
  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Hero skeleton */}
        <Skeleton className="w-full aspect-[4/1] rounded-lg" />
        
        {/* Quick actions skeleton */}
        <div 
          className="grid gap-2 md:gap-4 items-start"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))' }}
        >
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-16 md:h-24" />
          ))}
        </div>
        
        {/* Content section skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-8 w-32" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-80" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Render card based on layout item type
  const renderLayoutCard = (item: PageLayoutItemWithContent) => {
    const { item_type, content } = item;
    
    if (!content) return null;

    // Action cards render as quick actions style
    if (item_type === 'action_card' && content.isActionCard) {
      return null; // Action cards are handled separately in quick actions
    }

    // Lifeline cards
    if (item_type === 'lifeline') {
      return (
        <Link
          key={item.id}
          to={content.link || `/public/lifelines/${content.slug}`}
          className="group relative"
        >
          <Card className="overflow-hidden hover:shadow-lg transition-shadow bg-[hsl(var(--scheme-card-bg))] border-[hsl(var(--scheme-card-border))]">
            <div className="aspect-video relative overflow-hidden bg-white">
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

    // Collection, profile, election, book cards
    return (
      <StandardizedContentCard
        key={item.id}
        id={item.item_id}
        title={content.title}
        description={content.subtitle}
        imageUrl={content.image_url}
        imageAlt={content.title}
        linkPath={content.link || '#'}
        type={item_type as 'collection' | 'profile' | 'election' | 'book'}
        collectionSlug={item_type === 'collection' ? content.slug : undefined}
      />
    );
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative w-full rounded-lg overflow-hidden aspect-[4/1]">
        {(homeSettings?.hero_image_url || homeSettings?.hero_image?.url) ? (
          <img
            src={homeSettings.hero_image_url || homeSettings.hero_image?.url}
            alt={homeSettings.hero_image?.alt_text || "Hero"}
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
      {actionCards && actionCards.length > 0 && (
        <div 
          className="grid gap-2 md:gap-4 items-start"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gridAutoRows: 'min-content' }}
        >
          {actionCards.map((card) => (
            <Card 
              key={card.id}
              className="hover:shadow-md transition-shadow cursor-pointer bg-[hsl(var(--scheme-actions-bg))] border-[hsl(var(--scheme-actions-border))] self-start"
              onClick={() => handleActionCardClick(card)}
            >
              <CardContent className="flex flex-col items-center justify-center p-2 md:p-6 gap-1 md:gap-2">
                {renderActionCardIcon(card, "h-5 w-5 md:h-8 md:w-8 text-[hsl(var(--scheme-actions-icon))]")}
                <span className="text-[10px] md:text-sm font-medium text-[hsl(var(--scheme-actions-text))]">
                  {card.label_override || card.name}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <GrowComingSoonDialog
        open={growDialogOpen}
        onOpenChange={setGrowDialogOpen}
      />

      <CollectionShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        shareUrl={`${window.location.origin}/public`}
        shareTitle="Lifeline Public"
        shareDescription="Explore interactive timelines, collections, and more"
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

      {/* Content Section - Uses Page Layout sections only */}
      {layoutSections.map(section => {
        const cols = isMobile ? Math.min(section.columns_count ?? 3, 2) : Math.min(section.columns_count ?? 3, 4);
        return section.items.length > 0 && (
          <section key={section.id} className="space-y-4">
            {section.section_title && (
              <h2 className="text-2xl font-semibold" style={{ color: 'hsl(var(--scheme-title-text))' }}>
                {section.section_title}
              </h2>
            )}
            <div 
              className="grid gap-6 items-start" 
              style={{ 
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` 
              }}
            >
              {section.items.filter(item => item.content).map(renderLayoutCard)}
            </div>
          </section>
        );
      })}
      
      {/* Unsectioned items */}
      {unsectionedItems.length > 0 && (
        <section className="space-y-4">
          {layoutSections.length === 0 && (
            <h2 className="text-2xl font-semibold" style={{ color: 'hsl(var(--scheme-title-text))' }}>
              {homeSettings?.custom_section_name || 'Explore'}
            </h2>
          )}
          <div className="grid gap-6 items-start grid-cols-2 lg:grid-cols-3">
            {unsectionedItems.filter(item => item.content).map(renderLayoutCard)}
          </div>
        </section>
      )}
    </div>
  );
}
