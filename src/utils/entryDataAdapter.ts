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
  entry_media: Array<{
    id: string;
    locked: boolean;
    order_index: number | null;
    media_assets: {
      url: string;
    } | null;
  }>;
}

export const selectMobileImage = (entryMedia: EntryWithImages['entry_media']): string | null => {
  if (!entryMedia || entryMedia.length === 0) return null;
  
  // Priority 1: Locked images (Super Fan uploads)
  const lockedImage = entryMedia.find(img => img.locked);
  if (lockedImage?.media_assets?.url) return lockedImage.media_assets.url;
  
  // Priority 2: First by order_index
  const sorted = [...entryMedia].sort((a, b) => 
    (a.order_index ?? 999) - (b.order_index ?? 999)
  );
  return sorted[0]?.media_assets?.url || null;
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
    image_url: selectMobileImage(entry.entry_media),
    sentiment: entry.sentiment || 'neutral',
  };
};

export const transformEntriesToMobile = (entries: EntryWithImages[]): MobileEntry[] => {
  return entries.map(transformToMobileEntry);
};
