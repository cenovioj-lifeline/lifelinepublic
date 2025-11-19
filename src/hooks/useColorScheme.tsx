import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ColorScheme {
  id: string;
  name: string;
  description?: string;
  
  // Navigation colors (3)
  nav_bg_color: string;
  nav_text_color: string;
  nav_button_color: string;

  // Lifeline Display colors (7)
  ll_display_bg: string;
  ll_display_title_text: string;
  ll_entry_title_text: string;
  ll_entry_contributor_button: string;
  ll_graph_bg: string;
  ll_graph_positive: string;
  ll_graph_negative: string;

  // Cards colors (4)
  cards_bg: string;
  cards_border: string;
  cards_text: string;
  ch_actions_bg: string;

  // Character Actions colors (4)
  ch_actions_border: string;
  ch_actions_icon: string;
  ch_actions_text: string;
  ch_banner_text: string;

  // Awards colors (2)
  award_bg: string;
  award_border: string;

  // Global text (1)
  title_text: string;
}

function hexToHSL(hex: string): string {
  // Remove the # if present
  hex = hex.replace('#', '');
  
  // Convert hex to RGB
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
  
  // Convert to degrees and percentages
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  const lPercent = Math.round(l * 100);
  
  return `${h} ${s}% ${lPercent}%`;
}

export function useColorScheme(collectionSlug?: string) {
  const [colorScheme, setColorScheme] = useState<ColorScheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadColorScheme() {
      try {
        setLoading(true);
        setError(null);

        if (!collectionSlug) {
          setColorScheme(null);
          setLoading(false);
          return;
        }

        // Get collection ID from slug
        const { data: collection, error: collectionError } = await supabase
          .from('collections')
          .select('id, color_scheme_id')
          .eq('slug', collectionSlug)
          .single();

        if (collectionError) throw collectionError;
        if (!collection?.color_scheme_id) {
          setColorScheme(null);
          setLoading(false);
          return;
        }

        // Get color scheme
        const { data: scheme, error: schemeError } = await supabase
          .from('color_schemes')
          .select('*')
          .eq('id', collection.color_scheme_id)
          .single();

        if (schemeError) throw schemeError;

        setColorScheme(scheme);
      } catch (err) {
        console.error('Error loading color scheme:', err);
        setError(err instanceof Error ? err.message : 'Failed to load color scheme');
      } finally {
        setLoading(false);
      }
    }

    loadColorScheme();
  }, [collectionSlug]);

  // Apply color scheme to CSS variables when it changes
  useEffect(() => {
    if (!colorScheme) {
      // Remove all scheme variables when no scheme is active
      const root = document.documentElement;
      const schemeVars = [
        // Navigation
        '--scheme-nav-bg',
        '--scheme-nav-text',
        '--scheme-nav-button',
        // Lifeline Display
        '--scheme-ll-display-bg',
        '--scheme-ll-display-title-text',
        '--scheme-ll-entry-title-text',
        '--scheme-ll-entry-contributor-button',
        '--scheme-ll-graph-bg',
        '--scheme-ll-graph-positive',
        '--scheme-ll-graph-negative',
        // Cards
        '--scheme-cards-bg',
        '--scheme-cards-border',
        '--scheme-cards-text',
        '--scheme-ch-actions-bg',
        // Character Actions
        '--scheme-ch-actions-border',
        '--scheme-ch-actions-icon',
        '--scheme-ch-actions-text',
        '--scheme-ch-banner-text',
        // Awards
        '--scheme-award-bg',
        '--scheme-award-border',
        // Global
        '--scheme-title-text',
      ];
      
      schemeVars.forEach(varName => {
        root.style.removeProperty(varName);
      });
      return;
    }

    // Apply all color scheme variables
    const root = document.documentElement;
    
    // Navigation colors
    root.style.setProperty('--scheme-nav-bg', hexToHSL(colorScheme.nav_bg_color));
    root.style.setProperty('--scheme-nav-text', hexToHSL(colorScheme.nav_text_color));
    root.style.setProperty('--scheme-nav-button', hexToHSL(colorScheme.nav_button_color));

    // Lifeline Display colors
    root.style.setProperty('--scheme-ll-display-bg', hexToHSL(colorScheme.ll_display_bg));
    root.style.setProperty('--scheme-ll-display-title-text', hexToHSL(colorScheme.ll_display_title_text));
    root.style.setProperty('--scheme-ll-entry-title-text', hexToHSL(colorScheme.ll_entry_title_text));
    root.style.setProperty('--scheme-ll-entry-contributor-button', hexToHSL(colorScheme.ll_entry_contributor_button));
    root.style.setProperty('--scheme-ll-graph-bg', hexToHSL(colorScheme.ll_graph_bg));
    root.style.setProperty('--scheme-ll-graph-positive', hexToHSL(colorScheme.ll_graph_positive));
    root.style.setProperty('--scheme-ll-graph-negative', hexToHSL(colorScheme.ll_graph_negative));

    // Cards colors
    root.style.setProperty('--scheme-cards-bg', hexToHSL(colorScheme.cards_bg));
    root.style.setProperty('--scheme-cards-border', hexToHSL(colorScheme.cards_border));
    root.style.setProperty('--scheme-cards-text', hexToHSL(colorScheme.cards_text));
    root.style.setProperty('--scheme-ch-actions-bg', hexToHSL(colorScheme.ch_actions_bg));

    // Character Actions colors
    root.style.setProperty('--scheme-ch-actions-border', hexToHSL(colorScheme.ch_actions_border));
    root.style.setProperty('--scheme-ch-actions-icon', hexToHSL(colorScheme.ch_actions_icon));
    root.style.setProperty('--scheme-ch-actions-text', hexToHSL(colorScheme.ch_actions_text));
    root.style.setProperty('--scheme-ch-banner-text', hexToHSL(colorScheme.ch_banner_text));

    // Awards colors
    root.style.setProperty('--scheme-award-bg', hexToHSL(colorScheme.award_bg));
    root.style.setProperty('--scheme-award-border', hexToHSL(colorScheme.award_border));

    // Global text
    root.style.setProperty('--scheme-title-text', hexToHSL(colorScheme.title_text));

    // Bridge mapping: Connect Tailwind semantic colors to color scheme
    // This ensures pages using Tailwind utilities (bg-background, text-foreground, etc.)
    // automatically use the collection's color scheme instead of hardcoded defaults

    // Main page colors
    root.style.setProperty('--background', hexToHSL(colorScheme.cards_bg)); // Main content background
    root.style.setProperty('--foreground', hexToHSL(colorScheme.cards_text)); // Main content text

    // Card colors
    root.style.setProperty('--card', hexToHSL(colorScheme.cards_bg)); // Card backgrounds
    root.style.setProperty('--card-foreground', hexToHSL(colorScheme.cards_text)); // Card text

    // Border/divider colors
    root.style.setProperty('--border', hexToHSL(colorScheme.cards_border)); // Borders and dividers
    root.style.setProperty('--input', hexToHSL(colorScheme.cards_border)); // Input borders

    // Primary/accent colors (used for buttons, links, focus states)
    root.style.setProperty('--primary', hexToHSL(colorScheme.nav_button_color)); // Primary buttons, CTAs
    root.style.setProperty('--primary-foreground', hexToHSL(colorScheme.nav_text_color)); // Text on primary buttons
    root.style.setProperty('--ring', hexToHSL(colorScheme.nav_button_color)); // Focus rings

    // Secondary colors
    root.style.setProperty('--secondary', hexToHSL(colorScheme.ll_graph_positive)); // Secondary actions
    root.style.setProperty('--secondary-foreground', hexToHSL(colorScheme.cards_text)); // Text on secondary

    // Accent colors
    root.style.setProperty('--accent', hexToHSL(colorScheme.award_bg)); // Accent elements
    root.style.setProperty('--accent-foreground', hexToHSL(colorScheme.cards_text)); // Text on accent

    // Muted/subtle colors
    root.style.setProperty('--muted', hexToHSL(colorScheme.ll_graph_bg)); // Subtle backgrounds
    root.style.setProperty('--muted-foreground', hexToHSL(colorScheme.cards_text)); // Muted text

    // Destructive/error colors
    root.style.setProperty('--destructive', hexToHSL(colorScheme.ll_graph_negative)); // Error states
    root.style.setProperty('--destructive-foreground', hexToHSL(colorScheme.nav_text_color)); // Error text

    // Popover colors (modals, dropdowns, tooltips)
    root.style.setProperty('--popover', hexToHSL(colorScheme.cards_bg)); // Popover background
    root.style.setProperty('--popover-foreground', hexToHSL(colorScheme.cards_text)); // Popover text

  }, [colorScheme]);

  return { colorScheme, loading, error };
}
