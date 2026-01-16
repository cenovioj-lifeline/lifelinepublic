import { useState, useEffect } from "react";
import { X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface CollectionQuotePopupProps {
  quote: string;
  author?: string | null;
  context?: string | null;
  onDismiss: () => void;
  onNext?: () => void;
  hasMultipleQuotes?: boolean;
}

export function CollectionQuotePopup({ 
  quote, 
  author, 
  context, 
  onDismiss, 
  onNext, 
  hasMultipleQuotes 
}: CollectionQuotePopupProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade in after a short delay
    const timer = setTimeout(() => setIsVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 200);
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 max-w-md transition-all duration-300 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <Card className="shadow-lg border-2 rounded-lg bg-white border-[hsl(var(--scheme-card-border))]">
        <CardContent className="pt-6 pb-4 relative rounded-lg bg-white">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="absolute top-2 right-2 h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
          
          <div className={hasMultipleQuotes ? "pr-8" : "pr-6"}>
            <p className="text-sm italic mb-2 text-[hsl(var(--scheme-title-text))]">"{quote}"</p>
            {author && (
              <p className="text-xs font-semibold text-[hsl(var(--scheme-title-text))]">
                — {author}
              </p>
            )}
            {context && (
              <p className="text-xs mt-1 text-[hsl(var(--scheme-cards-text))]">
                {context}
              </p>
            )}
          </div>

          {hasMultipleQuotes && onNext && (
            <button
              onClick={onNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
              aria-label="Next quote"
            >
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}