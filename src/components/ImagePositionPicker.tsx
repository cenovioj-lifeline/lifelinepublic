/**
 * Image Positioning System
 * 
 * position.x (0-100): Horizontal position percentage
 * position.y (0-100): Vertical position percentage  
 * position.scale (1.0-4.0): Zoom level
 *   - 1.0 = Natural fit (full image visible in frame)
 *   - 2.0 = 2x zoom (shows 50% of image width/height)
 *   - 4.0 = 4x zoom (shows 25% of image width/height)
 * 
 * How it works:
 * - Container has `overflow: hidden` and `object-fit: cover`
 * - Image scales UP from 1x to 4x
 * - Larger scale = less visible area = tighter crop
 * - Position controls which part of scaled image is centered
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface ImagePositionPickerProps {
  imageUrl: string;
  onPositionChange: (position: { x: number; y: number; scale: number }) => void;
  initialPosition?: { x: number; y: number; scale?: number };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  viewType?: "banner" | "card" | "both" | "avatar";
}

export function ImagePositionPicker({
  imageUrl,
  onPositionChange,
  initialPosition = { x: 50, y: 50, scale: 1 },
  open,
  onOpenChange,
  title = "Position Image",
  viewType = "both",
}: ImagePositionPickerProps) {
  const [position, setPosition] = useState({ 
    x: initialPosition.x, 
    y: initialPosition.y,
    scale: initialPosition.scale || 1 
  });

  const handlePositionChange = (axis: 'x' | 'y', value: number[]) => {
    const newPosition = { ...position, [axis]: value[0] };
    setPosition(newPosition);
  };

  const handleScaleChange = (value: number[]) => {
    setPosition({ ...position, scale: value[0] });
  };

  const handleDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setPosition({ ...position, x, y });
  };

  const handleReset = () => {
    setPosition({ x: 50, y: 50, scale: 1 });
  };

  const handleSave = () => {
    onPositionChange(position);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-sm text-muted-foreground">
            Adjust position and zoom to control which part of the image is visible. Higher zoom values show less of the image (closer crop).
          </div>

          {/* Preview with visible frame guide */}
          <div className="space-y-4">
            {viewType === "avatar" && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Avatar Preview (Circle):</p>
                <div 
                  className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-primary mx-auto cursor-move"
                  onMouseDown={(e) => {
                    const handleMove = (moveEvent: MouseEvent) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = Math.max(0, Math.min(100, ((moveEvent.clientX - rect.left) / rect.width) * 100));
                      const y = Math.max(0, Math.min(100, ((moveEvent.clientY - rect.top) / rect.height) * 100));
                      setPosition(prev => ({ ...prev, x, y }));
                    };
                    const handleUp = () => {
                      document.removeEventListener('mousemove', handleMove);
                      document.removeEventListener('mouseup', handleUp);
                    };
                    document.addEventListener('mousemove', handleMove);
                    document.addEventListener('mouseup', handleUp);
                  }}
                >
                  <img
                    src={imageUrl}
                    alt="Avatar preview"
                    className="w-full h-full object-cover pointer-events-none"
                    style={{
                      objectPosition: `${position.x}% ${position.y}%`,
                      transform: `scale(${position.scale})`,
                      transformOrigin: `${position.x}% ${position.y}%`
                    }}
                  />
                  <div className="absolute inset-0 pointer-events-none border-4 border-primary/30 rounded-full" />
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-background/80 px-2 py-0.5 rounded text-xs whitespace-nowrap">
                    Drag to reposition
                  </div>
                </div>
              </div>
            )}

            {(viewType === "banner" || viewType === "both") && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Banner View (3:1 ratio):</p>
                <div 
                  className="relative w-full aspect-[3/1] rounded-lg overflow-hidden border-2 border-primary cursor-move"
                  onMouseDown={(e) => {
                    const handleMove = (moveEvent: MouseEvent) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = Math.max(0, Math.min(100, ((moveEvent.clientX - rect.left) / rect.width) * 100));
                      const y = Math.max(0, Math.min(100, ((moveEvent.clientY - rect.top) / rect.height) * 100));
                      setPosition(prev => ({ ...prev, x, y }));
                    };
                    const handleUp = () => {
                      document.removeEventListener('mousemove', handleMove);
                      document.removeEventListener('mouseup', handleUp);
                    };
                    document.addEventListener('mousemove', handleMove);
                    document.addEventListener('mouseup', handleUp);
                  }}
                >
                  <img
                    src={imageUrl}
                    alt="Banner preview"
                    className="w-full h-full object-cover pointer-events-none"
                    style={{
                      objectPosition: `${position.x}% ${position.y}%`,
                      transform: `scale(${position.scale})`,
                      transformOrigin: `${position.x}% ${position.y}%`
                    }}
                  />
                  <div className="absolute inset-0 pointer-events-none border-4 border-primary/30" />
                  <div className="absolute top-2 left-2 bg-background/80 px-2 py-1 rounded text-xs">
                    Drag to reposition
                  </div>
                </div>
              </div>
            )}
            
            {(viewType === "card" || viewType === "both") && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Card View (16:9 ratio):</p>
                <div 
                  className="relative w-full max-w-md aspect-video rounded-lg overflow-hidden border-2 border-primary cursor-move"
                  onMouseDown={(e) => {
                    const handleMove = (moveEvent: MouseEvent) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = Math.max(0, Math.min(100, ((moveEvent.clientX - rect.left) / rect.width) * 100));
                      const y = Math.max(0, Math.min(100, ((moveEvent.clientY - rect.top) / rect.height) * 100));
                      setPosition(prev => ({ ...prev, x, y }));
                    };
                    const handleUp = () => {
                      document.removeEventListener('mousemove', handleMove);
                      document.removeEventListener('mouseup', handleUp);
                    };
                    document.addEventListener('mousemove', handleMove);
                    document.addEventListener('mouseup', handleUp);
                  }}
                >
                  <img
                    src={imageUrl}
                    alt="Card preview"
                    className="w-full h-full object-cover pointer-events-none"
                    style={{
                      objectPosition: `${position.x}% ${position.y}%`,
                      transform: `scale(${position.scale})`,
                      transformOrigin: `${position.x}% ${position.y}%`
                    }}
                  />
                  <div className="absolute inset-0 pointer-events-none border-4 border-primary/30" />
                  <div className="absolute top-2 left-2 bg-background/80 px-2 py-1 rounded text-xs">
                    Drag to reposition
                  </div>
                </div>
              </div>
            )}

            {/* Full image preview */}
            <div className="relative w-full max-h-96 rounded-lg overflow-hidden border">
              <img
                src={imageUrl}
                alt="Full image"
                className="w-full h-auto"
              />
              <div 
                className="absolute inset-0 bg-black/40"
                style={{
                  clipPath: `polygon(
                    0 0, 
                    100% 0, 
                    100% 100%, 
                    0 100%, 
                    0 0,
                    ${position.x - 20}% ${position.y - 15}%,
                    ${position.x + 20}% ${position.y - 15}%,
                    ${position.x + 20}% ${position.y + 15}%,
                    ${position.x - 20}% ${position.y + 15}%,
                    ${position.x - 20}% ${position.y - 15}%
                  )`
                }}
              />
            </div>
          </div>

          {/* Position controls */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Zoom: {position.scale.toFixed(2)}x (higher = closer crop)</label>
              <Slider
                value={[position.scale]}
                onValueChange={handleScaleChange}
                min={1.0}
                max={4.0}
                step={0.1}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Horizontal Position: {position.x}%</label>
              <Slider
                value={[position.x]}
                onValueChange={(value) => handlePositionChange('x', value)}
                min={0}
                max={100}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Vertical Position: {position.y}%</label>
              <Slider
                value={[position.y]}
                onValueChange={(value) => handlePositionChange('y', value)}
                min={0}
                max={100}
                step={1}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-between items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              Reset
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Position
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
