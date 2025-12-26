// Profile Types for Modular Architecture

// ============= TIER 1: Universal Core =============
export interface Profile {
  id: string;
  name: string;
  slug: string;
  subject_type: 'Person' | 'Fictional Character' | 'Organization' | 'Concept' | 'Place' | 'Event';
  reality_status: 'real' | 'fictional' | 'mythological' | 'historical_fiction';
  
  // References (can be null)
  primary_lifeline_id: string | null;
  primary_collection_id: string | null;
  
  // Core text fields
  short_description: string;
  long_description?: string | null;
  known_for: string[];
  tags: string[];
  
  // Image handling
  primary_image_url: string | null;
  primary_image_path: string | null;
  avatar_image_id: string | null;
  
  // Status
  status: 'draft' | 'published' | 'archived';
  subject_status: string | null; // e.g., "Living", "Deceased (1865)", "Active", "Defunct"
  
  // TIER 2 & 3: Modular/optional data
  extended_data: ProfileExtendedData;
  
  // Metadata
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ============= TIER 2 & 3: Extended Data Structure =============
export interface ProfileExtendedData {
  // Biographical Module
  biographical?: BiographicalModule;
  
  // Physical Characteristics Module
  physical?: PhysicalCharacteristicsModule;
  
  // Legacy/Impact Module
  legacy?: LegacyImpactModule;
  
  // Fictional Character Module
  fictional?: FictionalCharacterModule;
  
  // Creative Works Module
  creative_works?: CreativeWorksModule;
  
  // Organization Module
  organization?: OrganizationModule;
  
  // Dynamic Content
  dynamic?: DynamicContent;
}

// ============= MODULE INTERFACES =============

export interface BiographicalModule {
  // For REAL people
  birth_date?: string;
  death_date?: string;
  birth_place?: string;
  death_place?: string;
  nationality?: string | string[];
  occupation?: string[];
  
  // For FICTIONAL characters
  birth_name?: string;
  first_appearance?: string;
  last_appearance?: string;
  origin?: string;
  species?: string;
  
  // Common to both
  family_relationships?: FamilyRelationship[];
  affiliations?: string[];
}

export interface PhysicalCharacteristicsModule {
  height?: string;
  weight?: string;
  build?: string;
  distinguishing_features?: string[];
  signature_items?: string[];
  powers_abilities?: string[];
  condition?: string;
  why_notable?: string;
}

export interface LegacyImpactModule {
  historical_significance?: string;
  cultural_impact?: string[];
  major_accomplishments?: string[];
  controversies?: string[];
  awards_honors?: string[];
  influence_on?: InfluenceRelationship[];
}

export interface FictionalCharacterModule {
  creators?: string[];
  universe?: string;
  media_appearances?: MediaAppearance[];
  portrayed_by?: string | string[];
  character_arc_summary?: string;
  first_appearance?: string;
  last_appearance?: string;
}

export interface CreativeWorksModule {
  notable_works?: NotableWork[];
  style_genre?: string[];
  major_themes?: string[];
  career_span?: string;
}

export interface OrganizationModule {
  founded_date?: string;
  dissolved_date?: string;
  founding_members?: FoundingMember[];
  headquarters?: string;
  mission_purpose?: string;
  key_achievements?: string[];
  current_status?: string;
}

export interface DynamicContent {
  associated_lifelines?: AssociatedLifeline[];
  community_contributions?: Contribution[];
  trending_connections?: Connection[];
  last_updated?: string;
  view_count?: number;
  bookmark_count?: number;
}

// ============= SUPPORTING TYPES =============

export interface FamilyRelationship {
  relationship_type: string;
  profile_id: string | null;
  name: string;
  context?: string;
}

export interface InfluenceRelationship {
  profile_id: string | null;
  name: string;
  context: string;
}

export interface MediaAppearance {
  type: string;
  title: string;
  years: string;
  seasons?: string;
}

export interface NotableWork {
  work_id: string | null;
  title: string;
  year: string;
  type?: string;
  significance: string;
}

export interface FoundingMember {
  profile_id: string | null;
  name: string;
  role: string;
}

export interface AssociatedLifeline {
  lifeline_id: string;
  title: string;
  type?: string;
}

export interface Contribution {
  id: string;
  user_id: string;
  type: string;
  content: string;
  created_at: string;
}

export interface Connection {
  id: string;
  profile_id: string;
  related_profile_id: string;
  connection_type: string;
}

// ============= HELPER FUNCTIONS =============

/**
 * Check if a profile has any fields from a specific module
 */
export function hasModule(profile: Profile, moduleType: keyof ProfileExtendedData): boolean {
  if (!profile.extended_data) return false;
  
  const module = profile.extended_data[moduleType];
  if (!module || typeof module !== 'object') return false;
  
  // Check if any field in the module has a value
  return Object.values(module).some(value => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== null && value !== undefined && value !== '';
  });
}

/**
 * Get initials from a name for avatar fallback
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Format date string to readable format
 */
export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch {
    return dateStr;
  }
}
