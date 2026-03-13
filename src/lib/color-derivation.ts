/**
 * Color Derivation Engine
 *
 * Maps 4-6 base colors into a complete 30-field color scheme.
 * Rules derived from analysis of 11 production schemes (March 2026).
 *
 * Key finding from production data:
 * - page_bg and cards_bg are almost NEVER the same color
 * - cards_bg is typically a warm/tinted variant of the page background
 * - award_bg is its own unique color, rarely matches the accent
 * - Most schemes use 8-14 unique colors across 30 fields
 *
 * The system takes "surface" as the CARD background (the tinted color)
 * and derives page_bg as the lightest shade. This matches 9/11 schemes.
 */

import {
  type BasePalette,
  type ShadeScale,
  generateShades,
  autoTextColor,
  isDarkSurface,
  autoPositiveColor,
  autoNegativeColor,
  checkContrast,
  ensureContrast,
} from "./color-utils";

// ─── Types ──────────────────────────────────────────────────────────────────

/** The full 30-field scheme as stored in the database */
export interface FullColorScheme {
  // Navigation (1-3)
  nav_bg_color: string;
  nav_text_color: string;
  nav_button_color: string;
  // Lifeline display (4-10)
  ll_display_bg: string;
  ll_display_title_text: string;
  ll_entry_title_text: string;
  ll_entry_contributor_button: string;
  ll_graph_bg: string;
  ll_graph_positive: string;
  ll_graph_negative: string;
  // Cards & actions (11-18)
  cards_bg: string;
  cards_border: string;
  cards_text: string;
  ch_actions_bg: string;
  ch_actions_border: string;
  ch_actions_icon: string;
  ch_actions_text: string;
  ch_banner_text: string;
  // Awards (19-23)
  award_bg: string;
  award_border: string;
  award_category_bg: string;
  award_item_bg: string;
  award_text: string;
  // Page & profile (24-28)
  title_text: string;
  page_bg: string;
  profile_text: string;
  profile_label_text: string;
  filter_controls_text: string;
  // Contrast text (29-30)
  light_text_color: string;
  dark_text_color: string;
  // Person name accent
  person_name_accent: string;
}

/** Which base color + shade each field derives from */
export interface DerivationSource {
  base: keyof BasePalette;
  shade: keyof ShadeScale;
  override?: "autoText" | "autoContrast";
  contrastAgainst?: string; // field name of the background this text sits on
}

// ─── Derivation Rules ───────────────────────────────────────────────────────

/**
 * The mapping rules. Each of the 30 fields derives from a base color + shade.
 * "autoText" means the color is computed for contrast against a specific background.
 */
export const DERIVATION_RULES: Record<keyof FullColorScheme, DerivationSource> = {
  // ── Navigation ────────────────────────────────────────────────────────
  nav_bg_color:        { base: "primary", shade: "base" },
  nav_text_color:      { base: "primary", shade: "base", override: "autoText", contrastAgainst: "nav_bg_color" },
  nav_button_color:    { base: "accent", shade: "base" },

  // ── Lifeline Display ──────────────────────────────────────────────────
  // Production data: ll_display_bg is usually a tinted variant, same as cards_bg
  ll_display_bg:              { base: "surface", shade: "base" },
  ll_display_title_text:      { base: "primary", shade: "base" },
  ll_entry_title_text:        { base: "primary", shade: "base" },
  ll_entry_contributor_button: { base: "primary", shade: "dark" },
  ll_graph_bg:                { base: "surface", shade: "lightest" },
  ll_graph_positive:          { base: "positive", shade: "base" },
  ll_graph_negative:          { base: "negative", shade: "base" },

  // ── Cards & Actions ───────────────────────────────────────────────────
  // "surface" = the card/content background (tinted), NOT white
  cards_bg:           { base: "surface", shade: "base" },
  cards_border:       { base: "text", shade: "light" },
  cards_text:         { base: "text", shade: "base" },
  ch_actions_bg:      { base: "surface", shade: "base" },
  ch_actions_border:  { base: "text", shade: "light" },
  ch_actions_icon:    { base: "accent", shade: "base" },
  // Production data: ch_actions_text often uses primary, not text
  ch_actions_text:    { base: "primary", shade: "base" },
  ch_banner_text:     { base: "primary", shade: "base", override: "autoText", contrastAgainst: "nav_bg_color" },

  // ── Awards ────────────────────────────────────────────────────────────
  // Production data: award_bg is almost never the accent. It's often a muted/complementary tone.
  // Default to accent.light as a softer starting point; user will override.
  award_bg:           { base: "accent", shade: "light" },
  award_border:       { base: "text", shade: "light" },
  award_category_bg:  { base: "surface", shade: "base" },
  award_item_bg:      { base: "surface", shade: "lightest" },
  award_text:         { base: "text", shade: "base" },

  // ── Page & Profile ────────────────────────────────────────────────────
  title_text:           { base: "text", shade: "base" },
  // Production data: page_bg is almost always lighter than cards_bg.
  // Derive as lightest shade of surface (closest to white while staying tinted).
  page_bg:              { base: "surface", shade: "lightest" },
  profile_text:         { base: "text", shade: "base" },
  profile_label_text:   { base: "text", shade: "base" },
  filter_controls_text: { base: "text", shade: "base" },

  // ── Contrast Text ─────────────────────────────────────────────────────
  light_text_color: { base: "text", shade: "base", override: "autoText", contrastAgainst: "nav_bg_color" },
  dark_text_color:  { base: "text", shade: "base", override: "autoText", contrastAgainst: "page_bg" },

  // ── Person Name ───────────────────────────────────────────────────────
  person_name_accent: { base: "accent", shade: "base" },
};

// ─── Dark Surface Overrides ─────────────────────────────────────────────────

/**
 * When the surface color is dark (Prof G / Lifeline Inc pattern),
 * certain fields need to flip to maintain readability.
 */
const DARK_SURFACE_OVERRIDES: Partial<Record<keyof FullColorScheme, DerivationSource>> = {
  cards_text:           { base: "surface", shade: "lightest" },
  ch_actions_text:      { base: "surface", shade: "lightest" },
  title_text:           { base: "surface", shade: "lightest" },
  profile_text:         { base: "surface", shade: "lightest" },
  profile_label_text:   { base: "surface", shade: "lightest" },
  filter_controls_text: { base: "surface", shade: "lightest" },
  award_text:           { base: "surface", shade: "lightest" },
  cards_border:         { base: "surface", shade: "light" },
  ch_actions_border:    { base: "surface", shade: "light" },
  award_border:         { base: "surface", shade: "light" },
};

// ─── Main Derivation Function ───────────────────────────────────────────────

/**
 * Generate a complete 30-field color scheme from 4-6 base colors.
 *
 * @param palette - The 4 required + 2 optional base colors
 * @returns Complete scheme ready for database storage
 */
export function derivePalette(palette: BasePalette): FullColorScheme {
  // Generate shade scales for each base color
  const shades: Record<string, ShadeScale> = {
    primary: generateShades(palette.primary),
    accent: generateShades(palette.accent),
    surface: generateShades(palette.surface),
    text: generateShades(palette.text),
    positive: generateShades(palette.positive || autoPositiveColor(palette.surface)),
    negative: generateShades(palette.negative || autoNegativeColor(palette.surface)),
  };

  // Detect dark surface mode
  const darkMode = isDarkSurface(palette.surface);

  // Pick the right rule set
  const rules = { ...DERIVATION_RULES };
  if (darkMode) {
    Object.assign(rules, DARK_SURFACE_OVERRIDES);
  }

  // First pass: resolve all non-autoText fields
  const scheme: Partial<FullColorScheme> = {};
  for (const [field, rule] of Object.entries(rules) as [keyof FullColorScheme, DerivationSource][]) {
    if (rule.override === "autoText") continue; // Handle in second pass
    scheme[field] = shades[rule.base][rule.shade];
  }

  // Second pass: resolve autoText fields (need background values from first pass)
  for (const [field, rule] of Object.entries(rules) as [keyof FullColorScheme, DerivationSource][]) {
    if (rule.override !== "autoText") continue;

    const bgField = rule.contrastAgainst as keyof FullColorScheme;
    const bgColor = scheme[bgField] || palette.surface;

    scheme[field] = autoTextColor(bgColor);
  }

  // Third pass: ensure critical contrast pairs pass AA
  const contrastPairs: [keyof FullColorScheme, keyof FullColorScheme][] = [
    ["cards_text", "cards_bg"],
    ["title_text", "page_bg"],
    ["award_text", "award_bg"],
    ["award_text", "award_category_bg"],
    ["ch_actions_text", "ch_actions_bg"],
    ["filter_controls_text", "page_bg"],
    ["profile_text", "page_bg"],
    ["profile_label_text", "cards_bg"],
    ["ll_entry_title_text", "ll_display_bg"],
  ];

  for (const [fgField, bgField] of contrastPairs) {
    const fg = scheme[fgField]!;
    const bg = scheme[bgField]!;
    scheme[fgField] = ensureContrast(fg, bg, 4.5);
  }

  return scheme as FullColorScheme;
}

// ─── Palette Validation ─────────────────────────────────────────────────────

export interface ContrastIssue {
  foregroundField: keyof FullColorScheme;
  backgroundField: keyof FullColorScheme;
  foreground: string;
  background: string;
  ratio: number;
  level: string;
}

/**
 * Validate all critical contrast pairs in a scheme.
 * Returns array of failing pairs (empty = all good).
 */
export function validateContrast(scheme: FullColorScheme): ContrastIssue[] {
  const pairs: [keyof FullColorScheme, keyof FullColorScheme, number][] = [
    // [fg field, bg field, min ratio]
    ["nav_text_color", "nav_bg_color", 4.5],
    ["cards_text", "cards_bg", 4.5],
    ["title_text", "page_bg", 4.5],
    ["award_text", "award_bg", 4.5],
    ["award_text", "award_category_bg", 4.5],
    ["award_text", "award_item_bg", 4.5],
    ["ch_banner_text", "nav_bg_color", 3],
    ["ch_actions_text", "ch_actions_bg", 4.5],
    ["ch_actions_icon", "ch_actions_bg", 3],
    ["light_text_color", "nav_bg_color", 4.5],
    ["dark_text_color", "page_bg", 4.5],
    ["ll_entry_title_text", "ll_display_bg", 4.5],
    ["profile_text", "page_bg", 4.5],
    ["profile_label_text", "cards_bg", 4.5],
    ["filter_controls_text", "page_bg", 4.5],
    ["person_name_accent", "cards_bg", 3],
  ];

  const issues: ContrastIssue[] = [];
  for (const [fgField, bgField, minRatio] of pairs) {
    const fg = scheme[fgField];
    const bg = scheme[bgField];
    const result = checkContrast(fg, bg);
    if (result.ratio < minRatio) {
      issues.push({
        foregroundField: fgField,
        backgroundField: bgField,
        foreground: fg,
        background: bg,
        ratio: result.ratio,
        level: result.level,
      });
    }
  }
  return issues;
}

// ─── Reverse Engineering ────────────────────────────────────────────────────

/**
 * Attempt to extract the base palette from an existing 30-field scheme.
 * Uses the most common color mappings found in production data.
 */
export function reverseEngineerPalette(scheme: FullColorScheme): BasePalette {
  return {
    primary: scheme.nav_bg_color,
    accent: scheme.nav_button_color,
    surface: scheme.page_bg || scheme.cards_bg,
    text: scheme.cards_text || scheme.title_text,
    positive: scheme.ll_graph_positive,
    negative: scheme.ll_graph_negative,
  };
}
