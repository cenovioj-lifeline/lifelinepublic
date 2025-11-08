export interface MobileEntry {
  id: string;
  rank: number;
  date: string;
  title: string;
  description: string;
  rating: number;
  image_url: string | null;
  sentiment: string;
}

export interface EntryWithImages {
  id: string;
  title: string;
  summary: string | null;
  details: string | null;
  score: number | null;
  occurred_on: string | null;
  order_index: number;
  sentiment: string | null;
  entry_images: Array<{
    id: string;
    image_url: string;
    locked: boolean;
    order_index: number | null;
  }>;
}

export const selectMobileImage = (entryImages: EntryWithImages['entry_images']): string | null => {
  if (!entryImages || entryImages.length === 0) return null;
  
  // Priority 1: Locked images (Super Fan uploads)
  const lockedImage = entryImages.find(img => img.locked);
  if (lockedImage) return lockedImage.image_url;
  
  // Priority 2: First by order_index
  const sorted = [...entryImages].sort((a, b) => 
    (a.order_index ?? 999) - (b.order_index ?? 999)
  );
  return sorted[0]?.image_url || null;
};

export const formatEntryDate = (dateString: string | null): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

export const transformToMobileEntry = (entry: EntryWithImages): MobileEntry => {
  return {
    id: entry.id,
    rank: entry.order_index,
    date: formatEntryDate(entry.occurred_on),
    title: entry.title,
    description: entry.details || entry.summary || '',
    rating: entry.score || 0,
    image_url: selectMobileImage(entry.entry_images),
    sentiment: entry.sentiment || 'neutral',
  };
};

export const transformEntriesToMobile = (entries: EntryWithImages[]): MobileEntry[] => {
  return entries.map(transformToMobileEntry);
};
