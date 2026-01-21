import { useState, useEffect } from "react";

interface InlineSvgIconProps {
  url: string;
  className?: string;
}

/**
 * Fetches an SVG from a URL and renders it inline with all fill colors
 * replaced by currentColor, allowing the SVG to inherit the theme color.
 */
export function InlineSvgIcon({ url, className }: InlineSvgIconProps) {
  const [svgContent, setSvgContent] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;

    fetch(url)
      .then((res) => res.text())
      .then((svg) => {
        // Replace all fill colors with currentColor for theme consistency
        // This handles both fill="color" attributes and fill:color in style
        let modified = svg
          .replace(/fill="(?!none)[^"]*"/gi, 'fill="currentColor"')
          .replace(/fill:\s*#[0-9a-fA-F]+/gi, "fill:currentColor")
          .replace(/fill:\s*rgb\([^)]+\)/gi, "fill:currentColor")
          .replace(/fill:\s*rgba\([^)]+\)/gi, "fill:currentColor");

        // Also handle stroke colors if needed
        modified = modified
          .replace(/stroke="(?!none)[^"]*"/gi, 'stroke="currentColor"')
          .replace(/stroke:\s*#[0-9a-fA-F]+/gi, "stroke:currentColor");

        // Normalize SVG dimensions to fill the container
        modified = modified
          .replace(/(<svg[^>]*)\s+width="[^"]*"/gi, '$1')
          .replace(/(<svg[^>]*)\s+height="[^"]*"/gi, '$1')
          .replace(/<svg/i, '<svg width="100%" height="100%"');

        setSvgContent(modified);
      })
      .catch((err) => {
        console.error("Failed to load SVG:", err);
        setSvgContent(null);
      });
  }, [url]);

  if (!svgContent) {
    return null;
  }

  return (
    <span
      className={className}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}
