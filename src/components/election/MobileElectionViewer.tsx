import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { transformElectionResults } from "@/utils/electionDataAdapter";
import { useMobileElectionNavigation } from "@/hooks/useMobileElectionNavigation";
import { CategoryPills } from "./mobile/CategoryPills";
import { CategorySection } from "./mobile/CategorySection";
import { DetailSheet } from "./mobile/DetailSheet";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface MobileElectionViewerProps {
  electionId: string;
  collectionSlug?: string;
}

export const MobileElectionViewer = ({ electionId, collectionSlug }: MobileElectionViewerProps) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const { data: election, isLoading: electionLoading } = useQuery({
    queryKey: ['election', electionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mock_elections')
        .select('*')
        .eq('id', electionId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!electionId && electionId.length > 0,
  });

  const { data: results, isLoading: resultsLoading } = useQuery({
    queryKey: ['election-results', electionId],
    queryFn: async () => {
      const { data: resultsData, error: resultsError } = await supabase
        .from('election_results')
        .select('*')
        .eq('election_id', electionId)
        .order('order_index', { ascending: true });

      if (resultsError) throw resultsError;
      if (!resultsData) return [];

      const profileIds = resultsData
        .filter(r => r.winner_profile_ids && r.winner_profile_ids.length > 0)
        .flatMap(r => r.winner_profile_ids);

      let profilesMap: Record<string, any> = {};
      if (profileIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name, slug, avatar_image_id')
          .in('id', profileIds);

        if (profilesData) {
          const avatarIds = profilesData
            .filter(p => p.avatar_image_id)
            .map(p => p.avatar_image_id);

          let avatarsMap: Record<string, any> = {};
          if (avatarIds.length > 0) {
            const { data: avatarsData } = await supabase
              .from('media_assets')
              .select('id, url')
              .in('id', avatarIds);

            if (avatarsData) {
              avatarsMap = avatarsData.reduce((acc, avatar) => {
                acc[avatar.id] = avatar;
                return acc;
              }, {} as Record<string, any>);
            }
          }

          profilesMap = profilesData.reduce((acc, profile) => {
            acc[profile.id] = {
              ...profile,
              avatar: profile.avatar_image_id ? avatarsMap[profile.avatar_image_id] : null
            };
            return acc;
          }, {} as Record<string, any>);
        }
      }

      return resultsData.map(result => ({
        ...result,
        profiles: result.winner_profile_ids?.map((id: string) => profilesMap[id]).filter(Boolean) || []
      }));
    },
    enabled: !!electionId && electionId.length > 0,
  });

  // Fetch category ordering
  const { data: categoryOrdering = {}, isLoading: orderingLoading } = useQuery<Record<string, number>>({
    queryKey: ['election-category-order'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('election_category_order')
        .select('category, display_order');
      
      if (error) throw error;
      if (!data) return {};
      
      const orderMap: Record<string, number> = {};
      data.forEach((item: any) => {
        orderMap[item.category] = item.display_order;
      });
      return orderMap;
    },
  });

  const categories = results ? transformElectionResults(results, categoryOrdering) : [];
  
  const {
    currentItem,
    isDetailOpen,
    openDetail,
    closeDetail,
    navigateDetail,
    canNavigate,
  } = useMobileElectionNavigation(categories);

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].id);
    }
  }, [categories, activeCategory]);

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    const element = document.getElementById(categoryId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const shouldShowReadMore = election?.description && election.description.length > 120;

  if (electionLoading || resultsLoading || orderingLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Skeleton className="h-8 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[240px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border p-4">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {election?.title}
        </h1>
        {election?.description && (
          <div>
            <p className={cn(
              "text-sm text-muted-foreground leading-relaxed transition-all duration-300",
              !isDescriptionExpanded && "line-clamp-2"
            )}>
              {election.description}
            </p>
            {shouldShowReadMore && (
              <button
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                className="text-sm text-primary hover:underline mt-1"
              >
                {isDescriptionExpanded ? "Read less" : "Read more"}
              </button>
            )}
          </div>
        )}
      </header>

      {/* Category Pills */}
      <CategoryPills
        categories={categories}
        activeCategory={activeCategory}
        onCategoryClick={handleCategoryClick}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {categories.map((category, index) => (
          <CategorySection
            key={category.id}
            category={category}
            defaultExpanded={index < 2}
            onCardClick={openDetail}
          />
        ))}
      </div>

      {/* Detail Sheet */}
      <DetailSheet
        item={currentItem}
        isOpen={isDetailOpen}
        onClose={closeDetail}
        onNavigate={navigateDetail}
        canNavigatePrev={canNavigate('prev')}
        canNavigateNext={canNavigate('next')}
        collectionSlug={collectionSlug}
      />
    </div>
  );
};
