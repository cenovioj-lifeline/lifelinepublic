/**
 * Page Layout Types
 * 
 * Types for the unified Page Builder system that manages
 * both the main homepage and collection homepages.
 */

// Card/item types that can appear in a layout
export type PageLayoutItemType =
  | 'collection'
  | 'profile'
  | 'lifeline'
  | 'election'
  | 'book'
  | 'action_card'
  | 'custom_link';

// Page types that can have layouts
export type PageType = 'home' | 'collection';

// Database row: page_layouts table
export interface PageLayout {
  id: string;
  page_type: PageType;
  entity_id: string | null;  // null for home, collection_id for collections
  created_at: string;
  updated_at: string;
}

// Database row: page_layout_items table
export interface PageLayoutItem {
  id: string;
  layout_id: string;
  item_type: PageLayoutItemType;
  item_id: string;
  display_order: number;
  section_id?: string | null;
  created_at: string;
  // Custom link fields (only used when item_type is 'custom_link')
  custom_title?: string | null;
  custom_subtitle?: string | null;
  custom_link?: string | null;
  custom_image_url?: string | null;
  custom_image_position_x?: number | null;
  custom_image_position_y?: number | null;
}

// Database row: page_layout_sections table
export interface PageLayoutSection {
  id: string;
  layout_id: string;
  section_title: string | null;
  display_order: number;
  columns_count: number;
  created_at: string;
}

// Extended section with items
export interface PageLayoutSectionWithItems extends PageLayoutSection {
  items: PageLayoutItemWithContent[];
}

// Normalized content for rendering cards
export interface CardContent {
  title: string;
  subtitle?: string;
  image_url?: string;
  image_position_x?: number;
  image_position_y?: number;
  slug?: string;
  link?: string;
  // Collection specific
  card_label?: string;
  // Action card specific
  icon_name?: string;
  icon_url?: string;
  isActionCard?: boolean;
}

// Extended type with resolved content for rendering
export interface PageLayoutItemWithContent extends PageLayoutItem {
  content: CardContent | null;
}

// Form/UI types for creating/updating items
export interface PageLayoutItemInput {
  item_type: PageLayoutItemType;
  item_id: string;
  display_order: number;
}

// Type guards
export function isValidItemType(type: string): type is PageLayoutItemType {
  return ['collection', 'profile', 'lifeline', 'election', 'book', 'action_card', 'custom_link'].includes(type);
}

export function isValidPageType(type: string): type is PageType {
  return ['home', 'collection'].includes(type);
}

// Badge colors by item type (for admin UI)
export const itemTypeBadgeColors: Record<PageLayoutItemType, string> = {
  collection: 'bg-blue-100 text-blue-800',
  profile: 'bg-green-100 text-green-800',
  lifeline: 'bg-purple-100 text-purple-800',
  election: 'bg-orange-100 text-orange-800',
  book: 'bg-amber-100 text-amber-800',
  action_card: 'bg-gray-100 text-gray-800',
  custom_link: 'bg-teal-100 text-teal-800',
};

// Display labels for item types
export const itemTypeLabels: Record<PageLayoutItemType, string> = {
  collection: 'Collection',
  profile: 'Profile',
  lifeline: 'Lifeline',
  election: 'Awards',
  book: 'Book',
  action_card: 'Action',
  custom_link: 'Link',
};
