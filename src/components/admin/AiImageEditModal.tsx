/**
 * AI Image Edit Modal (Nano Banana)
 * 
 * Simple, focused modal for AI image editing using Gemini.
 * Takes entry data as props - no async fetching needed.
 * Uses CropBoxPicker for intuitive crop selection.
 */

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, X, ImageIcon, Pencil } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { uploadImage } from '@/lib/storage';
import { CropBoxPicker, CropData } from '@/components/admin/CropBoxPicker';

// ========================================
// TYPES
// ========================================

interface AiImageEditModalProps {
  open: boolean;
  onClose: () => void;
  entryId: string;
  entryTitle: string;
  entryDescription: string | null;
  onSaveComplete: () => void;
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Build the edit prompt from entry data
 */
const buildEditPrompt = (title: string, description: string | null): string => {
  const parts = [
    `Take the image that is being passed in. This person is trying to convey the following idea:`,
    ``,
    `Event Title: ${title}`,
  ];

  if (description) {
    parts.push(`Event Details: ${description}`);
  }

  parts.push(
    ``,
    `Feel free to take liberties to make this seem like this person trying to convey this idea. Add images related to the event details if they help tell the story. Use the image of the person however needed to make this funny, compelling, interesting, etc.`
  );

  return parts.join('\n');
};

// ========================================
// COMPONENT
// ========================================

export const AiImageEditModal = ({
  open,
  onClose,
  entryId,
  entryTitle,
  entryDescription,
  onSaveComplete
}: AiImageEditModalProps) => {
  // State
  const [aiPrompt, setAiPrompt] = useState('');
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null);
  const [sourceImagePreview, setSourceImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<{ url: string; path: string } | null>(null);
  const [showCropPicker, setShowCropPicker] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize prompt when modal opens
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      // Pre-populate prompt from entry data
      setAiPrompt(buildEditPrompt(entryTitle, entryDescription));
    } else {
      // Reset state when closing
      setAiPrompt('');
      setSourceImageUrl(null);
      setSourceImagePreview(null);
      setGeneratedImage(null);
      setShowCropPicker(false);
      onClose();
    }
  };

  // If modal just opened and prompt is empty, populate it
  if (open && !aiPrompt && entryTitle) {
    setAiPrompt(buildEditPrompt(entryTitle, entryDescription));
  }

  // ========================================
  // DRAG & DROP HANDLERS
  // ========================================

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    if (!imageFile) {
      toast.error("Please drop an image file");
      return;
    }
    await handleSourceImageUpload(imageFile);
  };

  const handleSourceImageUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 10MB.");
      return;
    }

    setIsUploading(true);
    try {
      const { url } = await uploadImage(file, 'media-uploads');
      setSourceImageUrl(url);
      setSourceImagePreview(url);
      toast.success('Source image ready!');
    } catch (error) {
      console.error('Source upload error:', error);
      toast.error('Failed to upload source image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleSourceImageUpload(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearSourceImage = () => {
    setSourceImageUrl(null);
    setSourceImagePreview(null);
  };

  // ========================================
  // AI GENERATION
  // ========================================

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please enter edit instructions');
      return;
    }

    if (!sourceImageUrl) {
      toast.error('Please drop a source image first');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-image', {
        body: {
          prompt: aiPrompt.trim(),
          sourceImageUrl: sourceImageUrl,
          entryId: entryId
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to generate image');

      setGeneratedImage({ url: data.url, path: data.path });
      setShowCropPicker(true);
      toast.success('Image edited! Now select your crop.');
    } catch (error: any) {
      console.error('AI generation error:', error);
      if (error.message?.includes('Rate limited')) {
        toast.error('Rate limited. Please try again in a moment.');
      } else if (error.message?.includes('credits')) {
        toast.error('Out of AI credits. Add credits in Lovable settings.');
      } else {
        toast.error(error.message || 'Failed to edit image');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // ========================================
  // SAVE WITH CROP DATA
  // ========================================

  const handleSaveCrop = async (crop: CropData) => {
    if (!generatedImage) return;

    try {
      // Convert crop box data to position/scale format for storage
      // The crop data tells us what portion of the image to show
      // We store this as position (center point) and scale (inverse of crop width)
      
      // Calculate center position from crop box
      const centerX = crop.x + crop.width / 2;
      const centerY = crop.y + crop.height / 2;
      
      // Scale is inverse of crop width (smaller box = higher effective zoom)
      // If crop covers 100% width, scale = 1. If 50%, scale = 2, etc.
      const scale = 100 / crop.width;

      const { data: mediaAsset, error: mediaError } = await supabase
        .from('media_assets')
        .insert({
          url: generatedImage.url,
          filename: generatedImage.path,
          type: 'image',
          alt_text: aiPrompt.substring(0, 200),
          position_x: Math.round(centerX),
          position_y: Math.round(centerY),
          scale: Math.round(scale * 100) / 100, // Round to 2 decimal places
        })
        .select('id')
        .single();

      if (mediaError) throw mediaError;

      const { error: linkError } = await supabase
        .from('entry_media')
        .insert({
          entry_id: entryId,
          media_id: mediaAsset.id,
        });

      if (linkError) throw linkError;

      toast.success('AI image saved!');
      onSaveComplete();
      handleOpenChange(false);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save image');
    }
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              🍌 Nano Banana - AI Image Editor
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Source Image Drop Zone */}
            <div>
              <label className="text-sm font-medium text-foreground/70 mb-2 block">
                Source Image
              </label>
              
              {sourceImagePreview ? (
                <div className="relative inline-block">
                  <img 
                    src={sourceImagePreview} 
                    alt="Source for editing" 
                    className="h-32 w-auto rounded-lg border object-cover"
                  />
                  <button
                    onClick={clearSourceImage}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
                    ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'}
                    ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
                >
                  {isUploading ? (
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  ) : (
                    <>
                      <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="font-medium">Drop an image here</p>
                      <p className="text-xs text-muted-foreground">or click to browse</p>
                    </>
                  )}
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Edit Instructions */}
            <div>
              <label className="text-sm font-medium text-foreground/70 mb-2 block">
                Edit Instructions
              </label>
              <Textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Describe how to modify the image..."
                className="min-h-[150px]"
                disabled={isGenerating}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Pre-populated from entry. Feel free to modify.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !sourceImageUrl || !aiPrompt.trim()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Editing...
                  </>
                ) : (
                  <>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Image
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isGenerating}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Crop Box Picker */}
      {generatedImage && (
        <CropBoxPicker
          imageUrl={generatedImage.url}
          open={showCropPicker}
          onOpenChange={(open) => {
            setShowCropPicker(open);
            if (!open) setGeneratedImage(null);
          }}
          onCropComplete={handleSaveCrop}
          title="Crop Your Edited Image"
        />
      )}
    </>
  );
};
