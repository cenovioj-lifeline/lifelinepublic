import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { MobileCategory } from "@/utils/electionDataAdapter";

interface CategoryPillsProps {
  categories: MobileCategory[];
  activeCategory: string | null;
  onCategoryClick: (categoryId: string) => void;
}

export const CategoryPills = ({ categories, activeCategory, onCategoryClick }: CategoryPillsProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activePillRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activePillRef.current && scrollRef.current) {
      activePillRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeCategory]);

  return (
    <div className="sticky top-[60px] z-40 bg-background border-b border-border py-2">
      <div 
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide px-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories.map((category) => {
          const isActive = activeCategory === category.id;
          return (
            <button
              key={category.id}
              ref={isActive ? activePillRef : undefined}
              onClick={() => onCategoryClick(category.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-full whitespace-nowrap",
                "text-sm font-medium transition-colors duration-200",
                "focus:outline-none focus:ring-2 focus:ring-primary/20",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-background border border-border text-muted-foreground hover:border-primary/50"
              )}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
              <span className={cn(
                "text-xs",
                isActive ? "opacity-80" : "opacity-60"
              )}>
                ({category.superlatives.length})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
