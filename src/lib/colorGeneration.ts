/**
 * Color Generation System
 *
 * Generates a complete 20-color scheme from 2-4 primary colors.
 * Based on HSL color manipulation for harmonious variants.
 */

export interface ColorInput {
  primary: string;      // Main brand color (e.g., "#D4B996")
  secondary: string;    // Accent color (e.g., "#C97456")
  text?: string;        // Optional text color (auto-generated if not provided)
  background?: string;  // Optional background color (auto-generated if not provided)
}

export interface GeneratedColorScheme {
  // Navigation colors
  nav_bg_color: string;
  nav_text_color: string;
  nav_active_link_color: string;

  // Lifeline display colors
  lifeline_border_color: string;
  lifeline_bg_color: string;
  lifeline_text_color: string;
  lifeline_entry_header_bg: string;
  lifeline_entry_header_text: string;
  lifeline_entry_date_color: string;

  // Collection home colors
  collection_bg_color: string;
  collection_text_color: string;
  collection_card_bg: string;
  collection_card_text: string;
  collection_card_accent: string;

  // Card colors
  card_bg_color: string;
  card_border_color: string;
  card_text_color: string;

  // Award/Title colors
  award_bg: string;
  award_border: string;
  award_text: string;
}

interface HSL {
  h: number;  // 0-360
  s: number;  // 0-100
  l: number;  // 0-100
}

/**
 * Convert hex color to HSL
 */
export function hexToHSL(hex: string): HSL {
  // Remove # if present
  hex = hex.replace('#', '');

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert HSL to hex color
 */
export function hslToHex(hsl: HSL): string {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Adjust lightness of an HSL color
 */
export function adjustLightness(hsl: HSL, amount: number): HSL {
  return {
    h: hsl.h,
    s: hsl.s,
    l: Math.max(0, Math.min(100, hsl.l + amount)),
  };
}

/**
 * Adjust saturation of an HSL color
 */
export function adjustSaturation(hsl: HSL, amount: number): HSL {
  return {
    h: hsl.h,
    s: Math.max(0, Math.min(100, hsl.s + amount)),
    l: hsl.l,
  };
}

/**
 * Calculate relative luminance for WCAG contrast
 */
function getLuminance(hex: string): number {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const [rs, gs, bs] = [r, g, b].map(c => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Get contrasting text color (black or white) for a background
 */
export function getContrastingTextColor(backgroundColor: string): string {
  const whiteContrast = getContrastRatio(backgroundColor, '#FFFFFF');
  const blackContrast = getContrastRatio(backgroundColor, '#000000');

  // Return color with better contrast (WCAG AA requires 4.5:1 for normal text)
  return whiteContrast > blackContrast ? '#FFFFFF' : '#000000';
}

/**
 * Generate a neutral color based on primary hue
 */
function generateNeutral(primaryHSL: HSL, lightness: number, saturation: number = 10): HSL {
  return {
    h: primaryHSL.h,
    s: saturation,
    l: lightness,
  };
}

/**
 * Main color generation function
 * Takes 2-4 base colors and generates complete 20-color scheme
 */
export function generateColorScheme(input: ColorInput): GeneratedColorScheme {
  // Convert input colors to HSL
  const primaryHSL = hexToHSL(input.primary);
  const secondaryHSL = hexToHSL(input.secondary);

  // Generate variants
  const primaryLight = adjustLightness(primaryHSL, 25);
  const primaryDark = adjustLightness(primaryHSL, -20);
  const secondaryLight = adjustLightness(secondaryHSL, 25);
  const secondaryDark = adjustLightness(secondaryHSL, -15);

  // Generate neutral colors (desaturated primary hue)
  const neutralVeryLight = generateNeutral(primaryHSL, 97, 5);
  const neutralLight = generateNeutral(primaryHSL, 92, 8);
  const neutralMedium = generateNeutral(primaryHSL, 85, 12);
  const neutralDark = generateNeutral(primaryHSL, 70, 15);

  // Determine text color (use provided or auto-generate)
  const textColor = input.text || getContrastingTextColor(input.primary);

  // Determine background color (use provided or auto-generate as very light variant)
  const backgroundColor = input.background || hslToHex(neutralVeryLight);

  // Auto-generate contrasting text colors for different backgrounds
  const navTextColor = getContrastingTextColor(input.primary);
  const cardTextColor = getContrastingTextColor(backgroundColor);
  const awardTextColor = getContrastingTextColor(hslToHex(primaryLight));

  // Map to the 20-color structure
  return {
    // Navigation colors (use primary)
    nav_bg_color: input.primary,
    nav_text_color: navTextColor,
    nav_active_link_color: input.secondary,

    // Lifeline display colors
    lifeline_border_color: hslToHex(primaryDark),
    lifeline_bg_color: hslToHex(primaryLight),
    lifeline_text_color: textColor,
    lifeline_entry_header_bg: input.primary,
    lifeline_entry_header_text: navTextColor,
    lifeline_entry_date_color: hslToHex(neutralDark),

    // Collection home colors
    collection_bg_color: backgroundColor,
    collection_text_color: textColor,
    collection_card_bg: hslToHex(neutralVeryLight),
    collection_card_text: cardTextColor,
    collection_card_accent: input.secondary,

    // Card colors
    card_bg_color: '#FFFFFF',
    card_border_color: hslToHex(neutralMedium),
    card_text_color: textColor,

    // Award/Title colors
    award_bg: hslToHex(primaryLight),
    award_border: hslToHex(primaryDark),
    award_text: awardTextColor,
  };
}

/**
 * Preview function for testing color generation
 */
export function previewColorScheme(input: ColorInput): void {
  const scheme = generateColorScheme(input);
  console.log('Generated Color Scheme:', scheme);
  console.log('\nCSS Variables:');
  Object.entries(scheme).forEach(([key, value]) => {
    console.log(`--scheme-${key.replace(/_/g, '-')}: ${value};`);
  });
}
