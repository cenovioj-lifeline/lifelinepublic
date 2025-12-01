import { cn } from "@/lib/utils";

interface EntryContentProps {
  date: string;
  description: string;
  rating: number;
}

export const EntryContent = ({ date, description, rating }: EntryContentProps) => {
  const isPositive = rating >= 0;
  
  return (
    <div className="px-4 pt-3 pb-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <span>{date || "No date"}</span>
        <span>•</span>
        <span className={cn(
          "font-semibold",
          isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
        )}>
          {rating > 0 ? '+' : ''}{rating}
        </span>
      </div>
      
      <div className="prose prose-sm max-w-none text-foreground">
        {description.split('\n').map((paragraph, i) => (
          paragraph.trim() && <p key={i} className="mb-4 last:mb-0">{paragraph}</p>
        ))}
      </div>
    </div>
  );
};
