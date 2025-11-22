/**
 * Component Color Rules
 *
 * Defines semantic mappings from component types to CSS color variables.
 * Developers use these rules instead of directly choosing CSS variables.
 *
 * Usage:
 *   import { getComponentColor, COLOR_RULES } from '@/lib/componentColorRules';
 *
 *   <div style={{ background: `var(${getComponentColor('cardBackground')})` }}>
 */

export const COLOR_RULES = {
  // ===== CONTAINERS & BACKGROUNDS =====
  pageBackground: '--scheme-collection-bg',
  cardBackground: '--scheme-card-bg',
  modalBackground: '--scheme-card-bg',
  sectionBackground: '--scheme-collection-card-bg',
  panelBackground: '--scheme-card-bg',
  awardBackground: '--scheme-award-bg',
  lifelineBackground: '--scheme-lifeline-bg',
  navigationBackground: '--scheme-nav-bg',

  // ===== BORDERS & DIVIDERS =====
  subtleBorder: '--scheme-card-border',
  cardBorder: '--scheme-card-border',
  emphasisBorder: '--scheme-lifeline-border',
  awardBorder: '--scheme-award-border',
  divider: '--scheme-card-border',

  // ===== INTERACTIVE ELEMENTS =====
  primaryButtonBg: '--scheme-nav-active-link',
  primaryButtonText: '--scheme-nav-text',
  secondaryButtonBg: '--scheme-collection-card-accent',
  secondaryButtonText: '--scheme-collection-card-text',
  linkColor: '--scheme-nav-active-link',
  hoverBackground: '--scheme-lifeline-bg',
  activeBackground: '--scheme-lifeline-border',

  // ===== INFORMATIONAL (Badges, Tags, Labels) =====
  defaultBadgeBackground: '--scheme-collection-card-bg',
  defaultBadgeBorder: '--scheme-card-border',
  defaultBadgeText: '--scheme-collection-card-text',

  accentBadgeBackground: '--scheme-award-bg',
  accentBadgeBorder: '--scheme-award-border',
  accentBadgeText: '--scheme-award-text',

  tagBackground: '--scheme-collection-card-bg',
  tagBorder: '--scheme-card-border',
  tagText: '--scheme-collection-card-text',

  // ===== TEXT =====
  primaryText: '--scheme-collection-text',
  secondaryText: '--scheme-card-text',
  mutedText: '--scheme-lifeline-entry-date',
  navigationText: '--scheme-nav-text',
  headingText: '--scheme-collection-text',
  lifelineText: '--scheme-lifeline-text',

  // ===== SPECIAL CASES =====
  lifelineEntryHeaderBg: '--scheme-lifeline-entry-header-bg',
  lifelineEntryHeaderText: '--scheme-lifeline-entry-header-text',
} as const;

export type ComponentColorType = keyof typeof COLOR_RULES;

/**
 * Get CSS variable for a component type
 */
export function getComponentColor(componentType: ComponentColorType): string {
  return COLOR_RULES[componentType];
}

/**
 * Decision tree helper for developers
 * Call this with a description and get the recommended color rule
 */
export function whatColorShouldIUse(description: string): ComponentColorType | null {
  const lower = description.toLowerCase();

  // Container checks
  if (
    lower.includes('page background') ||
    lower.includes('page bg')
  ) {
    return 'pageBackground';
  }

  if (
    lower.includes('card background') ||
    lower.includes('card bg') ||
    lower.includes('panel') ||
    lower.includes('modal')
  ) {
    return 'cardBackground';
  }

  if (
    lower.includes('section background') ||
    lower.includes('section bg')
  ) {
    return 'sectionBackground';
  }

  if (lower.includes('award') && lower.includes('background')) {
    return 'awardBackground';
  }

  // Border checks
  if (
    (lower.includes('border') || lower.includes('divider')) &&
    !lower.includes('award')
  ) {
    if (lower.includes('subtle') || lower.includes('light')) {
      return 'subtleBorder';
    }
    if (lower.includes('emphasis') || lower.includes('strong')) {
      return 'emphasisBorder';
    }
    return 'cardBorder';
  }

  if (lower.includes('award') && lower.includes('border')) {
    return 'awardBorder';
  }

  // Interactive checks
  if (lower.includes('button')) {
    if (lower.includes('primary') || lower.includes('main')) {
      return 'primaryButtonBg';
    }
    return 'secondaryButtonBg';
  }

  if (lower.includes('link')) {
    return 'linkColor';
  }

  if (lower.includes('hover')) {
    return 'hoverBackground';
  }

  // Badge/Tag checks
  if (lower.includes('badge') || lower.includes('tag')) {
    if (lower.includes('accent') || lower.includes('featured')) {
      return 'accentBadgeBackground';
    }
    return 'defaultBadgeBackground';
  }

  // Text checks
  if (lower.includes('text') || lower.includes('heading')) {
    if (lower.includes('muted') || lower.includes('gray') || lower.includes('subtle')) {
      return 'mutedText';
    }
    if (lower.includes('heading') || lower.includes('title')) {
      return 'headingText';
    }
    if (lower.includes('primary') || lower.includes('main')) {
      return 'primaryText';
    }
    return 'secondaryText';
  }

  return null;
}

/**
 * Example usage for common component patterns
 */
export const COMPONENT_EXAMPLES = {
  // Cards
  profileCard: {
    background: COLOR_RULES.cardBackground,
    border: COLOR_RULES.cardBorder,
    text: COLOR_RULES.secondaryText,
    heading: COLOR_RULES.headingText,
  },

  // Badges
  characterBadge: {
    background: COLOR_RULES.defaultBadgeBackground,
    border: COLOR_RULES.defaultBadgeBorder,
    text: COLOR_RULES.defaultBadgeText,
  },

  featuredBadge: {
    background: COLOR_RULES.accentBadgeBackground,
    border: COLOR_RULES.accentBadgeBorder,
    text: COLOR_RULES.accentBadgeText,
  },

  // Buttons
  primaryButton: {
    background: COLOR_RULES.primaryButtonBg,
    text: COLOR_RULES.primaryButtonText,
  },

  secondaryButton: {
    background: COLOR_RULES.secondaryButtonBg,
    text: COLOR_RULES.secondaryButtonText,
  },

  // Awards
  awardCard: {
    background: COLOR_RULES.awardBackground,
    border: COLOR_RULES.awardBorder,
    text: COLOR_RULES.primaryText,
  },

  // Sections
  infoSection: {
    background: COLOR_RULES.sectionBackground,
    text: COLOR_RULES.secondaryText,
    heading: COLOR_RULES.headingText,
  },
} as const;
