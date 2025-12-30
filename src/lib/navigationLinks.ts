/**
 * Helper functions for creating navigation links with referrer tracking
 * These ensure back navigation returns users to where they came from
 */

type ReferrerType = 'profile' | 'collection' | 'lifelines' | 'home';

interface ReferrerInfo {
  type: ReferrerType;
  slug?: string;
}

/**
 * Builds a query string for referrer tracking
 */
function buildReferrerQuery(from: ReferrerInfo): string {
  if (from.type === 'profile' && from.slug) {
    return `?from=profile:${from.slug}`;
  }
  return `?from=${from.type}`;
}

/**
 * Creates a lifeline link with optional referrer tracking
 * Use when linking to a lifeline from a profile or other context
 */
export function lifelineLink(
  lifelineSlug: string,
  options?: {
    collectionSlug?: string;
    from?: ReferrerInfo;
  }
): string {
  const { collectionSlug, from } = options || {};
  
  const basePath = collectionSlug
    ? `/public/collections/${collectionSlug}/lifelines/${lifelineSlug}`
    : `/public/lifelines/${lifelineSlug}`;
  
  if (from) {
    return `${basePath}${buildReferrerQuery(from)}`;
  }
  
  return basePath;
}

/**
 * Creates a profile link with optional referrer tracking
 */
export function profileLink(
  profileSlug: string,
  options?: {
    collectionSlug?: string;
    from?: ReferrerInfo;
  }
): string {
  const { collectionSlug, from } = options || {};
  
  const basePath = collectionSlug
    ? `/public/collections/${collectionSlug}/profiles/${profileSlug}`
    : `/public/profiles/${profileSlug}`;
  
  if (from) {
    return `${basePath}${buildReferrerQuery(from)}`;
  }
  
  return basePath;
}

/**
 * Creates an election link with optional referrer tracking
 */
export function electionLink(
  electionSlug: string,
  options?: {
    collectionSlug?: string;
    from?: ReferrerInfo;
  }
): string {
  const { collectionSlug, from } = options || {};
  
  const basePath = collectionSlug
    ? `/public/collections/${collectionSlug}/elections/${electionSlug}`
    : `/public/elections/${electionSlug}`;
  
  if (from) {
    return `${basePath}${buildReferrerQuery(from)}`;
  }
  
  return basePath;
}
