/**
 * Color Generation Library
 * 
 * Provides functions to generate harmonious color schemes from a primary and secondary color.
 * Uses HSL color space for better control over lightness, saturation, and hue relationships.
 */

export interface HSL {
  h: number; // Hue: 0-360
  s: number; // Saturation: 0-100
  l: number; // Lightness: 0-100
}

export interface ColorInput {
  primary: string;      // Hex color for primary brand color
  secondary: string;    // Hex color for secondary/accent color
  text?: string;        // Optional: custom text color (auto-generated if not provided)
  background?: string;  // Optional: custom background color (auto-generated if not provided)
}

export interface GeneratedColorScheme {
  // Navigation (3 colors)
  nav_bg_color: string;
  nav_text_color: string;
  nav_active_link_color: string;

  // Lifeline Display (7 colors)
  ll_display_bg: string;
  ll_display_title_text: string;
  ll_entry_title_text: string;
  ll_entry_contributor_button: string;
  ll_graph_bg: string;
  ll_graph_positive: string;
  ll_graph_negative: string;

  // Cards (4 colors)
  cards_bg: string;
  cards_border: string;
  cards_text: string;
  ch_actions_bg: string;

  // Character Actions (4 colors)
  ch_actions_border: string;
  ch_actions_icon: string;
  ch_actions_text: string;
  ch_banner_text: string;

  // Awards (2 colors)
  award_bg: string;
  award_border: string;

  // Global Text (1 color)
  title_text: string;

  // Extra fields for preview/reference
  collection_bg_color: string;
  collection_card_bg: string;
  collection_card_text: string;
  collection_card_accent: string;
  lifeline_bg: string;
  lifeline_border: string;
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
    l: Math.round(l * 100)
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
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Adjust the lightness of an HSL color
 */
function adjustLightness(hsl: HSL, amount: number): string {
  const newL = Math.max(0, Math.min(100, hsl.l + amount));
  return hslToHex({ ...hsl, l: newL });
}

/**
 * Generate a neutral color from a base hue with specified lightness and saturation
 */
function generateNeutral(baseHsl: HSL, lightness: number, saturation: number): string {
  return hslToHex({ h: baseHsl.h, s: saturation, l: lightness });
}

/**
 * Determine if a color is light or dark
 */
function isLight(hex: string): boolean {
  const hsl = hexToHSL(hex);
  return hsl.l > 50;
}

/**
 * Get a contrasting text color (black or white) for a given background
 */
export function getContrastingTextColor(backgroundColor: string): string {
  return isLight(backgroundColor) ? '#2C1810' : '#FFFFFF';
}

/**
 * Generate a complete color scheme from primary and secondary colors
 */
export function generateColorScheme(input: ColorInput): GeneratedColorScheme {
  // Convert input colors to HSL
  const primaryHSL = hexToHSL(input.primary);
  const secondaryHSL = hexToHSL(input.secondary);

  // Generate variants of primary color
  const primaryLight = adjustLightness(primaryHSL, 25);
  const primaryDark = adjustLightness(primaryHSL, -20);
  const primaryVeryLight = adjustLightness(primaryHSL, 40);

  // Generate variants of secondary color
  const secondaryLight = adjustLightness(secondaryHSL, 25);
  const secondaryDark = adjustLightness(secondaryHSL, -15);

  // Generate neutral colors (desaturated primary hue)
  const neutralVeryLight = generateNeutral(primaryHSL, 97, 5);  // Nearly white
  const neutralLight = generateNeutral(primaryHSL, 92, 8);      // Light gray
  const neutralMedium = generateNeutral(primaryHSL, 85, 12);    // Medium gray
  const neutralDark = generateNeutral(primaryHSL, 70, 15);      // Dark gray
  const neutralVeryDark = generateNeutral(primaryHSL, 20, 10);  // Very dark

  // Determine text color (use provided or auto-generate)
  const textColor = input.text || getContrastingTextColor(input.primary);
  const backgroundColor = input.background || neutralVeryLight;

  // Determine nav text color based on nav background
  const navTextColor = getContrastingTextColor(input.primary);

  // Graph colors - positive (green-ish) and negative (red-ish)
  const graphPositive = '#566950'; // Muted green
  const graphNegative = '#982534'; // Muted red

  // Map to the 20-color structure
  return {
    // Navigation (3)
    nav_bg_color: input.primary,
    nav_text_color: navTextColor,
    nav_active_link_color: input.secondary,

    // Lifeline Display (7)
    ll_display_bg: primaryVeryLight,
    ll_display_title_text: textColor,
    ll_entry_title_text: textColor,
    ll_entry_contributor_button: primaryDark,
    ll_graph_bg: '#FFFFFF',
    ll_graph_positive: graphPositive,
    ll_graph_negative: graphNegative,

    // Cards (4)
    cards_bg: primaryVeryLight,
    cards_border: primaryDark,
    cards_text: textColor,
    ch_actions_bg: primaryVeryLight,

    // Character Actions (4)
    ch_actions_border: primaryDark,
    ch_actions_icon: textColor,
    ch_actions_text: textColor,
    ch_banner_text: navTextColor,

    // Awards (2)
    award_bg: input.secondary,
    award_border: primaryDark,

    // Global Text (1)
    title_text: textColor,

    // Extra fields for compatibility
    collection_bg_color: backgroundColor,
    collection_card_bg: primaryVeryLight,
    collection_card_text: textColor,
    collection_card_accent: input.secondary,
    lifeline_bg: primaryVeryLight,
    lifeline_border: primaryDark,
  };
}
