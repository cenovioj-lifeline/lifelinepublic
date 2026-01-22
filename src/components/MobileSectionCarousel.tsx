import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MobileSectionCarouselProps {
  title?: string | null;
  children: React.ReactNode[];
  className?: string;
}

export function MobileSectionCarousel({ title, children, className }: MobileSectionCarouselProps) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const canScrollPrev = current > 0;
  const canScrollNext = current < count - 1;

  const scrollPrev = React.useCallback(() => {
    api?.scrollPrev();
  }, [api]);

  const scrollNext = React.useCallback(() => {
    api?.scrollNext();
  }, [api]);

  // Don't render carousel if only 1 item
  if (children.length === 1) {
    return (
      <section className={cn("space-y-4", className)}>
        {title && (
          <h2 className="text-2xl font-semibold" style={{ color: 'hsl(var(--scheme-title-text))' }}>
            {title}
          </h2>
        )}
        <div className="w-full">
          {children[0]}
        </div>
      </section>
    );
  }

  return (
    <section className={cn("space-y-4", className)}>
      {/* Header with title and arrows */}
      <div className="flex items-center justify-between">
        {title ? (
          <h2 className="text-2xl font-semibold" style={{ color: 'hsl(var(--scheme-title-text))' }}>
            {title}
          </h2>
        ) : (
          <div />
        )}
        
        {/* Navigation arrows */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={scrollPrev}
            disabled={!canScrollPrev}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={scrollNext}
            disabled={!canScrollNext}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next</span>
          </Button>
        </div>
      </div>

      {/* Carousel */}
      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-0">
          {children.map((child, index) => (
            <CarouselItem key={index} className="pl-0 basis-full">
              {child}
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Dot indicators and counter */}
      <div className="flex items-center justify-center gap-3">
        {/* Dots */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: count }).map((_, index) => (
            <button
              key={index}
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                index === current
                  ? "bg-[hsl(var(--scheme-title-text))]"
                  : "bg-[hsl(var(--scheme-title-text)/0.3)]"
              )}
              onClick={() => api?.scrollTo(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
        
        {/* Counter with section name */}
        <span 
          className="text-sm"
          style={{ color: 'hsl(var(--scheme-title-text)/0.7)' }}
        >
          {current + 1} of {count}{title ? ` ${title}` : ''}
        </span>
      </div>
    </section>
  );
}
