import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Color mapping with semantic labels showing where each color is used
export const COLOR_MAPPINGS = {
  // Color 1: Primary Container
  nav_bg_color: {
    label: "Color 1: Primary Container",
    uses: ["Nav-bar background", "LL-Display border", "LL Entry-Header"],
    cssVar: "--scheme-nav-bg",
  },
  // Color 2: Primary Text
  nav_text_color: {
    label: "Color 2: Primary Text",
    uses: ["Nav text color", "Default text"],
    cssVar: "--scheme-nav-text",
  },
  // Color 3: Interactive Elements
  nav_button_color: {
    label: "Color 3: Interactive Elements",
    uses: ["Nav button/icon color", "Action buttons"],
    cssVar: "--scheme-nav-button",
  },
  // Color 4: Overlay Text
  banner_text_color: {
    label: "Color 4: Overlay Text",
    uses: ["Banner text overlay", "Hero text"],
    cssVar: "--scheme-banner-text",
  },
  // Color 5: Surface Background
  actions_bg_color: {
    label: "Color 5: Surface Background",
    uses: ["Action card background", "Secondary surfaces"],
    cssVar: "--scheme-actions-bg",
  },
  // Color 6: Surface Border
  actions_border_color: {
    label: "Color 6: Surface Border",
    uses: ["Action card border", "Dividers"],
    cssVar: "--scheme-actions-border",
  },
  // Color 7: Icon Color
  actions_icon_color: {
    label: "Color 7: Icon Color",
    uses: ["Action card icons", "UI icons"],
    cssVar: "--scheme-actions-icon",
  },
  // Color 8: Secondary Text
  actions_text_color: {
    label: "Color 8: Secondary Text",
    uses: ["Action card text", "Body text"],
    cssVar: "--scheme-actions-text",
  },
  // Color 9: Card Background
  card_bg_color: {
    label: "Color 9: Card Background",
    uses: ["General card background", "Content containers"],
    cssVar: "--scheme-card-bg",
  },
  // Color 10: Card Border
  card_border_color: {
    label: "Color 10: Card Border",
    uses: ["General card borders", "Content dividers"],
    cssVar: "--scheme-card-border",
  },
  // Color 11: Card Text
  card_text_color: {
    label: "Color 11: Card Text",
    uses: ["General card text", "Content text"],
    cssVar: "--scheme-card-text",
  },
  // Color 12: Lifeline Border
  ll_display_border: {
    label: "Color 12: Lifeline Border",
    uses: ["Display container border", "Timeline borders"],
    cssVar: "--scheme-ll-display-border",
  },
  // Color 13: Lifeline Background
  ll_display_bg: {
    label: "Color 13: Lifeline Background",
    uses: ["Display background", "Timeline background"],
    cssVar: "--scheme-ll-display-bg",
  },
  // Color 14: Lifeline Title
  ll_display_title_text: {
    label: "Color 14: Lifeline Title",
    uses: ["Display title color", "Timeline headings"],
    cssVar: "--scheme-ll-display-title",
  },
  // Color 15: Positive Indicator
  ll_graph_positive: {
    label: "Color 15: Positive Indicator",
    uses: ["Positive score bars", "Success states"],
    cssVar: "--scheme-ll-graph-positive",
  },
  // Color 16: Negative Indicator
  ll_graph_negative: {
    label: "Color 16: Negative Indicator",
    uses: ["Negative score bars", "Error states"],
    cssVar: "--scheme-ll-graph-negative",
  },
  // Color 17: Graph Lines
  ll_graph_line: {
    label: "Color 17: Graph Lines",
    uses: ["Graph lines/scrollbar", "Timeline lines"],
    cssVar: "--scheme-ll-graph-line",
  },
  // Color 18: Entry Header
  ll_entry_header: {
    label: "Color 18: Entry Header",
    uses: ["Entry header background", "Section headers"],
    cssVar: "--scheme-ll-entry-header",
  },
  // Color 19: Navigation Button
  ll_entry_button: {
    label: "Color 19: Navigation Button",
    uses: ["Entry navigation buttons", "Primary actions"],
    cssVar: "--scheme-ll-entry-button",
  },
  // Color 20: Contributor Action
  ll_entry_contributor_button: {
    label: "Color 20: Contributor Action",
    uses: ["Contribute button", "Special actions"],
    cssVar: "--scheme-ll-entry-contributor",
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
  banner_text_color: string;
  actions_bg_color: string;
  actions_border_color: string;
  actions_icon_color: string;
  actions_text_color: string;
  card_bg_color: string;
  card_border_color: string;
  card_text_color: string;
  ll_display_border: string;
  ll_display_bg: string;
  ll_display_title_text: string;
  ll_graph_positive: string;
  ll_graph_negative: string;
  ll_graph_line: string;
  ll_entry_header: string;
  ll_entry_button: string;
  ll_entry_contributor_button: string;
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
          root.style.setProperty(config.cssVar, hexToHSL(colorValue));
        }
      });
    }
  }, [colorScheme]);

  return { colorScheme, mappings: COLOR_MAPPINGS };
}
