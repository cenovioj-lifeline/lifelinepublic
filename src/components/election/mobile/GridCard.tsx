import { cn } from "@/lib/utils";
import { MobileSuperlative } from "@/utils/electionDataAdapter";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface GridCardProps {
  superlative: MobileSuperlative;
  onClick: () => void;
}

export const GridCard = ({ superlative, onClick }: GridCardProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 p-3 rounded-lg",
        "bg-card border border-border",
        "transition-transform duration-200 active:scale-97",
        "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/20"
      )}
    >
      <Avatar className="h-[120px] w-[120px]">
        <AvatarImage 
          src={superlative.winner.photo_url || undefined} 
          alt={superlative.winner.name}
          className="object-cover"
        />
        <AvatarFallback 
          className="text-4xl font-bold text-white"
          style={{ backgroundColor: superlative.winner.color }}
        >
          {superlative.winner.initials}
        </AvatarFallback>
      </Avatar>

      <h3 className="text-sm font-bold text-center line-clamp-2 text-foreground min-h-[2.5rem]">
        {superlative.title}
      </h3>

      <p className="text-xs text-primary font-medium">
        {superlative.winner.name}
      </p>
    </button>
  );
};
