/**
 * Component Color Rules
 * 
 * This file provides semantic mappings between component purposes and color scheme variables.
 * Use these helpers to ensure consistent color usage across the application.
 */

export type ComponentColorType = keyof typeof COLOR_RULES;

/**
 * Semantic color mappings for common component types
 * Maps descriptive names to CSS custom property variables
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

  // ===== TEXT COLORS =====
  headingText: '--scheme-title-text',
  bodyText: '--scheme-collection-card-text',
  mutedText: '--scheme-card-text',
  navigationText: '--scheme-nav-text',
  cardText: '--scheme-card-text',
  emphasisText: '--scheme-nav-active-link',

  // ===== LIFELINE SPECIFIC =====
  lifelineDisplayBg: '--scheme-lifeline-bg',
  lifelineDisplayTitleText: '--scheme-ll-display-title-text',
  lifelineEntryTitleText: '--scheme-ll-entry-title-text',
  lifelineContributorButton: '--scheme-ll-entry-contributor-button',
  lifelineGraphBg: '--scheme-ll-graph-bg',
  lifelineGraphPositive: '--scheme-ll-graph-positive',
  lifelineGraphNegative: '--scheme-ll-graph-negative',

  // ===== CHARACTER/PROFILE ACTIONS =====
  characterActionsBg: '--scheme-ch-actions-bg',
  characterActionsBorder: '--scheme-ch-actions-border',
  characterActionsIcon: '--scheme-ch-actions-icon',
  characterActionsText: '--scheme-ch-actions-text',
  characterBannerText: '--scheme-ch-banner-text',
} as const;

/**
 * Component-based color selection guide
 * Returns the appropriate color variable for a given component description
 */
export function whatColorShouldIUse(description: string): ComponentColorType | null {
  const lowerDesc = description.toLowerCase();

  // Navigation
  if (lowerDesc.includes('navigation') || lowerDesc.includes('nav bar')) {
    if (lowerDesc.includes('background')) return 'navigationBackground';
    if (lowerDesc.includes('text')) return 'navigationText';
  }

  // Cards
  if (lowerDesc.includes('card')) {
    if (lowerDesc.includes('background')) return 'cardBackground';
    if (lowerDesc.includes('border')) return 'cardBorder';
    if (lowerDesc.includes('text')) return 'cardText';
  }

  // Awards
  if (lowerDesc.includes('award')) {
    if (lowerDesc.includes('background')) return 'awardBackground';
    if (lowerDesc.includes('border')) return 'awardBorder';
  }

  // Lifeline
  if (lowerDesc.includes('lifeline') || lowerDesc.includes('timeline')) {
    if (lowerDesc.includes('background')) return 'lifelineDisplayBg';
    if (lowerDesc.includes('title')) return 'lifelineDisplayTitleText';
    if (lowerDesc.includes('entry')) return 'lifelineEntryTitleText';
    if (lowerDesc.includes('graph')) {
      if (lowerDesc.includes('positive') || lowerDesc.includes('green')) return 'lifelineGraphPositive';
      if (lowerDesc.includes('negative') || lowerDesc.includes('red')) return 'lifelineGraphNegative';
      return 'lifelineGraphBg';
    }
  }

  // Buttons
  if (lowerDesc.includes('button')) {
    if (lowerDesc.includes('primary')) {
      return lowerDesc.includes('text') ? 'primaryButtonText' : 'primaryButtonBg';
    }
    if (lowerDesc.includes('secondary')) {
      return lowerDesc.includes('text') ? 'secondaryButtonText' : 'secondaryButtonBg';
    }
  }

  // Text
  if (lowerDesc.includes('text')) {
    if (lowerDesc.includes('heading') || lowerDesc.includes('title')) return 'headingText';
    if (lowerDesc.includes('muted') || lowerDesc.includes('subtle')) return 'mutedText';
    if (lowerDesc.includes('body')) return 'bodyText';
  }

  // Borders
  if (lowerDesc.includes('border') || lowerDesc.includes('divider')) {
    if (lowerDesc.includes('emphasis') || lowerDesc.includes('bold')) return 'emphasisBorder';
    return 'subtleBorder';
  }

  // Default
  return null;
}

/**
 * Get CSS custom property value
 */
export function getColorVar(colorType: ComponentColorType): string {
  return `hsl(var(${COLOR_RULES[colorType]}))`;
}

/**
 * Usage examples:
 * 
 * // In a component:
 * import { getColorVar } from '@/lib/componentColorRules';
 * 
 * // Direct usage:
 * <div style={{ backgroundColor: getColorVar('cardBackground') }}>
 * 
 * // Or with Tailwind:
 * <div className="bg-[hsl(var(--scheme-card-bg))]">
 * 
 * // Or ask for help:
 * const colorType = whatColorShouldIUse('card background');
 * if (colorType) {
 *   const color = getColorVar(colorType);
 * }
 */

/**
 * Quick reference for developers:
 * 
 * NAVIGATION:
 * - navigationBackground: Main nav bar background
 * - navigationText: Text in navigation
 * - primaryButtonBg/Text: For prominent CTAs
 * 
 * CARDS & CONTENT:
 * - cardBackground: Content card backgrounds
 * - cardBorder: Borders around cards
 * - cardText: Text within cards
 * - pageBackground: Main page background
 * 
 * LIFELINE/TIMELINE:
 * - lifelineDisplayBg: Timeline container background
 * - lifelineDisplayTitleText: Main timeline title
 * - lifelineEntryTitleText: Individual entry titles
 * - lifelineGraphPositive: Positive impact bars (green)
 * - lifelineGraphNegative: Negative impact bars (red)
 * - lifelineGraphBg: Graph background
 * 
 * AWARDS:
 * - awardBackground: Award card/badge background
 * - awardBorder: Award card border
 * 
 * CHARACTER ACTIONS:
 * - characterActionsBg: Action button backgrounds
 * - characterActionsBorder: Action button borders
 * - characterActionsIcon: Icon colors
 * - characterActionsText: Button text
 * - characterBannerText: Banner/header text
 * 
 * GENERAL TEXT:
 * - headingText: Page/section headings
 * - bodyText: Main content text
 * - mutedText: Secondary/less prominent text
 * - emphasisText: Highlighted/linked text
 * 
 * INTERACTIVE:
 * - linkColor: Text links
 * - hoverBackground: Hover state background
 * - activeBackground: Active/selected state background
 */
