/**
 * Rewrites Supabase Storage public URLs to the on-the-fly image render endpoint.
 *
 * Raw:       .../storage/v1/object/public/<bucket>/<path>
 * Rendered:  .../storage/v1/render/image/public/<bucket>/<path>?width=W&quality=Q&resize=contain
 *
 * The render endpoint is a CDN-cached image transformer (Supabase Pro). It resizes,
 * re-encodes, and serves over the same CDN. Typical byte savings: 60-90%.
 *
 * IMPORTANT: resize=contain is required. Without it, Supabase only scales the width
 * dimension and preserves the original height, producing a distorted aspect ratio.
 * Example: a 1920×1080 image with ?width=900 returns 900×1080 (wrong) instead of
 * 900×506 (correct). resize=contain forces proportional scaling.
 *
 * Non-Supabase URLs (e.g. external images) are returned unchanged.
 * Already-rendered URLs are returned unchanged (idempotent).
 * Null/undefined is returned unchanged.
 */

export type ImagePreset = "card" | "entry" | "hero" | "thumb" | "lqip";

const PRESET_WIDTHS: Record<ImagePreset, number> = {
  thumb: 120,   // small thumbnails (feed tiles, list rows)
  card: 480,    // grid/list cards
  entry: 900,   // main entry viewer image
  hero: 1600,   // hero / collection cover
  lqip: 24,     // tiny placeholder (blurred via CSS)
};

const DEFAULT_QUALITY = 75;

export interface OptimizeOptions {
  width?: number;
  quality?: number;
  preset?: ImagePreset;
}

export function optimizeImageUrl(
  src: string | null | undefined,
  opts: OptimizeOptions = {},
): string | undefined {
  if (!src) return undefined;

  // Idempotent: already on the render endpoint
  if (src.includes("/storage/v1/render/image/public/")) return src;

  // Only rewrite Supabase storage object URLs
  const marker = "/storage/v1/object/public/";
  const idx = src.indexOf(marker);
  if (idx === -1) return src;

  const width =
    opts.width ??
    (opts.preset ? PRESET_WIDTHS[opts.preset] : PRESET_WIDTHS.entry);
  const quality = opts.quality ?? DEFAULT_QUALITY;

  const base = src.slice(0, idx) + "/storage/v1/render/image/public/";
  const pathAndQuery = src.slice(idx + marker.length);

  // Preserve any existing querystring the original URL might carry
  const [path, existingQs] = pathAndQuery.split("?");
  const params = new URLSearchParams(existingQs || "");
  params.set("width", String(width));
  params.set("quality", String(quality));
  // Without resize=contain, Supabase scales only the width and preserves the
  // original height, distorting the aspect ratio and breaking CroppedImage math.
  params.set("resize", "contain");

  return `${base}${path}?${params.toString()}`;
}

/**
 * Fire-and-forget preload of an image. Returns the HTMLImageElement so callers
 * can hold a ref if they want to cancel/track, or ignore it.
 */
export function preloadImage(
  src: string | null | undefined,
  opts: OptimizeOptions = {},
): HTMLImageElement | undefined {
  const url = optimizeImageUrl(src, opts);
  if (!url || typeof window === "undefined") return undefined;
  const img = new Image();
  img.decoding = "async";
  img.src = url;
  return img;
}
