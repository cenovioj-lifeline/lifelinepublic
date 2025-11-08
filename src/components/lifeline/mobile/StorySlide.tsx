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
      <EntryContent
        date={entry.date}
        description={entry.description}
      />
    </div>
  );
};
