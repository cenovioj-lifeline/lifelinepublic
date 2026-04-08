import { useRef, useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { optimizeImageUrl, type ImagePreset } from '@/lib/imageUrl';

interface CroppedImageProps {
  src?: string | null;
  alt?: string;
  centerX?: number;  // 0-100, center of crop as % of image width
  centerY?: number;  // 0-100, center of crop as % of image height
  scale?: number;    // 1 = object-cover baseline zoom
  className?: string;
  fallback?: React.ReactNode;
  fallbackClassName?: string;
  /** Image transform preset (thumb/card/entry/hero). Defaults to 'entry'. */
  preset?: ImagePreset;
  /** Explicit render width in px. Overrides preset. */
  width?: number;
  /** If true, sets fetchpriority="high" and eager loading (for above-the-fold images). */
  priority?: boolean;
}

/**
 * Renders a cropped image using absolute positioning math.
 *
 * The saved crop values (centerX, centerY, scale) represent:
 * - centerX/Y: the point in the original image (as %) that should appear
 *   at the center of the container
 * - scale: zoom level relative to object-cover baseline (1 = same as object-cover)
 *
 * This replaces the broken objectPosition + transform:scale() approach,
 * which used two incompatible coordinate systems.
 */
export function CroppedImage({
  src,
  alt = '',
  centerX = 50,
  centerY = 50,
  scale = 1,
  className,
  fallback,
  fallbackClassName,
  preset = 'entry',
  width,
  priority = false,
}: CroppedImageProps) {
  const optimizedSrc = useMemo(
    () => optimizeImageUrl(src, { preset, width }),
    [src, preset, width],
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [imgStyle, setImgStyle] = useState<React.CSSProperties>({});

  const computeStyle = useCallback((
    nw: number, nh: number, cw: number, ch: number
  ): React.CSSProperties => {
    if (cw === 0 || ch === 0 || nw === 0 || nh === 0) {
      return { width: '100%', height: '100%', objectFit: 'cover' as const };
    }

    const imgR = nw / nh;
    const contR = cw / ch;

    // Base size: what object-cover would use (image scaled to fill container)
    let bw: number, bh: number;
    if (imgR > contR) {
      // Image wider than container: height fills, width overflows
      bh = ch;
      bw = ch * imgR;
    } else {
      // Image taller: width fills, height overflows
      bw = cw;
      bh = cw / imgR;
    }

    // Apply scale (zoom in from the baseline)
    const dw = bw * scale;
    const dh = bh * scale;

    // Position so (centerX%, centerY%) of image is at container center
    const left = cw / 2 - (centerX / 100) * dw;
    const top = ch / 2 - (centerY / 100) * dh;

    return {
      position: 'absolute' as const,
      width: dw,
      height: dh,
      left,
      top,
      maxWidth: 'none',
    };
  }, [centerX, centerY, scale]);

  const handleLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const container = containerRef.current;
    if (!container) return;

    const style = computeStyle(
      img.naturalWidth, img.naturalHeight,
      container.clientWidth, container.clientHeight
    );
    setImgStyle(style);
    setReady(true);
  }, [computeStyle]);

  const showErrorFallback = (!src || error) && fallback;
  const showSkeleton = !!src && !error && !ready;

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden bg-muted/40', className)}
    >
      {optimizedSrc && !error && (
        <img
          src={optimizedSrc}
          alt={alt}
          style={{
            ...imgStyle,
            // Hide until positioning is computed to prevent flash
            opacity: ready ? 1 : 0,
            transition: 'opacity 0.15s ease-out',
          }}
          onLoad={handleLoad}
          onError={() => setError(true)}
          draggable={false}
          decoding="async"
          loading={priority ? 'eager' : 'lazy'}
          // @ts-expect-error - fetchpriority is valid HTML but not yet in React's DOM types
          fetchpriority={priority ? 'high' : 'auto'}
        />
      )}
      {showSkeleton && (
        <div
          className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted/50 to-muted/20"
          aria-hidden="true"
        />
      )}
      {showErrorFallback && (
        <div className={cn(
          'absolute inset-0 flex items-center justify-center',
          fallbackClassName
        )}>
          {fallback}
        </div>
      )}
    </div>
  );
}
