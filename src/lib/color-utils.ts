/**
 * Color Utilities — Shade Generation, Contrast Checking, Auto Text Color
 *
 * Uses chroma-js for perceptually-aware color manipulation.
 * All shade generation uses OKLCH for perceptually uniform lightness.
 */

import chroma from "chroma-js";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ShadeScale {
  darkest: string;  // L × 0.3  — deep backgrounds, strong borders
  dark: string;     // L × 0.6  — hover states, secondary borders
  base: string;     // original  — the picked color
  light: string;    // L + (1-L) × 0.4  — subtle backgrounds
  lightest: string; // L + (1-L) × 0.75 — very subtle tints
}

export interface BasePalette {
  primary: string;    // Brand identity, nav bar
  accent: string;     // CTAs, buttons, highlights, awards
  surface: string;    // Page/card backgrounds
  text: string;       // Primary readable text
  positive?: string;  // Success/positive (auto-derived if blank)
  negative?: string;  // Error/negative (auto-derived if blank)
}

export interface ContrastResult {
  ratio: number;
  passesAA: boolean;      // >= 4.5:1 for normal text
  passesAALarge: boolean;  // >= 3:1 for large text/UI
  passesAAA: boolean;      // >= 7:1 for enhanced
  level: "fail" | "AA-large" | "AA" | "AAA";
}

// ─── Shade Generation ───────────────────────────────────────────────────────

/**
 * Generate 5 perceptually uniform shades from a base color.
 * Uses OKLCH lightness for uniform perception across hues.
 */
export function generateShades(hex: string): ShadeScale {
  const c = chroma(hex);
  const [l, chromaVal, h] = c.oklch();

  // Clamp chroma at extremes to prevent oversaturation
  const clampChroma = (targetL: number, baseChroma: number): number => {
    if (targetL > 0.9 || targetL < 0.15) return baseChroma * 0.5;
    return baseChroma;
  };

  const darkestL = l * 0.3;
  const darkL = l * 0.6;
  const lightL = l + (1 - l) * 0.4;
  const lightestL = l + (1 - l) * 0.75;

  const toHex = (targetL: number): string => {
    try {
      return chroma.oklch(targetL, clampChroma(targetL, chromaVal), h || 0).hex();
    } catch {
      // Fallback if oklch produces out-of-gamut color
      return chroma(hex).luminance(targetL).hex();
    }
  };

  return {
    darkest: toHex(darkestL),
    dark: toHex(darkL),
    base: hex,
    light: toHex(lightL),
    lightest: toHex(lightestL),
  };
}

// ─── Contrast Checking ──────────────────────────────────────────────────────

/**
 * Calculate WCAG 2.x contrast ratio between two colors.
 * Returns ratio and pass/fail for AA, AA-large, and AAA.
 */
export function checkContrast(fg: string, bg: string): ContrastResult {
  const ratio = chroma.contrast(fg, bg);
  return {
    ratio: Math.round(ratio * 10) / 10,
    passesAA: ratio >= 4.5,
    passesAALarge: ratio >= 3,
    passesAAA: ratio >= 7,
    level: ratio >= 7 ? "AAA" : ratio >= 4.5 ? "AA" : ratio >= 3 ? "AA-large" : "fail",
  };
}

/**
 * Check if two colors pass WCAG AA for normal text (4.5:1).
 */
export function passesAA(fg: string, bg: string): boolean {
  return chroma.contrast(fg, bg) >= 4.5;
}

// ─── Auto Text Color ────────────────────────────────────────────────────────

/**
 * Pick the best text color (light or dark) for a given background.
 * Returns whichever has higher contrast ratio.
 *
 * @param bg - Background color hex
 * @param lightCandidate - Light text option (default white)
 * @param darkCandidate - Dark text option (default near-black)
 */
export function autoTextColor(
  bg: string,
  lightCandidate: string = "#ffffff",
  darkCandidate: string = "#1f2937"
): string {
  const lightRatio = chroma.contrast(lightCandidate, bg);
  const darkRatio = chroma.contrast(darkCandidate, bg);
  return lightRatio > darkRatio ? lightCandidate : darkCandidate;
}

/**
 * Adjust a text color to meet minimum contrast ratio against a background.
 * Lightens or darkens the text until it passes.
 * Returns the adjusted color, or the original if already passing.
 */
export function ensureContrast(
  textHex: string,
  bgHex: string,
  minRatio: number = 4.5
): string {
  if (chroma.contrast(textHex, bgHex) >= minRatio) return textHex;

  const bgLum = chroma(bgHex).luminance();
  const isLightBg = bgLum > 0.5;

  // Try stepping the text color darker (on light bg) or lighter (on dark bg)
  let adjusted = chroma(textHex);
  for (let i = 0; i < 20; i++) {
    if (isLightBg) {
      adjusted = adjusted.darken(0.3);
    } else {
      adjusted = adjusted.brighten(0.3);
    }
    if (chroma.contrast(adjusted.hex(), bgHex) >= minRatio) {
      return adjusted.hex();
    }
  }

  // Last resort: return black or white
  return isLightBg ? "#000000" : "#ffffff";
}

// ─── Surface Detection ──────────────────────────────────────────────────────

/**
 * Detect if a color is "dark" (should use light text on it).
 * Uses luminance rather than HSL lightness for accuracy.
 */
export function isDarkSurface(hex: string): boolean {
  return chroma(hex).luminance() < 0.2;
}

/**
 * Detect if a color is "very light" (should use dark text on it).
 */
export function isLightSurface(hex: string): boolean {
  return chroma(hex).luminance() > 0.5;
}

// ─── Auto Positive/Negative ─────────────────────────────────────────────────

/**
 * Generate a green that works with the palette's surface color.
 * Ensures contrast against the surface.
 */
export function autoPositiveColor(surface: string): string {
  const base = "#4a7c59"; // Earthy green
  return ensureContrast(base, surface, 3);
}

/**
 * Generate a red that works with the palette's surface color.
 * Ensures contrast against the surface.
 */
export function autoNegativeColor(surface: string): string {
  const base = "#b53d3d"; // Muted red
  return ensureContrast(base, surface, 3);
}

// ─── Hex/HSL Conversion (matches useColorScheme.tsx format) ─────────────────

/**
 * Convert hex to space-separated HSL string for CSS variables.
 * Format: "H S% L%" (e.g., "352 25% 20%")
 */
export function hexToHSLString(hex: string): string {
  const [h, s, l] = chroma(hex).hsl();
  return `${Math.round(isNaN(h) ? 0 : h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
