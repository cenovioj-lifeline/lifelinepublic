/**
 * Lifeline SerpAPI Search Modal Component
 *
 * Enables lifeline cover image search and import.
 *
 * Features:
 * - Query editor with validation
 * - Image search via Railway API
 * - Single-select (lifelines have one cover image)
 * - Score badges (0-25 points)
 * - Full-size preview lightbox
 * - Rerun with modified query
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, X, ZoomIn, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ImagePositionPicker } from '@/components/ImagePositionPicker';
import { useMutation, useQueryClient } from '@tanstack/react-query';

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

interface LifelineSerpApiSearchModalProps {
  open: boolean;
  onClose: () => void;
  lifelineId: string;
  initialQuery: string;
  onImportComplete: () => void;
}

// ========================================
// MAIN COMPONENT
// ========================================

export const LifelineSerpApiSearchModal = ({
  open,
  onClose,
  lifelineId,
  initialQuery,
  onImportComplete
}: LifelineSerpApiSearchModalProps) => {
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
  const [showPositionPicker, setShowPositionPicker] = useState(false);
  const [importedImageUrl, setImportedImageUrl] = useState<string | null>(null);
  const [mediaAssetId, setMediaAssetId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Sync modal state when lifeline or query changes
  useEffect(() => {
    if (open) {
      setStep('edit');
      setQuery(initialQuery || '');
      setResults([]);
      setSelectedUrl(null);
      setPreviewUrl(null);
    }
  }, [open, lifelineId, initialQuery]);

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

  const handleImport = async () => {
    if (!selectedUrl) return;

    setImporting(true);
    try {
      // Step 1: Import via edge function (uploads to storage + creates media_asset)
      const { data: importData, error: importError } = await supabase.functions.invoke(
        'import-image-from-url',
        {
          body: {
            entryId: lifelineId,
            imageUrl: selectedUrl,
            altText: '',
            orderIndex: 0,
            position: {
              x: 50,
              y: 50,
              scale: 1.0
            }
          }
        }
      );

      if (importError) throw importError;

      const { mediaId, url } = importData;
      setMediaAssetId(mediaId);
      setImportedImageUrl(url);
      setShowPositionPicker(true);

    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import image');
      setImporting(false);
    }
  };

  // ========================================
  // POSITION PICKER
  // ========================================

  const updateLifelineMutation = useMutation({
    mutationFn: async (position: { x?: number; y?: number; scale?: number }) => {
      if (!mediaAssetId || !importedImageUrl) return;

      const { error } = await supabase
        .from('lifelines')
        .update({
          cover_image_id: mediaAssetId,
          cover_image_url: importedImageUrl,
          cover_image_position_x: position.x || 50,
          cover_image_position_y: position.y || 50
        })
        .eq('id', lifelineId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Cover image updated successfully');
      queryClient.invalidateQueries({ queryKey: ['public-lifelines'] });
      queryClient.invalidateQueries({ queryKey: ['collection-lifelines'] });
      onImportComplete();
      handleModalClose();
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast.error('Failed to update cover image');
    }
  });

  const handlePositionSave = (position: { x?: number; y?: number; scale?: number }) => {
    updateLifelineMutation.mutate(position);
  };

  // ========================================
  // UI HANDLERS
  // ========================================

  const handleModalClose = () => {
    setStep('edit');
    setQuery(initialQuery || '');
    setResults([]);
    setSelectedUrl(null);
    setPreviewUrl(null);
    setImporting(false);
    setShowPositionPicker(false);
    setImportedImageUrl(null);
    setMediaAssetId(null);
    onClose();
  };

  const handleRerunSearch = () => {
    setStep('edit');
    setResults([]);
    setSelectedUrl(null);
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 20) return 'bg-green-500';
    if (score >= 15) return 'bg-yellow-500';
    if (score >= 10) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // ========================================
  // RENDER
  // ========================================

  return (
    <>
      <Dialog open={open && !showPositionPicker} onOpenChange={handleModalClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {step === 'edit' ? 'Edit Search Query' : 'Select Cover Image'}
            </DialogTitle>
          </DialogHeader>

          {/* STEP: EDIT QUERY */}
          {step === 'edit' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search Query</label>
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter search query..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !loading) {
                      handleSearch();
                    }
                  }}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleModalClose} disabled={loading}>
                  Cancel
                </Button>
                <Button onClick={handleSearch} disabled={loading || !query.trim()}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Search Images
                </Button>
              </div>
            </div>
          )}

          {/* STEP: RESULTS GRID */}
          {step === 'results' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {results.length} image{results.length !== 1 ? 's' : ''} found
                </p>
                <Button variant="outline" size="sm" onClick={handleRerunSearch}>
                  Modify Query
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto p-1">
                {results.map((img, idx) => (
                  <div
                    key={idx}
                    className={`
                      relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all
                      ${selectedUrl === img.url ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}
                    `}
                    onClick={() => setSelectedUrl(img.url)}
                  >
                    <div className="aspect-square relative bg-muted">
                      <img
                        src={img.thumbnail}
                        alt={img.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />

                      {/* Score Badge */}
                      <div className={`absolute top-2 right-2 ${getScoreBadgeColor(img.score)} text-white text-xs font-bold px-2 py-1 rounded`}>
                        {img.score}
                      </div>

                      {/* Selection Indicator */}
                      {selectedUrl === img.url && (
                        <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                          <div className="bg-primary text-primary-foreground rounded-full p-2">
                            <Check className="h-6 w-6" />
                          </div>
                        </div>
                      )}

                      {/* Preview Button */}
                      <button
                        className="absolute top-2 left-2 bg-black/50 text-white p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewUrl(img.url);
                        }}
                      >
                        <ZoomIn className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="p-2 bg-card">
                      <p className="text-xs truncate font-medium">{img.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{img.source}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={handleModalClose} disabled={importing}>
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!selectedUrl || importing}
                >
                  {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Import Selected
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Full-size Preview Lightbox */}
      {previewUrl && (
        <Dialog open={true} onOpenChange={() => setPreviewUrl(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Image Preview</DialogTitle>
            </DialogHeader>
            <div className="relative">
              <img src={previewUrl} alt="Full size preview" className="w-full h-auto" />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70"
                onClick={() => setPreviewUrl(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Position Picker */}
      {showPositionPicker && importedImageUrl && (
        <ImagePositionPicker
          imageUrl={importedImageUrl}
          onPositionChange={handlePositionSave}
          open={showPositionPicker}
          onOpenChange={(open) => {
            if (!open) {
              setShowPositionPicker(false);
              handleModalClose();
            }
          }}
          title="Position Cover Image"
          viewType="banner"
        />
      )}
    </>
  );
};
