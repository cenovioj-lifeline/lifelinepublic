import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EntryCardProps {
  entry: {
    id: string;
    title: string;
    summary?: string;
    details?: string;
    occurred_on?: string;
    order_index: number;
    score?: number;
    sentiment?: string;
  };
  onEdit: () => void;
  onDelete: () => void;
  lifelineType: "person" | "list" | "voting" | "event" | "org" | "rating";
}

export function EntryCard({ entry, onEdit, onDelete, lifelineType }: EntryCardProps) {
  // Get colors from CSS variables (same as LifelineViewer)
  const positiveColor = getComputedStyle(document.documentElement).getPropertyValue('--scheme-ll-graph-positive') 
    ? `hsl(${getComputedStyle(document.documentElement).getPropertyValue('--scheme-ll-graph-positive')})` 
    : "#16a34a";
  const negativeColor = getComputedStyle(document.documentElement).getPropertyValue('--scheme-ll-graph-negative')
    ? `hsl(${getComputedStyle(document.documentElement).getPropertyValue('--scheme-ll-graph-negative')})`
    : "#dc2626";

  const getRatingStyle = (score?: number) => {
    if (!score || score === 0) {
      return { backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' };
    }
    
    if (score > 0) {
      return { backgroundColor: positiveColor, color: 'white' };
    } else {
      return { backgroundColor: negativeColor, color: 'white' };
    }
  };

  const getRatingPrefix = (score?: number) => {
    if (!score) return "0";
    return score > 0 ? `+${score}` : score.toString();
  };

  const getSentimentBadge = (sentiment?: string) => {
    if (!sentiment) return null;
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      positive: "default",
      neutral: "secondary",
      negative: "destructive",
      mixed: "outline",
    };
    return (
      <Badge variant={variants[sentiment] || "secondary"} className="capitalize">
        {sentiment}
      </Badge>
    );
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div
            className="flex items-center justify-center w-12 h-12 rounded-full flex-shrink-0"
            style={getRatingStyle(entry.score)}
          >
            <span className="font-bold text-lg">{getRatingPrefix(entry.score)}</span>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-base mb-1">{entry.title}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>
                    {lifelineType === "list" || lifelineType === "rating"
                      ? `Rank: ${entry.order_index}`
                      : formatDate(entry.occurred_on)}
                  </span>
                  {getSentimentBadge(entry.sentiment)}
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={onEdit}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onDelete}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {(entry.summary || entry.details) && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {entry.summary || entry.details}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
