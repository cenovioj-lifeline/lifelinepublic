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
      <div className="px-6 pt-6">
        <h1 className="text-3xl font-bold text-foreground mb-4">
          {entry.title}
        </h1>
      </div>
      <EntryContent
        date={entry.date}
        description={entry.description}
      />
    </div>
  );
};
