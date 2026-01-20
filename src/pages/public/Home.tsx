import { ContentTypeBanner } from "@/components/ContentTypeBanner";
import { StandardizedContentCard } from "@/components/StandardizedContentCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Rss, Share2, Settings } from "lucide-react";
import { GrowIcon } from "@/components/icons/GrowIcon";
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

export default function Home() {
  const navigate = useNavigate();
  const [growDialogOpen, setGrowDialogOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [constructionAlertOpen, setConstructionAlertOpen] = useState(false);
  
  // Try new page layout system first
  const { layout, items: layoutItems, isLoading: layoutLoading, isEmpty: layoutEmpty } = usePageLayoutWithContent('home');
  
  // Fallback to old system if no layout exists
  const { settings: homeSettings, featuredItems, newContentItems, isLoading: oldLoading } = useHomePageData();
  
  // Determine which system to use
  const useNewLayout = !layoutEmpty && layoutItems.length > 0;
  const isLoading = useNewLayout ? layoutLoading : oldLoading;

  const quickActionCards = [
    { icon: Rss, label: "Feed", onClick: () => navigate('/feed'), isCustomIcon: false },
    { icon: GrowIcon, label: "Grow", onClick: () => setGrowDialogOpen(true), isCustomIcon: true },
    { icon: Share2, label: "Share", onClick: () => setShareModalOpen(true), isCustomIcon: false },
    { icon: Settings, label: "Settings", onClick: () => setConstructionAlertOpen(true), isCustomIcon: false },
  ];

  // Unified loading state - show skeleton for entire page
  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Hero skeleton */}
        <Skeleton className="w-full aspect-[4/1] rounded-lg" />
        
        {/* Quick actions skeleton */}
        <div className="grid grid-cols-4 gap-2 md:gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 md:h-28" />
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
          <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full bg-[hsl(var(--scheme-card-bg))] border-[hsl(var(--scheme-card-border))]">
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

  // Render legacy card (from old system)
  const renderLegacyCard = (item: any) => {
    if (item.type === "lifeline") {
      return (
        <Link
          key={item.id}
          to={`/public/lifelines/${item.slug}`}
          className="group relative"
        >
          <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full bg-[hsl(var(--scheme-card-bg))] border-[hsl(var(--scheme-card-border))]">
            <div className="aspect-video relative overflow-hidden bg-white">
              {item.cover_image?.url || item.cover_image_url ? (
                <img
                  src={item.cover_image?.url || item.cover_image_url}
                  alt={item.cover_image?.alt_text || item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  style={{
                    objectPosition: `${item.cover_image_position_x ?? 50}% ${item.cover_image_position_y ?? 50}%`,
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
                {item.intro || "Explore this lifeline"}
              </p>
            </CardContent>
          </Card>
        </Link>
      );
    }

    return (
      <StandardizedContentCard
        key={item.id}
        id={item.id}
        title={item.title}
        description={item.description}
        imageUrl={
          item.type === "collection" 
            ? (item.card_image_url || item.hero_image?.url || item.hero_image_url)
            : item.type === "election"
            ? item.hero_image_url
            : null
        }
        imageAlt={item.type === "collection" ? item.hero_image?.alt_text : item.title}
        linkPath={
          item.type === "collection"
            ? `/public/collections/${item.slug}`
            : `/public/elections/${item.slug}`
        }
        type={item.type}
        collectionSlug={item.type === "collection" ? item.slug : undefined}
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
      <div className="grid grid-cols-4 gap-2 md:gap-4">
        {quickActionCards.map((action) => {
          const Icon = action.icon;
          return (
            <Card 
              key={action.label}
              className="hover:shadow-md transition-shadow cursor-pointer h-full bg-[hsl(var(--scheme-actions-bg))] border-[hsl(var(--scheme-actions-border))]"
              onClick={action.onClick}
            >
              <CardContent className="flex flex-col items-center justify-center p-3 md:p-6 gap-1 md:gap-2">
                {action.isCustomIcon ? (
                  <Icon className="h-5 w-5 md:h-8 md:w-8 text-[hsl(var(--scheme-actions-icon))]" />
                ) : (
                  <Icon className="h-5 w-5 md:h-8 md:w-8 text-[hsl(var(--scheme-actions-icon))]" />
                )}
                <span className="text-[10px] md:text-sm font-medium text-[hsl(var(--scheme-actions-text))]">{action.label}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
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

      {/* Content Section - Uses new Page Layout system with fallback to old */}
      {useNewLayout ? (
        // New unified layout system
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold" style={{ color: 'hsl(var(--scheme-title-text))' }}>
              {homeSettings?.custom_section_name || 'Explore'}
            </h2>
            <Link to="/public/collections" className="hover:underline text-sm" style={{ color: 'hsl(var(--scheme-actions-icon))' }}>
              View All
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {layoutItems.filter(item => item.content).map(renderLayoutCard)}
          </div>
        </section>
      ) : (
        // Legacy two-section layout
        <>
          {/* Featured Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold" style={{ color: 'hsl(var(--scheme-title-text))' }}>Featured</h2>
              <Link to="/public/collections" className="hover:underline text-sm" style={{ color: 'hsl(var(--scheme-actions-icon))' }}>
                View All
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredItems.map(renderLegacyCard)}
            </div>
          </section>

          {/* New Content Section - cards only, no header in legacy mode */}
          {newContentItems.length > 0 && (
            <section>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {newContentItems.map(renderLegacyCard)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
