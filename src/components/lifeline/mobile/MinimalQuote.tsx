import { useState } from 'react';
import { Quote } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface MinimalQuoteProps {
  quote: string;
  author?: string | null;
  context?: string | null;
  onDismiss: () => void;
}

export const MinimalQuote = ({ quote, author, context, onDismiss }: MinimalQuoteProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {/* Minimal floating button */}
      <button
        onClick={() => setExpanded(true)}
        className={cn(
          "fixed bottom-4 right-4 z-40",
          "w-12 h-12 rounded-full",
          "bg-primary/10 hover:bg-primary/20",
          "border-2 border-primary/30",
          "flex items-center justify-center",
          "transition-all duration-200",
          "shadow-lg hover:shadow-xl",
          "active:scale-95"
        )}
      >
        <Quote className="w-5 h-5 text-primary" />
      </button>

      {/* Expanded quote dialog */}
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">Quote</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-base italic text-foreground">
              "{quote}"
            </p>
            {author && (
              <p className="text-sm font-semibold text-foreground/80">
                — {author}
              </p>
            )}
            {context && (
              <p className="text-xs text-muted-foreground pt-2 border-t">
                {context}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
