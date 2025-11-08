import { MobileEntry } from '@/utils/entryDataAdapter';
import { ImageHero } from './ImageHero';
import { EntryContent } from './EntryContent';

interface StorySlideProps {
  entry: MobileEntry;
}

export const StorySlide = ({ entry }: StorySlideProps) => {
  return (
    <div className="w-full h-full overflow-y-auto">
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
