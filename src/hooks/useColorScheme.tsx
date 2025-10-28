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
}

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

      // Apply all 20 colors as CSS variables
      Object.entries(COLOR_MAPPINGS).forEach(([key, config]) => {
        const colorValue = colorScheme[key as keyof ColorScheme];
        if (typeof colorValue === 'string' && colorValue.startsWith('#')) {
          const hsl = hexToHSL(colorValue);
          root.style.setProperty(config.cssVar, hsl);

          // Backwards-compatible aliases for older component usage
          switch (config.cssVar) {
            case '--scheme-cards-bg':
              root.style.setProperty('--scheme-card-bg', hsl);
              // Generic background fallback used in a few places
              root.style.setProperty('--scheme-bg', hsl);
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
    }
  }, [colorScheme]);

  return { colorScheme, mappings: COLOR_MAPPINGS };
}
