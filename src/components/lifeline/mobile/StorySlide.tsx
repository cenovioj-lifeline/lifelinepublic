import { MobileEntry } from '@/utils/entryDataAdapter';
import { ImageHero } from './ImageHero';
import { EntryContent } from './EntryContent';
import { cn } from '@/lib/utils';

interface StorySlideProps {
  entry: MobileEntry;
  transitionDirection?: 'left' | 'right' | null;
}

export const StorySlide = ({ entry, transitionDirection }: StorySlideProps) => {
  return (
    <div className={cn(
      "w-full h-full overflow-y-auto",
      transitionDirection === 'left' && "animate-slide-in-left",
      transitionDirection === 'right' && "animate-slide-in-right"
    )}>
      <ImageHero
        imageUrl={entry.image_url}
        title={entry.title}
        rating={entry.rating}
      />
      <div className="px-4 pt-5">
        <h1 className="text-[22px] leading-tight font-bold text-foreground">
          {entry.title}
        </h1>
      </div>
      <EntryContent
        date={entry.date}
        description={entry.description}
        rating={entry.rating}
      />
    </div>
  );
};
