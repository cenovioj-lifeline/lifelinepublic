/**
 * Utility for determining smart back navigation routes
 * Maps detail pages to their logical parent routes
 * Supports referrer tracking via URL search params
 */

export interface BackNavigationConfig {
  parentPath: string;
  parentLabel: string;
}

export interface ReferrerInfo {
  type: 'profile' | 'collection' | 'lifelines' | 'home';
  slug?: string;
  collectionSlug?: string;
}

/**
 * Parses referrer information from URL search params
 * Format: ?from=profile:slug or ?from=collection or ?from=lifelines
 */
export function parseReferrer(searchParams: URLSearchParams): ReferrerInfo | null {
  const from = searchParams.get('from');
  if (!from) return null;

  // Handle profile:slug format
  if (from.startsWith('profile:')) {
    const slug = from.substring('profile:'.length);
    return { type: 'profile', slug };
  }

  // Handle simple types
  if (from === 'collection') {
    return { type: 'collection' };
  }

  if (from === 'lifelines') {
    return { type: 'lifelines' };
  }

  if (from === 'home') {
    return { type: 'home' };
  }

  return null;
}

/**
 * Determines the logical parent route for back navigation
 * based on the current path, route params, and optional referrer
 */
export function getBackNavigation(
  pathname: string,
  params: Record<string, string | undefined>,
  searchParams?: URLSearchParams
): BackNavigationConfig | null {
  const { collectionSlug, lifelineSlug, profileSlug, electionSlug, bookSlug, slug } = params;

  // Check for referrer first (takes priority)
  if (searchParams) {
    const referrer = parseReferrer(searchParams);
    if (referrer) {
      // Handle referrer-based navigation
      if (referrer.type === 'profile' && referrer.slug) {
        // Came from a profile - go back there
        if (collectionSlug) {
          return {
            parentPath: `/public/collections/${collectionSlug}/profiles/${referrer.slug}`,
            parentLabel: "Profile"
          };
        } else {
          return {
            parentPath: `/public/profiles/${referrer.slug}`,
            parentLabel: "Profile"
          };
        }
      }

      if (referrer.type === 'collection' && collectionSlug) {
        return {
          parentPath: `/public/collections/${collectionSlug}`,
          parentLabel: "Collection"
        };
      }

      if (referrer.type === 'home') {
        return {
          parentPath: `/`,
          parentLabel: "Home"
        };
      }
    }
  }

  // Default deterministic routing (no referrer)
  // Collection context routes
  if (collectionSlug) {
    // Collection lifeline detail -> lifelines list
    if (lifelineSlug) {
      return {
        parentPath: `/public/collections/${collectionSlug}/lifelines`,
        parentLabel: "Stories"
      };
    }
    
    // Collection profile detail -> profiles list
    if (profileSlug && !bookSlug) {
      return {
        parentPath: `/public/collections/${collectionSlug}/profiles`,
        parentLabel: "Profiles"
      };
    }
    
    // Collection profile book detail -> profile detail
    if (profileSlug && bookSlug) {
      return {
        parentPath: `/public/collections/${collectionSlug}/profiles/${profileSlug}`,
        parentLabel: "Profile"
      };
    }
    
    // Collection election detail -> elections list
    if (electionSlug) {
      return {
        parentPath: `/public/collections/${collectionSlug}/elections`,
        parentLabel: "Awards"
      };
    }
  }

  // Public (non-collection) routes
  // /public/lifelines/:slug -> /public/lifelines
  if (pathname.startsWith("/public/lifelines/") && slug) {
    return {
      parentPath: "/public/lifelines",
      parentLabel: "Lifelines"
    };
  }

  // /public/profiles/:slug -> /public/profiles
  if (pathname.startsWith("/public/profiles/") && slug) {
    return {
      parentPath: "/public/profiles",
      parentLabel: "Profiles"
    };
  }

  // /public/elections/:slug -> /public/elections
  if (pathname.startsWith("/public/elections/") && slug) {
    return {
      parentPath: "/public/elections",
      parentLabel: "Elections"
    };
  }

  return null;
}

/**
 * Checks if the current route is a detail page (should show back button)
 */
export function isDetailPage(pathname: string): boolean {
  // Collection context detail pages
  const collectionDetailPatterns = [
    /^\/public\/collections\/[^/]+\/lifelines\/[^/]+$/,
    /^\/public\/collections\/[^/]+\/profiles\/[^/]+$/,
    /^\/public\/collections\/[^/]+\/elections\/[^/]+$/,
    /^\/public\/collections\/[^/]+\/profiles\/[^/]+\/books\/[^/]+$/,
  ];

  // Public (non-collection) detail pages
  const publicDetailPatterns = [
    /^\/public\/lifelines\/[^/]+$/,
    /^\/public\/profiles\/[^/]+$/,
    /^\/public\/elections\/[^/]+$/,
  ];

  return [...collectionDetailPatterns, ...publicDetailPatterns].some(
    (pattern) => pattern.test(pathname)
  );
}
