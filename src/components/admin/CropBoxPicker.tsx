/**
 * CropBoxPicker Component
 *
 * Intuitive image cropping with a draggable/resizable crop box.
 * The user moves and resizes a box OVER the image to select the crop area.
 *
 * - Smaller box = tighter crop (that portion fills the display frame)
 * - Larger box = wider view (more context visible)
 * - Drag box = select which part of the image to show
 * - Box maintains specified aspect ratio
 *
 * Supported aspect ratios:
 * - 16/9 (card view)
 * - 1/1 (avatar - circular)
 * - 3/1 (banner)
 * - 2/3 (cover)
 *
 * When at max size, shows which dimension is constraining:
 * - Height-limited: "circle touches top and bottom edges"
 * - Width-limited: "circle touches left and right edges"
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RotateCcw, Maximize2, AlertCircle } from 'lucide-react';

// ========================================
// TYPES
// ========================================

interface CropBoxPickerProps {
  imageUrl: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCropComplete: (crop: CropData) => void;
  title?: string;
  aspectRatio?: number; // default 16/9
}

export interface CropData {
  // All values as percentages (0-100) of the original image
  x: number;      // Left edge of crop box
  y: number;      // Top edge of crop box
  width: number;  // Width of crop box
  height: number; // Height of crop box
}

// ========================================
// HELPERS
// ========================================

const getAspectRatioLabel = (ratio: number): string => {
  // Common ratios
  if (Math.abs(ratio - 16/9) < 0.01) return '16:9';
  if (Math.abs(ratio - 1) < 0.01) return '1:1';
  if (Math.abs(ratio - 3) < 0.01) return '3:1';
  if (Math.abs(ratio - 2/3) < 0.01) return '2:3';
  if (Math.abs(ratio - 4/3) < 0.01) return '4:3';
  // Fallback
  return `${ratio.toFixed(2)}:1`;
};

const getViewTypeDescription = (ratio: number): string => {
  if (Math.abs(ratio - 16/9) < 0.01) return 'card view';
  if (Math.abs(ratio - 1) < 0.01) return 'avatar';
  if (Math.abs(ratio - 3) < 0.01) return 'banner';
  if (Math.abs(ratio - 2/3) < 0.01) return 'cover';
  return 'display';
};

// Get user-friendly message explaining the constraint
const getConstraintMessage = (
  limitingDimension: 'width' | 'height' | 'both',
  isAvatar: boolean
): string => {
  if (limitingDimension === 'both') {
    return 'Box fills the entire image.';
  }

  const cropType = isAvatar ? 'circle' : 'box';

  if (limitingDimension === 'height') {
    return `At max size — ${cropType} touches top and bottom edges. Image is wider than needed for this crop shape.`;
  } else {
    return `At max size — ${cropType} touches left and right edges. Image is taller than needed for this crop shape.`;
  }
};

// ========================================
// COMPONENT
// ========================================

export const CropBoxPicker = ({
  imageUrl,
  open,
  onOpenChange,
  onCropComplete,
  title = "Crop Image",
  aspectRatio = 16 / 9
}: CropBoxPickerProps) => {
  // Container and image refs
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Image dimensions (natural size)
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  // Displayed dimensions (scaled to fit container)
  const [displayDimensions, setDisplayDimensions] = useState({ width: 0, height: 0 });

  // Crop box state (in pixels relative to displayed image)
  const [cropBox, setCropBox] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [boxStart, setBoxStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Derived values
  const isAvatar = Math.abs(aspectRatio - 1) < 0.01;
  const aspectLabel = getAspectRatioLabel(aspectRatio);
  const viewTypeDesc = getViewTypeDescription(aspectRatio);

  // Calculate maximum possible crop box dimensions AND which dimension is limiting
  const { maxCropBox, limitingDimension } = useMemo(() => {
    if (displayDimensions.width === 0 || displayDimensions.height === 0) {
      return { maxCropBox: { width: 0, height: 0 }, limitingDimension: 'both' as const };
    }

    // Max width is constrained by image width
    // Max height is constrained by image height
    // We need to find the largest box that fits within both constraints while maintaining aspect ratio

    const maxWidthByWidth = displayDimensions.width;
    const maxHeightByWidth = maxWidthByWidth / aspectRatio;

    const maxHeightByHeight = displayDimensions.height;
    const maxWidthByHeight = maxHeightByHeight * aspectRatio;

    // Check if both dimensions would give the same result (within tolerance)
    const tolerance = 2;
    if (Math.abs(maxHeightByWidth - displayDimensions.height) < tolerance) {
      return {
        maxCropBox: { width: maxWidthByWidth, height: maxHeightByWidth },
        limitingDimension: 'both' as const
      };
    }

    // Use the smaller constraint and track which dimension is limiting
    if (maxHeightByWidth <= displayDimensions.height) {
      // Width is the constraint (box fills width, doesn't reach top/bottom)
      return {
        maxCropBox: { width: maxWidthByWidth, height: maxHeightByWidth },
        limitingDimension: 'width' as const
      };
    } else {
      // Height is the constraint (box fills height, doesn't reach left/right)
      return {
        maxCropBox: { width: maxWidthByHeight, height: maxHeightByHeight },
        limitingDimension: 'height' as const
      };
    }
  }, [displayDimensions.width, displayDimensions.height, aspectRatio]);

  // Check if current crop box is at maximum size (within 2px tolerance)
  const isAtMaxSize = useMemo(() => {
    if (maxCropBox.width === 0) return false;
    const tolerance = 2;
    return (
      Math.abs(cropBox.width - maxCropBox.width) < tolerance &&
      Math.abs(cropBox.height - maxCropBox.height) < tolerance
    );
  }, [cropBox.width, cropBox.height, maxCropBox.width, maxCropBox.height]);

  // Initialize crop box when image loads
  const handleImageLoad = useCallback(() => {
    if (!imageRef.current || !containerRef.current) return;

    const img = imageRef.current;
    const container = containerRef.current;

    // Get natural image dimensions
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    setImageDimensions({ width: naturalWidth, height: naturalHeight });

    // Calculate displayed dimensions (fit within container)
    const containerWidth = container.clientWidth;
    const maxHeight = 500; // Max height for the editing area

    let displayWidth = containerWidth;
    let displayHeight = (containerWidth / naturalWidth) * naturalHeight;

    if (displayHeight > maxHeight) {
      displayHeight = maxHeight;
      displayWidth = (maxHeight / naturalHeight) * naturalWidth;
    }

    setDisplayDimensions({ width: displayWidth, height: displayHeight });

    // Initialize crop box to center, covering 60% of the image width
    const initialWidth = displayWidth * 0.6;
    const initialHeight = initialWidth / aspectRatio;
    const initialX = (displayWidth - initialWidth) / 2;
    const initialY = (displayHeight - initialHeight) / 2;

    setCropBox({
      x: initialX,
      y: initialY,
      width: initialWidth,
      height: initialHeight
    });
  }, [aspectRatio]);

  // Reset when modal opens
  useEffect(() => {
    if (open && imageRef.current && imageRef.current.complete) {
      handleImageLoad();
    }
  }, [open, handleImageLoad]);

  // Mouse move handler
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging && !isResizing) return;
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDragging) {
      // Move the crop box
      const deltaX = mouseX - dragStart.x;
      const deltaY = mouseY - dragStart.y;

      let newX = boxStart.x + deltaX;
      let newY = boxStart.y + deltaY;

      // Constrain to image bounds
      newX = Math.max(0, Math.min(newX, displayDimensions.width - cropBox.width));
      newY = Math.max(0, Math.min(newY, displayDimensions.height - cropBox.height));

      setCropBox(prev => ({ ...prev, x: newX, y: newY }));
    } else if (isResizing && resizeHandle) {
      // Resize the crop box (maintaining aspect ratio)
      const deltaX = mouseX - dragStart.x;
      const deltaY = mouseY - dragStart.y;

      let newWidth = boxStart.width;
      let newHeight = boxStart.height;
      let newX = boxStart.x;
      let newY = boxStart.y;

      // Calculate new size based on which handle is being dragged
      if (resizeHandle.includes('e')) {
        newWidth = Math.max(50, boxStart.width + deltaX);
      }
      if (resizeHandle.includes('w')) {
        newWidth = Math.max(50, boxStart.width - deltaX);
        newX = boxStart.x + (boxStart.width - newWidth);
      }
      if (resizeHandle.includes('s')) {
        newHeight = Math.max(50, boxStart.height + deltaY);
      }
      if (resizeHandle.includes('n')) {
        newHeight = Math.max(50, boxStart.height - deltaY);
        newY = boxStart.y + (boxStart.height - newHeight);
      }

      // Maintain aspect ratio - use width as primary
      if (resizeHandle.includes('e') || resizeHandle.includes('w')) {
        newHeight = newWidth / aspectRatio;
        if (resizeHandle.includes('n')) {
          newY = boxStart.y + boxStart.height - newHeight;
        }
      } else {
        newWidth = newHeight * aspectRatio;
        if (resizeHandle.includes('w')) {
          newX = boxStart.x + boxStart.width - newWidth;
        }
      }

      // Corner handles: use the larger delta
      if (resizeHandle.length === 2) {
        const widthFromHeight = newHeight * aspectRatio;
        if (widthFromHeight > newWidth) {
          newWidth = widthFromHeight;
          if (resizeHandle.includes('w')) {
            newX = boxStart.x + boxStart.width - newWidth;
          }
        } else {
          newHeight = newWidth / aspectRatio;
          if (resizeHandle.includes('n')) {
            newY = boxStart.y + boxStart.height - newHeight;
          }
        }
      }

      // Constrain to image bounds
      newX = Math.max(0, newX);
      newY = Math.max(0, newY);
      newWidth = Math.min(newWidth, displayDimensions.width - newX);
      newHeight = Math.min(newHeight, displayDimensions.height - newY);

      // Re-enforce aspect ratio after constraints
      if (newWidth / newHeight > aspectRatio) {
        newWidth = newHeight * aspectRatio;
      } else {
        newHeight = newWidth / aspectRatio;
      }

      setCropBox({ x: newX, y: newY, width: newWidth, height: newHeight });
    }
  }, [isDragging, isResizing, resizeHandle, dragStart, boxStart, displayDimensions, cropBox.width, cropBox.height, aspectRatio]);

  // Mouse up handler
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  // Add/remove global mouse listeners
  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // Start dragging the crop box
  const handleBoxMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setBoxStart({ ...cropBox });
    setIsDragging(true);
  };

  // Start resizing
  const handleResizeMouseDown = (e: React.MouseEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setBoxStart({ ...cropBox });
    setResizeHandle(handle);
    setIsResizing(true);
  };

  // Reset crop box
  const handleReset = () => {
    const initialWidth = displayDimensions.width * 0.6;
    const initialHeight = initialWidth / aspectRatio;
    const initialX = (displayDimensions.width - initialWidth) / 2;
    const initialY = (displayDimensions.height - initialHeight) / 2;

    setCropBox({
      x: initialX,
      y: initialY,
      width: initialWidth,
      height: initialHeight
    });
  };

  // Fit to maximum size
  const handleFitToMax = () => {
    // Center the max-size box
    const newX = (displayDimensions.width - maxCropBox.width) / 2;
    const newY = (displayDimensions.height - maxCropBox.height) / 2;

    setCropBox({
      x: newX,
      y: newY,
      width: maxCropBox.width,
      height: maxCropBox.height
    });
  };

  // Save crop
  const handleSave = () => {
    // Convert pixel values to percentages of the original image
    const crop: CropData = {
      x: (cropBox.x / displayDimensions.width) * 100,
      y: (cropBox.y / displayDimensions.height) * 100,
      width: (cropBox.width / displayDimensions.width) * 100,
      height: (cropBox.height / displayDimensions.height) * 100
    };

    onCropComplete(crop);
    onOpenChange(false);
  };

  // Calculate preview dimensions
  const previewWidth = isAvatar ? 200 : 280;
  const previewHeight = previewWidth / aspectRatio;

  // Preview uses the same object-cover + objectPosition + scale approach
  // as the actual page display — no margin math, no dimension dependencies
  const getPreviewStyle = (): React.CSSProperties => {
    if (cropBox.width === 0 || displayDimensions.width === 0) return {};

    // Convert pixel crop box to the same position/scale format the DB stores
    const pctW = (cropBox.width / displayDimensions.width) * 100;
    const posX = ((cropBox.x + cropBox.width / 2) / displayDimensions.width) * 100;
    const posY = ((cropBox.y + cropBox.height / 2) / displayDimensions.height) * 100;
    const scale = 100 / pctW;

    return {
      objectFit: 'cover' as const,
      objectPosition: `${posX}% ${posY}%`,
      transform: `scale(${scale})`,
      transformOrigin: `${posX}% ${posY}%`,
      width: '100%',
      height: '100%',
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Drag the box to position. Drag corners to resize. Smaller box = tighter crop.
          </p>

          {/* Message explaining WHY it's at max */}
          {isAtMaxSize && (
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{getConstraintMessage(limitingDimension, isAvatar)}</span>
            </div>
          )}

          <div className="flex gap-6">
            {/* Main editing area */}
            <div className="flex-1">
              <div
                ref={containerRef}
                className="relative bg-gray-900 rounded-lg overflow-hidden"
                style={{
                  width: '100%',
                  height: displayDimensions.height || 'auto'
                }}
              >
                {/* Image */}
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt="Crop source"
                  onLoad={handleImageLoad}
                  className="block"
                  style={{
                    width: displayDimensions.width || '100%',
                    height: displayDimensions.height || 'auto',
                  }}
                  draggable={false}
                />

                {/* Darkened overlay outside crop box */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `linear-gradient(to right,
                      rgba(0,0,0,0.6) ${cropBox.x}px,
                      transparent ${cropBox.x}px,
                      transparent ${cropBox.x + cropBox.width}px,
                      rgba(0,0,0,0.6) ${cropBox.x + cropBox.width}px
                    )`,
                  }}
                />
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: cropBox.x,
                    top: 0,
                    width: cropBox.width,
                    height: cropBox.y,
                    background: 'rgba(0,0,0,0.6)'
                  }}
                />
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: cropBox.x,
                    top: cropBox.y + cropBox.height,
                    width: cropBox.width,
                    height: displayDimensions.height - cropBox.y - cropBox.height,
                    background: 'rgba(0,0,0,0.6)'
                  }}
                />

                {/* Visual indicator for constraint edges when at max */}
                {isAtMaxSize && limitingDimension === 'height' && (
                  <>
                    {/* Top edge indicator */}
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        left: cropBox.x,
                        top: cropBox.y - 2,
                        width: cropBox.width,
                        height: 4,
                        background: 'linear-gradient(to right, transparent, rgba(251, 191, 36, 0.8), transparent)',
                        borderRadius: 2
                      }}
                    />
                    {/* Bottom edge indicator */}
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        left: cropBox.x,
                        top: cropBox.y + cropBox.height - 2,
                        width: cropBox.width,
                        height: 4,
                        background: 'linear-gradient(to right, transparent, rgba(251, 191, 36, 0.8), transparent)',
                        borderRadius: 2
                      }}
                    />
                  </>
                )}

                {isAtMaxSize && limitingDimension === 'width' && (
                  <>
                    {/* Left edge indicator */}
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        left: cropBox.x - 2,
                        top: cropBox.y,
                        width: 4,
                        height: cropBox.height,
                        background: 'linear-gradient(to bottom, transparent, rgba(251, 191, 36, 0.8), transparent)',
                        borderRadius: 2
                      }}
                    />
                    {/* Right edge indicator */}
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        left: cropBox.x + cropBox.width - 2,
                        top: cropBox.y,
                        width: 4,
                        height: cropBox.height,
                        background: 'linear-gradient(to bottom, transparent, rgba(251, 191, 36, 0.8), transparent)',
                        borderRadius: 2
                      }}
                    />
                  </>
                )}

                {/* Crop box */}
                {cropBox.width > 0 && (
                  <div
                    className={`absolute border-2 cursor-move ${isAvatar ? 'rounded-full' : ''} ${isAtMaxSize ? 'border-amber-400' : 'border-white'}`}
                    style={{
                      left: cropBox.x,
                      top: cropBox.y,
                      width: cropBox.width,
                      height: cropBox.height,
                      boxShadow: `0 0 0 9999px rgba(0,0,0,0.5)${isAtMaxSize ? ', 0 0 8px 2px rgba(251, 191, 36, 0.5)' : ''}`,
                    }}
                    onMouseDown={handleBoxMouseDown}
                  >
                    {/* Grid lines (not for avatar) */}
                    {!isAvatar && (
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30" />
                        <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30" />
                        <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30" />
                        <div className="absolute top-2/3 left-0 right-0 h-px bg-white/30" />
                      </div>
                    )}

                    {/* Resize handles */}
                    {/* Corners */}
                    <div
                      className="absolute -left-2 -top-2 w-4 h-4 bg-white border border-gray-400 cursor-nw-resize"
                      onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
                    />
                    <div
                      className="absolute -right-2 -top-2 w-4 h-4 bg-white border border-gray-400 cursor-ne-resize"
                      onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
                    />
                    <div
                      className="absolute -left-2 -bottom-2 w-4 h-4 bg-white border border-gray-400 cursor-sw-resize"
                      onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
                    />
                    <div
                      className="absolute -right-2 -bottom-2 w-4 h-4 bg-white border border-gray-400 cursor-se-resize"
                      onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
                    />

                    {/* Edge handles */}
                    <div
                      className="absolute left-1/2 -translate-x-1/2 -top-2 w-8 h-4 bg-white border border-gray-400 cursor-n-resize"
                      onMouseDown={(e) => handleResizeMouseDown(e, 'n')}
                    />
                    <div
                      className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-8 h-4 bg-white border border-gray-400 cursor-s-resize"
                      onMouseDown={(e) => handleResizeMouseDown(e, 's')}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -left-2 w-4 h-8 bg-white border border-gray-400 cursor-w-resize"
                      onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -right-2 w-4 h-8 bg-white border border-gray-400 cursor-e-resize"
                      onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Preview */}
            <div className="w-72 flex-shrink-0">
              <p className="text-sm font-medium mb-2">Preview ({aspectLabel}) <span className="text-xs text-muted-foreground">v4</span></p>
              <div
                className={`bg-gray-100 overflow-hidden ${isAvatar ? 'rounded-full' : 'rounded-lg'}`}
                style={{
                  width: previewWidth,
                  height: previewHeight,
                }}
              >
                {cropBox.width > 0 && (
                  <img
                    src={imageUrl}
                    alt="Preview"
                    style={getPreviewStyle()}
                    draggable={false}
                  />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                This is how the image will appear as {viewTypeDesc}.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-between pt-4 border-t">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button
                variant="outline"
                onClick={handleFitToMax}
                disabled={isAtMaxSize}
                title={isAtMaxSize
                  ? getConstraintMessage(limitingDimension, isAvatar)
                  : "Expand crop box to maximum possible size"
                }
              >
                <Maximize2 className="w-4 h-4 mr-2" />
                Fit to Max
              </Button>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                Save Crop
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
