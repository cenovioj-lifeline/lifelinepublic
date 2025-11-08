import { Badge } from '@/components/ui/badge';

interface EntryContentProps {
  date: string;
  rating: number;
  description: string;
}

export const EntryContent = ({ date, rating, description }: EntryContentProps) => {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        {date && (
          <span className="text-sm text-muted-foreground">{date}</span>
        )}
        <Badge 
          variant={rating >= 0 ? "default" : "destructive"}
          className="font-semibold"
        >
          {rating >= 0 ? '+' : ''}{rating}
        </Badge>
      </div>
      
      <div className="prose prose-sm max-w-none text-foreground">
        {description.split('\n').map((paragraph, i) => (
          paragraph.trim() && <p key={i} className="mb-4">{paragraph}</p>
        ))}
      </div>
    </div>
  );
};
