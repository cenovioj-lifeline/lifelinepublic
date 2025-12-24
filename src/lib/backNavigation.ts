/**
 * Utility for determining smart back navigation routes
 * Maps detail pages to their logical parent routes
 */

export interface BackNavigationConfig {
  parentPath: string;
  parentLabel: string;
}

/**
 * Determines the logical parent route for back navigation
 * based on the current path and route params
 */
export function getBackNavigation(
  pathname: string,
  params: Record<string, string | undefined>
): BackNavigationConfig | null {
  const { collectionSlug, lifelineSlug, profileSlug, electionSlug, bookSlug, slug } = params;

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
