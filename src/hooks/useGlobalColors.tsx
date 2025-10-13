import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Convert hex color to HSL format for CSS variables
function hexToHSL(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Convert to RGB
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

export function useGlobalColors() {
  const { data: colorSettings } = useQuery({
    queryKey: ["global-color-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lifeline_settings")
        .select("*");
      if (error) throw error;
      
      const settings: Record<string, string> = {};
      data?.forEach((s) => {
        settings[s.setting_key] = s.setting_value || "";
      });
      return settings;
    },
  });

  useEffect(() => {
    if (colorSettings) {
      // Apply colors as CSS variables to the root
      const root = document.documentElement;
      
      if (colorSettings.lifeline_bg_color) {
        root.style.setProperty('--global-bg', hexToHSL(colorSettings.lifeline_bg_color));
      }
      if (colorSettings.lifeline_text_color) {
        root.style.setProperty('--global-text', hexToHSL(colorSettings.lifeline_text_color));
      }
      if (colorSettings.lifeline_heading_color) {
        root.style.setProperty('--global-heading', hexToHSL(colorSettings.lifeline_heading_color));
      }
      if (colorSettings.lifeline_accent_color) {
        root.style.setProperty('--global-accent', hexToHSL(colorSettings.lifeline_accent_color));
      }
      if (colorSettings.lifeline_card_bg) {
        root.style.setProperty('--global-card-bg', hexToHSL(colorSettings.lifeline_card_bg));
      }
      if (colorSettings.lifeline_border_color) {
        root.style.setProperty('--global-border', hexToHSL(colorSettings.lifeline_border_color));
      }
      if (colorSettings.lifeline_timeline_positive) {
        root.style.setProperty('--global-positive', hexToHSL(colorSettings.lifeline_timeline_positive));
      }
      if (colorSettings.lifeline_timeline_negative) {
        root.style.setProperty('--global-negative', hexToHSL(colorSettings.lifeline_timeline_negative));
      }
      if (colorSettings.lifeline_timeline_neutral) {
        root.style.setProperty('--global-neutral', hexToHSL(colorSettings.lifeline_timeline_neutral));
      }
    }
  }, [colorSettings]);

  return colorSettings;
}
