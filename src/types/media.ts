// TypeScript interfaces for Videos and Podcasts

export interface Video {
  id: string;
  title: string;
  slug: string;
  youtube_url?: string | null;
  description?: string | null;
  thumbnail_url?: string | null;
  thumbnail_path?: string | null;
  collection_id?: string | null;
  profile_id?: string | null;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Podcast {
  id: string;
  title: string;
  slug: string;
  season?: string | null;
  description?: string | null;
  podcast_url?: string | null;
  thumbnail_url?: string | null;
  thumbnail_path?: string | null;
  collection_id?: string | null;
  profile_id?: string | null;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type MediaType = 'book' | 'video' | 'podcast';

export interface MediaItem {
  id: string;
  title: string;
  slug: string;
  type: MediaType;
  thumbnailUrl?: string | null;
  subtitle?: string | null;
  themeColor?: string | null;
  status?: string | null;
  updatedAt?: string;
  // Additional fields for routing/display
  profileSlug?: string;
  collectionSlug?: string;
}
