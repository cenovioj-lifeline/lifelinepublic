import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Color mapping aligned with user's reference images
export const COLOR_MAPPINGS = {
  // Color 1: Nav-bar background (also used for LL Display border, LL Entry Header)
  nav_bg_color: {
    label: "Color 1: Nav-bar Background",
    uses: ["Nav-bar background", "LL Display border", "LL Entry Header"],
    cssVar: "--scheme-nav-bg",
  },
  // Color 2: Nav text color (also used for LL Entry Header text)
  nav_text_color: {
    label: "Color 2: Nav-text Color",
    uses: ["Nav text color", "LL Entry Header text color"],
    cssVar: "--scheme-nav-text",
  },
  // Color 3: Nav button color (also used for various icons and buttons)
  nav_button_color: {
    label: "Color 3: Nav-button Color",
    uses: ["Nav button color", "Award Heading icon", "Award icon", "LL Entry button"],
    cssVar: "--scheme-nav-button",
  },
  // Color 4: LL Display background
  ll_display_bg: {
    label: "Color 4: LL Display-background",
    uses: ["Lifeline Display background", "Timeline background"],
    cssVar: "--scheme-ll-display-bg",
  },
  // Color 5: LL Graph Positive
  ll_graph_positive: {
    label: "Color 5: LL Graph-Positive",
    uses: ["Positive score bars", "Success indicators"],
    cssVar: "--scheme-ll-graph-positive",
  },
  // Color 6: LL Graph Negative
  ll_graph_negative: {
    label: "Color 6: LL Graph-Negative",
    uses: ["Negative score bars", "Error indicators"],
    cssVar: "--scheme-ll-graph-negative",
  },
  // Color 7: LL Entry Title Text Color
  ll_entry_title_text: {
    label: "Color 7: LL Entry-Title Text Color",
    uses: ["Entry title text", "Entry headings"],
    cssVar: "--scheme-ll-entry-title",
  },
  // Color 8: LL Entry Contributor button
  ll_entry_contributor_button: {
    label: "Color 8: LL Entry-Contributor menu button",
    uses: ["Contribute button", "Special action buttons"],
    cssVar: "--scheme-ll-entry-contributor",
  },
  // Color 9: LL Entry Background / Graph Background
  ll_graph_bg: {
    label: "Color 9: LL Entry/Graph-Background",
    uses: ["Graph background", "Entry background", "Timeline background"],
    cssVar: "--scheme-ll-graph-bg",
  },
  // Color 10: CH Banner Text color
  ch_banner_text: {
    label: "Color 10: CH Banner-Text color",
    uses: ["Banner text overlay", "Hero text"],
    cssVar: "--scheme-ch-banner-text",
  },
  // Color 11: CH Actions Background
  ch_actions_bg: {
    label: "Color 11: CH Actions-Background",
    uses: ["Action card background", "Button backgrounds"],
    cssVar: "--scheme-ch-actions-bg",
  },
  // Color 12: CH Actions Border
  ch_actions_border: {
    label: "Color 12: CH Actions-Border",
    uses: ["Action card border", "Button borders"],
    cssVar: "--scheme-ch-actions-border",
  },
  // Color 13: CH Actions Icon color
  ch_actions_icon: {
    label: "Color 13: CH Actions-Icon color",
    uses: ["Action card icons", "Button icons"],
    cssVar: "--scheme-ch-actions-icon",
  },
  // Color 14: CH Actions Text color
  ch_actions_text: {
    label: "Color 14: CH Actions-Text color",
    uses: ["Action card text", "Button text"],
    cssVar: "--scheme-ch-actions-text",
  },
  // Color 15: Cards Background
  cards_bg: {
    label: "Color 15: Cards-Background",
    uses: ["Card background", "Content containers"],
    cssVar: "--scheme-cards-bg",
  },
  // Color 16: Cards Border
  cards_border: {
    label: "Color 16: Cards-Border",
    uses: ["Card borders", "Content dividers"],
    cssVar: "--scheme-cards-border",
  },
  // Color 17: Cards Text
  cards_text: {
    label: "Color 17: Cards-Text",
    uses: ["Card text", "Content text"],
    cssVar: "--scheme-cards-text",
  },
  // Color 18: Award Heading/Title Text color (also LL Display Title)
  title_text: {
    label: "Color 18: Award Heading/Title Text color",
    uses: ["Award Heading text", "Award Title text", "LL Display Title text"],
    cssVar: "--scheme-title-text",
  },
  // Color 19: Award Background
  award_bg: {
    label: "Color 19: Award-Background",
    uses: ["Award card background", "Result background"],
    cssVar: "--scheme-award-bg",
  },
  // Color 20: Award Border
  award_border: {
    label: "Color 20: Award-Border",
    uses: ["Award card border", "Result borders"],
    cssVar: "--scheme-award-border",
  },
  // Color 21: Award Category Header Background
  award_category_bg: {
    label: "Color 21: Award Category Header Background",
    uses: ["Award category header row", "Collapsible trigger background"],
    cssVar: "--scheme-award-category-bg",
  },
  // Color 22: Award Item Background
  award_item_bg: {
    label: "Color 22: Award Item Background",
    uses: ["Individual award entries", "Award content area"],
    cssVar: "--scheme-award-item-bg",
  },
  // Color 23: Award Text
  award_text: {
    label: "Color 23: Award Text",
    uses: ["Award titles", "Winner names", "Award descriptions"],
    cssVar: "--scheme-award-text",
  },
  // Color 24: Page Background
  page_bg: {
    label: "Color 24: Page Background",
    uses: ["Main page background", "Body background"],
    cssVar: "--scheme-page-bg",
  },
  // Color 25: Profile Text
  profile_text: {
    label: "Color 25: Profile Text",
    uses: ["Profile section headings", "Page-level headings on profile pages"],
    cssVar: "--scheme-profile-text",
  },
  // Color 26: Profile Label Text
  profile_label_text: {
    label: "Color 26: Profile Label Text",
    uses: ["Lifeline card titles", "Award card text", "Quote text", "Text inside nested cards"],
    cssVar: "--scheme-profile-label-text",
  },
  // Color 27: Filter Controls Text
  filter_controls_text: {
    label: "Color 27: Filter Controls Text",
    uses: ["Search input text", "Dropdown text", "Pagination buttons"],
    cssVar: "--scheme-filter-controls-text",
  },
  // Color 28: Light Text (for dark backgrounds)
  light_text_color: {
    label: "Color 28: Light Text Color",
    uses: ["Text on dark backgrounds", "Guaranteed readable on dark surfaces"],
    cssVar: "--scheme-light-text",
  },
  // Color 29: Dark Text (for light backgrounds)
  dark_text_color: {
    label: "Color 29: Dark Text Color",
    uses: ["Text on light backgrounds", "Guaranteed readable on light surfaces"],
    cssVar: "--scheme-dark-text",
  },
  // Color 30: Person Name Accent
  person_name_accent: {
    label: "Color 30: Person Name Accent",
    uses: ["Person name on lifeline cards", "Name accent in lifeline headers"],
    cssVar: "--scheme-person-name-accent",
  },
} as const;

// Convert hex color to HSL format for CSS variables
function hexToHSL(hex: string): string {
  hex = hex.replace('#', '');
  
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);
  
  return `${h} ${s}% ${l}%`;
}

interface ColorScheme {
  id: string;
  name: string;
  description?: string;
  is_default: boolean;
  nav_bg_color: string;
  nav_text_color: string;
  nav_button_color: string;
  ll_display_bg: string;
  ll_graph_positive: string;
  ll_graph_negative: string;
  ll_entry_title_text: string;
  ll_entry_contributor_button: string;
  ll_graph_bg: string;
  ch_banner_text: string;
  ch_actions_bg: string;
  ch_actions_border: string;
  ch_actions_icon: string;
  ch_actions_text: string;
  cards_bg: string;
  cards_border: string;
  cards_text: string;
  title_text: string;
  award_bg: string;
  award_border: string;
  // NEW fields
  page_bg?: string;
  award_category_bg?: string;
  award_item_bg?: string;
  award_text?: string;
  profile_text?: string;
  profile_label_text?: string;
  filter_controls_text?: string;
  // Contrast-aware text colors
  light_text_color?: string;
  dark_text_color?: string;
  // Person name accent
  person_name_accent?: string;
}

// Default values for new fields (fallback if not set in DB)
const NEW_FIELD_DEFAULTS = {
  page_bg: '#f4e7d7',
  award_category_bg: '#f4e7d7',
  award_item_bg: '#ffffff',
  award_text: '#352d28',
  profile_text: '#352d28',
  profile_label_text: '#352d28',
  filter_controls_text: '#1f2937',
  light_text_color: '#ffffff',
  dark_text_color: '#1f2937',
  person_name_accent: '#4a9eff',
};

export function useColorScheme(collectionId?: string) {
  const { data: colorScheme } = useQuery({
    queryKey: ["color-scheme", collectionId],
    queryFn: async () => {
      if (collectionId) {
        // Try to get collection's specific color scheme
        const { data: collection } = await supabase
          .from("collections")
          .select("color_scheme_id")
          .eq("id", collectionId)
          .single();

        if (collection?.color_scheme_id) {
          const { data: scheme } = await supabase
            .from("color_schemes")
            .select("*")
            .eq("id", collection.color_scheme_id)
            .single();
          
          if (scheme) return scheme as ColorScheme;
        }
      }

      // Fallback to default color scheme
      const { data: defaultScheme } = await supabase
        .from("color_schemes")
        .select("*")
        .eq("is_default", true)
        .single();

      return defaultScheme as ColorScheme;
    },
  });

  useEffect(() => {
    if (colorScheme) {
      const root = document.documentElement;

      // Apply all colors as CSS variables (including new fields)
      Object.entries(COLOR_MAPPINGS).forEach(([key, config]) => {
        let colorValue = colorScheme[key as keyof ColorScheme];

        // Special case: person_name_accent derives from nav_button_color for palette harmony
        // This ensures person names (e.g., "ARYA STARK") use each collection's accent color
        // instead of a static blue that clashes with warm/neutral palettes
        if (!colorValue && key === 'person_name_accent') {
          colorValue = colorScheme.nav_button_color;
        }
        // Use defaults for other new fields if not set
        else if (!colorValue && key in NEW_FIELD_DEFAULTS) {
          colorValue = NEW_FIELD_DEFAULTS[key as keyof typeof NEW_FIELD_DEFAULTS];
        }
        
        if (typeof colorValue === 'string' && colorValue.startsWith('#')) {
          const hsl = hexToHSL(colorValue);
          root.style.setProperty(config.cssVar, hsl);

          // Backwards-compatible aliases for older component usage
          switch (config.cssVar) {
            case '--scheme-cards-bg':
              root.style.setProperty('--scheme-card-bg', hsl);
              break;
            case '--scheme-cards-border':
              root.style.setProperty('--scheme-card-border', hsl);
              break;
            case '--scheme-cards-text':
              root.style.setProperty('--scheme-card-text', hsl);
              break;
            case '--scheme-ch-actions-bg':
              root.style.setProperty('--scheme-actions-bg', hsl);
              break;
            case '--scheme-ch-actions-border':
              root.style.setProperty('--scheme-actions-border', hsl);
              break;
            case '--scheme-ch-actions-icon':
              root.style.setProperty('--scheme-actions-icon', hsl);
              break;
            case '--scheme-ch-actions-text':
              root.style.setProperty('--scheme-actions-text', hsl);
              break;
          }
        }
      });

      // Bridge mapping: Connect Tailwind semantic colors to color scheme
      // This ensures pages using Tailwind utilities (bg-background, text-foreground, etc.)
      // automatically use the collection's color scheme instead of hardcoded defaults

      // Get the contrast-aware text colors (these are the KEY fix!)
      const lightText = colorScheme.light_text_color || NEW_FIELD_DEFAULTS.light_text_color;
      const darkText = colorScheme.dark_text_color || NEW_FIELD_DEFAULTS.dark_text_color;

      // Main page colors - NOW USES page_bg explicitly!
      const pageBg = colorScheme.page_bg || NEW_FIELD_DEFAULTS.page_bg;
      root.style.setProperty('--background', hexToHSL(pageBg)); // Page background
      // CRITICAL FIX: Use dark_text_color for --foreground since page background is typically light
      root.style.setProperty('--foreground', hexToHSL(darkText)); // Main content text - GUARANTEED READABLE

      // Card colors
      root.style.setProperty('--card', hexToHSL(colorScheme.cards_bg)); // Card backgrounds
      root.style.setProperty('--card-foreground', hexToHSL(colorScheme.cards_text)); // Card text (can be specific)

      // Border/divider colors
      root.style.setProperty('--border', hexToHSL(colorScheme.cards_border)); // Borders and dividers
      root.style.setProperty('--input', hexToHSL(colorScheme.cards_border)); // Input borders

      // Primary/accent colors (used for buttons, links, focus states)
      root.style.setProperty('--primary', hexToHSL(colorScheme.nav_button_color)); // Primary buttons, CTAs
      root.style.setProperty('--primary-foreground', hexToHSL(lightText)); // Text on primary buttons (typically dark bg)
      root.style.setProperty('--ring', hexToHSL(colorScheme.nav_button_color)); // Focus rings

      // Secondary colors
      root.style.setProperty('--secondary', hexToHSL(colorScheme.ll_graph_positive)); // Secondary actions
      root.style.setProperty('--secondary-foreground', hexToHSL(lightText)); // Text on secondary (typically dark bg)

      // Accent colors
      root.style.setProperty('--accent', hexToHSL(colorScheme.award_bg)); // Accent elements
      root.style.setProperty('--accent-foreground', hexToHSL(darkText)); // Text on accent

      // Muted/subtle colors
      root.style.setProperty('--muted', hexToHSL(colorScheme.ll_graph_bg)); // Subtle backgrounds
      root.style.setProperty('--muted-foreground', hexToHSL(darkText)); // Muted text - GUARANTEED READABLE

      // Destructive/error colors
      root.style.setProperty('--destructive', hexToHSL(colorScheme.ll_graph_negative)); // Error states
      root.style.setProperty('--destructive-foreground', hexToHSL(lightText)); // Error text (on red bg)

      // Popover colors (modals, dropdowns, tooltips)
      root.style.setProperty('--popover', hexToHSL(colorScheme.cards_bg)); // Popover background
      root.style.setProperty('--popover-foreground', hexToHSL(colorScheme.cards_text)); // Popover text
    }
  }, [colorScheme]);

  return { colorScheme, mappings: COLOR_MAPPINGS };
}
