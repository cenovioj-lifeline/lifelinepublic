import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface CollectionQuotePopupProps {
  quote: string;
  author?: string | null;
  context?: string | null;
  onDismiss: () => void;
}

export function CollectionQuotePopup({ quote, author, context, onDismiss }: CollectionQuotePopupProps) {
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
          
          <div className="pr-6">
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
        </CardContent>
      </Card>
    </div>
  );
}