/**
 * Book Types
 *
 * Types for the Books & Works feature that displays author books
 * and their extracted content (insights, frameworks, stories, quotes, practical use).
 */

export type ContentType = 'insight' | 'framework' | 'story' | 'quote' | 'practical_use';

export interface Book {
  id: string;
  title: string;
  slug: string;
  subtitle?: string;
  authorProfileId?: string;
  authorName: string;
  publicationYear?: number;
  pageCount?: number;
  coreThesis?: string;
  oneSentenceSummary?: string;
  whoShouldRead?: string;
  keyThemes?: string[];
  coverImageUrl?: string;
  coverImagePath?: string;
  coverImageId?: string;
  themeColor?: string;
  status: 'draft' | 'published' | 'archived';
  createdAt?: string;
  updatedAt?: string;
  // Joined cover_image relationship
  cover_image?: {
    id: string;
    url: string;
    alt_text?: string;
    position_x?: number;
    position_y?: number;
    scale?: number;
  };
}

export interface BookContent {
  id: string;
  bookId: string;
  contentType: ContentType;
  visualType?: string;
  title?: string;
  content: string;
  chapterReference?: string;
  rating?: number;
  tags?: string[];
  relatedTo?: string[];
  extendedData: ExtendedData;
  orderIndex: number;
  likes: number;
  comments: number;
  createdAt?: string;
}

// Extended data varies by content type
export interface ExtendedData {
  // Insight extended data
  details?: Array<{ label: string; value: string }>;

  // Framework extended data
  items?: Array<{ id: number; title: string; desc: string }>;
  steps?: string[];

  // Story extended data
  quote?: string;
  subtitle?: string;

  // Quote extended data
  bgColor?: string;

  // Practical Use extended data
  action?: { label: string; instruction: string };

  // Allow additional properties
  [key: string]: unknown;
}

export interface ProfileBook extends Book {
  relationshipType: 'author' | 'co-author' | 'contributor' | 'featured';
  displayOrder: number;
}

// Content type metadata for display
export const CONTENT_TYPE_CONFIG: Record<ContentType, {
  label: string;
  pluralLabel: string;
  icon: string;
  color: string;
  bgColor: string;
}> = {
  insight: {
    label: 'Insight',
    pluralLabel: 'Insights',
    icon: 'Lightbulb',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
  },
  framework: {
    label: 'Framework',
    pluralLabel: 'Frameworks',
    icon: 'LayoutGrid',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  story: {
    label: 'Story',
    pluralLabel: 'Stories',
    icon: 'BookOpen',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  quote: {
    label: 'Quote',
    pluralLabel: 'Quotes',
    icon: 'Quote',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  practical_use: {
    label: 'Practical Use',
    pluralLabel: 'Practical Uses',
    icon: 'Wrench',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
};

export const CONTENT_TYPES: ContentType[] = ['insight', 'framework', 'story', 'quote', 'practical_use'];
