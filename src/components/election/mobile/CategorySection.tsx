import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileCategory, MobileSuperlative } from "@/utils/electionDataAdapter";
import { GridCard } from "./GridCard";

interface CategorySectionProps {
  category: MobileCategory;
  defaultExpanded: boolean;
  onCardClick: (superlative: MobileSuperlative) => void;
}

export const CategorySection = ({ category, defaultExpanded, onCardClick }: CategorySectionProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <section id={category.id} className="mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3",
          "bg-muted/50 hover:bg-muted transition-colors",
          "focus:outline-hidden focus:ring-2 focus:ring-primary/20"
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">{category.icon}</span>
          <h2 className="text-lg font-bold text-foreground">{category.name}</h2>
          <span className="text-sm text-muted-foreground">({category.superlatives.length})</span>
        </div>
        <ChevronDown 
          className={cn(
            "h-5 w-5 text-muted-foreground transition-transform duration-300",
            isExpanded && "rotate-180"
          )}
        />
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          isExpanded ? "max-h-[10000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="grid grid-cols-2 gap-3 p-4">
          {category.superlatives.map((superlative) => (
            <GridCard
              key={superlative.id}
              superlative={superlative}
              onClick={() => onCardClick(superlative)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
