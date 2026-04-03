import { FeedEntry } from '@/hooks/useFeedData';
import { Sheet, SheetContent, SheetHeader } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ImageHero } from '@/components/lifeline/mobile/ImageHero';
import { EntryContent } from '@/components/lifeline/mobile/EntryContent';
import { X, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface MobileFeedDetailSheetProps {
  entry: FeedEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  currentIndex: number;
  totalEntries: number;
}

export const MobileFeedDetailSheet = ({
  entry,
  isOpen,
  onClose,
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
  currentIndex,
  totalEntries,
}: MobileFeedDetailSheetProps) => {
  if (!entry) return null;

  const isNewCollection = entry.type === 'new_collection';
  const formattedDate = entry.date.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => canGoNext && onNext(),
    onSwipedRight: () => canGoPrevious && onPrevious(),
    onSwipedDown: () => onClose(),
    trackMouse: false,
  });

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side="bottom" 
        className="h-[85vh] flex flex-col p-0 [&>button]:hidden"
        {...swipeHandlers}
      >
        <SheetHeader className="flex-shrink-0 p-4 border-b border-border flex flex-row items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Button
              variant="ghost"
              size="icon"
              onClick={onPrevious}
              disabled={!canGoPrevious}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs">swipe</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onNext}
              disabled={!canGoNext}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-sm font-semibold text-muted-foreground">
            {currentIndex + 1} / {totalEntries}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {isNewCollection ? (
            <>
              {/* New Collection Display */}
              {entry.collectionHeroImage && (
                <div className="relative h-[240px] overflow-hidden">
                  <img
                    src={entry.collectionHeroImage}
                    alt={entry.collectionTitle || 'Collection'}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="px-4 pt-4 pb-6">
                <h2 className="text-2xl font-bold mb-2 text-[hsl(var(--scheme-ll-entry-title))]">
                  {entry.collectionTitle}
                </h2>
                
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                  <span>Added {formattedDate}</span>
                </div>
                
                {entry.collectionDescription && (
                  <p className="text-foreground mb-6">
                    {entry.collectionDescription}
                  </p>
                )}
                
                {entry.collectionSlug && (
                  <Link to={`/public/collections/${entry.collectionSlug}`}>
                    <Button 
                      className="w-full"
                      style={{ 
                        backgroundColor: `hsl(var(--scheme-nav-button))`,
                        color: 'white'
                      }}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Explore Collection
                    </Button>
                  </Link>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Lifeline Entry Display */}
              {entry.entryImages && entry.entryImages.length > 0 ? (
                entry.entryImages.length === 1 ? (
                  <ImageHero
                    imageUrl={entry.entryImages[0].url}
                    title={entry.entryTitle || ''}
                    rating={entry.score || 0}
                  />
                ) : (
                  <div className="relative h-[320px]">
                    <Carousel className="h-full">
                      <CarouselContent className="h-full">
                        {entry.entryImages.map((image, idx) => (
                          <CarouselItem key={idx} className="h-full">
                            <ImageHero
                              imageUrl={image.url}
                              title={entry.entryTitle || ''}
                              rating={entry.score || 0}
                            />
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious className="left-2" />
                      <CarouselNext className="right-2" />
                    </Carousel>
                  </div>
                )
              ) : entry.entryImage ? (
                <ImageHero
                  imageUrl={entry.entryImage}
                  title={entry.entryTitle || ''}
                  rating={entry.score || 0}
                />
              ) : (
                <ImageHero
                  imageUrl={null}
                  title={entry.entryTitle || ''}
                  rating={entry.score || 0}
                />
              )}

              <div className="px-4 pt-4">
                <h2 className="text-xl font-bold mb-1 text-[hsl(var(--scheme-ll-entry-title))]">
                  {entry.entryTitle}
                </h2>
              </div>

              <EntryContent
                date={formattedDate}
                description={entry.entryDescription || ''}
                rating={entry.score || 0}
              />

              {/* Source links */}
              <div className="px-4 pb-6 space-y-2">
                {entry.lifelineSlug && entry.collectionSlug && (
                  <Link to={`/public/collections/${entry.collectionSlug}/lifelines/${entry.lifelineSlug}`}>
                    <Button 
                      variant="outline" 
                      className="w-full"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Full Lifeline
                    </Button>
                  </Link>
                )}
                
                {entry.collectionSlug && (
                  <Link to={`/public/collections/${entry.collectionSlug}`}>
                    <Button 
                      variant="outline" 
                      className="w-full"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Collection
                    </Button>
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
