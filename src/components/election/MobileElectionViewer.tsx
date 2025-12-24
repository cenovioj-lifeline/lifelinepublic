import { useState, useEffect } from "react";
import { transformElectionResults } from "@/utils/electionDataAdapter";
import { useMobileElectionNavigation } from "@/hooks/useMobileElectionNavigation";
import { CategoryPills } from "./mobile/CategoryPills";
import { CategorySection } from "./mobile/CategorySection";
import { DetailSheet } from "./mobile/DetailSheet";
import { FloatingBackButton } from "@/components/FloatingBackButton";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface MobileElectionViewerProps {
  electionId: string;
  election: any;
  results: any[];
  categoryOrdering: Record<string, number>;
  collectionSlug?: string;
}

export const MobileElectionViewer = ({ 
  electionId, 
  election, 
  results, 
  categoryOrdering,
  collectionSlug 
}: MobileElectionViewerProps) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

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

  if (!election || !results) {
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

      {/* Floating back button */}
      <FloatingBackButton />
    </div>
  );
};
