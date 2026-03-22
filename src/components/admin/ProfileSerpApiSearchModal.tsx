/**
 * Profile SerpAPI Search Modal Component
 *
 * Enables profile image search and import.
 *
 * Features:
 * - Query editor with validation
 * - Image search via Railway API
 * - Single-select (profiles have one avatar)
 * - Score badges (0-25 points)
 * - Full-size preview lightbox
 * - Rerun with modified query
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, X, ZoomIn, Check, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CropBoxPicker, CropData } from '@/components/admin/CropBoxPicker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadImage } from '@/lib/storage';

// ========================================
// CONFIGURATION
// ========================================

const API_URL = 'https://lifeline-serpapi-service-production.up.railway.app';

// ========================================
// TYPE DEFINITIONS
// ========================================

interface ImageCandidate {
  url: string;
  thumbnail: string;
  title: string;
  source: string;
  score: number;
}

interface ProfileSerpApiSearchModalProps {
  open: boolean;
  onClose: () => void;
  profileId: string;
  initialQuery: string;
  onImportComplete: () => void;
}

// ========================================
// MAIN COMPONENT
// ========================================

export const ProfileSerpApiSearchModal = ({
  open,
  onClose,
  profileId,
  initialQuery,
  onImportComplete
}: ProfileSerpApiSearchModalProps) => {
  // ========================================
  // STATE
  // ========================================

  const [step, setStep] = useState<'edit' | 'results'>('edit');
  const [query, setQuery] = useState(initialQuery || '');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ImageCandidate[]>([]);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [showCropPicker, setShowCropPicker] = useState(false);
  const [importedImageUrl, setImportedImageUrl] = useState<string | null>(null);
  const [mediaAssetId, setMediaAssetId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  // ========================================
  // DRAG & DROP HANDLERS
  // ========================================

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    if (!imageFile) {
      toast.error("Please drop an image file");
      return;
    }
    await handleDirectUpload(imageFile);
  };

  const handleDirectUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 10MB.");
      return;
    }

    setUploading(true);
    try {
      const { url, path } = await uploadImage(file, 'media-uploads');
      
      // Create media_asset record
      const { data: mediaAsset, error: mediaError } = await supabase
        .from('media_assets')
        .insert({
          url,
          filename: path,
          type: 'image',
          alt_text: `${initialQuery} profile avatar`,
        })
        .select('id')
        .single();

      if (mediaError) throw mediaError;

      // Update profile with new avatar
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_image_id: mediaAsset.id })
        .eq('id', profileId);

      if (profileError) throw profileError;

      setImportedImageUrl(url);
      setMediaAssetId(mediaAsset.id);
      setShowCropPicker(true);
      toast.success('Image uploaded! Now position your avatar.');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  // Sync modal state when profile or query changes
  useEffect(() => {
    if (open) {
      setStep('edit');
      setQuery(initialQuery || '');
      setResults([]);
      setSelectedUrl(null);
      setPreviewUrl(null);
    }
  }, [open, profileId, initialQuery]);

  // ========================================
  // API CALLS
  // ========================================

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('Query cannot be blank');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/search-event-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          num_results: 20
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.candidates && data.candidates.length > 0) {
        setResults(data.candidates);
        setStep('results');
        toast.success(`Found ${data.candidates.length} images`);
      } else {
        toast.error('No images found');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search images');
    } finally {
      setLoading(false);
    }
  };

  const updatePositionMutation = useMutation({
    mutationFn: async ({ mediaId, position }: { mediaId: string; position: { x: number; y: number; scale: number } }) => {
      const { error } = await supabase
        .from('media_assets')
        .update({
          position_x: Math.round(position.x),
          position_y: Math.round(position.y),
          scale: position.scale,
        })
        .eq('id', mediaId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Avatar position saved successfully");
      queryClient.invalidateQueries({ queryKey: ["profile-data"] });
      onImportComplete?.();
      setShowCropPicker(false);
      onClose();
    },
    onError: (error) => {
      console.error('Error updating position:', error);
      toast.error("Failed to save avatar position");
    },
  });

  const handleImport = async () => {
    if (!selectedUrl) {
      toast.error('Please select an image');
      return;
    }

    setImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke('import-profile-image', {
        body: {
          profileId,
          imageUrl: selectedUrl,
          altText: `${initialQuery} profile avatar`,
        },
      });

      if (error) throw error;

      // Open crop picker with imported image
      setImportedImageUrl(data.url);
      setMediaAssetId(data.mediaId);
      setShowCropPicker(true);
      
      toast.success("Image imported - now position your avatar");
    } catch (error) {
      console.error('Import error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to import image');
    } finally {
      setImporting(false);
    }
  };

  const handleCropComplete = (crop: CropData) => {
    if (mediaAssetId) {
      // Convert crop box to position/scale
      const centerX = crop.x + crop.width / 2;
      const centerY = crop.y + crop.height / 2;
      // Scale relative to object-cover baseline (1:1 avatar container)
      const imgRatio = crop.imageAspectRatio;
      const coverFraction = imgRatio > 1 ? 1 / imgRatio : imgRatio;
      const scale = (coverFraction * 100) / crop.width;
      updatePositionMutation.mutate({ mediaId: mediaAssetId, position: { x: centerX, y: centerY, scale } });
    }
  };

  // ========================================
  // UI HANDLERS
  // ========================================

  const handleRerun = () => {
    setStep('edit');
    setSelectedUrl(null);
  };

  const handleClose = () => {
    setStep('edit');
    setQuery('');
    setResults([]);
    setSelectedUrl(null);
    setPreviewUrl(null);
    onClose();
  };

  const getScoreColor = (score: number): string => {
    if (score >= 20) return 'bg-green-500';
    if (score >= 15) return 'bg-blue-500';
    if (score >= 10) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <>
      {/* Main Modal */}
      <Dialog 
        open={open} 
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            handleClose();
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {step === 'edit' ? 'Profile Image Search' : 'Select Profile Image'}
            </DialogTitle>
          </DialogHeader>

          {/* STEP 1: Query Editor */}
          {step === 'edit' && (
            <div className="space-y-6">
              {/* Drag & Drop Upload Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors
                  ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
                  ${uploading ? 'pointer-events-none opacity-50' : ''}`}
              >
                {uploading ? (
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="font-medium">Drag & drop an image</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                  </>
                )}
              </div>

              <div className="text-center text-sm text-muted-foreground">— or search online —</div>

              <div>
                <label className="text-sm font-medium text-foreground/70 mb-2 block">
                  Search Query
                </label>
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., Jess Day portrait"
                  className="w-full"
                  disabled={loading || uploading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !loading && !uploading && query.trim()) {
                      handleSearch();
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Describe the profile image you're looking for. Press Enter to search.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSearch}
                  disabled={loading || uploading || !query.trim()}
                  className="min-w-[120px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    'Run Search'
                  )}
                </Button>
                <Button variant="outline" onClick={handleClose} disabled={loading || uploading}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Results Grid */}
          {step === 'results' && (
            <div className="space-y-6">
              {/* Results Count */}
              <div className="text-sm text-gray-600">
                Found {results.length} image{results.length !== 1 ? 's' : ''}
                {selectedUrl && ' • 1 selected'}
              </div>

              {/* Image Grid */}
              <div className="grid grid-cols-3 gap-4">
                {results.map((image) => {
                  const isSelected = selectedUrl === image.url;

                  return (
                    <div
                      key={image.url}
                      className={`
                        relative border-2 rounded-lg overflow-hidden cursor-pointer
                        transition-all duration-200
                        ${isSelected 
                          ? 'border-purple-500 ring-2 ring-purple-500 ring-offset-2' 
                          : 'border-gray-200 hover:border-purple-300'
                        }
                      `}
                      onClick={() => setSelectedUrl(isSelected ? null : image.url)}
                    >
                      {/* Selection Indicator */}
                      <div className={`
                        absolute top-2 left-2 z-10
                        w-6 h-6 rounded-full border-2
                        flex items-center justify-center
                        transition-all duration-200
                        ${isSelected 
                          ? 'bg-purple-500 border-purple-500' 
                          : 'bg-white border-gray-300'
                        }
                      `}>
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </div>

                      {/* Score Badge */}
                      <div className={`
                        absolute top-2 right-2 z-10
                        px-2 py-1 rounded-full text-white text-xs font-bold
                        ${getScoreColor(image.score)}
                      `}>
                        {image.score}
                      </div>

                      {/* Preview Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewUrl(image.url);
                        }}
                        className="absolute bottom-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                        aria-label="Preview image"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>

                      {/* Image */}
                      <img
                        src={image.thumbnail}
                        alt={image.title}
                        className="w-full h-48 object-cover"
                        loading="lazy"
                      />

                      {/* Image Info */}
                      <div className="p-2 bg-gray-50">
                        <div className="text-xs text-gray-600 truncate" title={image.source}>
                          {image.source}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={handleImport}
                  disabled={!selectedUrl || importing}
                  className="min-w-[160px]"
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    'Import Selected'
                  )}
                </Button>
                <Button variant="outline" onClick={handleRerun} disabled={importing}>
                  Edit Query
                </Button>
                <Button variant="outline" onClick={handleClose} disabled={importing}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Lightbox */}
      {previewUrl && (
        <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
          <DialogContent className="max-w-[90vw] max-h-[90vh] p-0">
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
              aria-label="Close preview"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-full h-full flex items-center justify-center bg-black">
              <img
                src={previewUrl}
                alt="Full size preview"
                className="max-w-full max-h-[90vh] object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Crop Picker Modal */}
      {importedImageUrl && (
        <CropBoxPicker
          open={showCropPicker}
          onOpenChange={setShowCropPicker}
          imageUrl={importedImageUrl}
          onCropComplete={handleCropComplete}
          aspectRatio={1}
          title="Position Profile Avatar"
        />
      )}
    </>
  );
};
