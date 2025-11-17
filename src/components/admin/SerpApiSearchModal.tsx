/**
 * SerpAPI Search Modal Component
 *
 * Enables single-event image search and import for LifelinePublic.
 *
 * Features:
 * - Query editor with validation
 * - Image search via Railway API
 * - Multi-select with checkboxes
 * - Score badges (0-25 points)
 * - Full-size preview lightbox
 * - Rerun with modified query
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, X, ZoomIn } from 'lucide-react';

// ========================================
// CONFIGURATION
// ========================================

/**
 * Railway API Service URL
 *
 * After deploying to Railway:
 * 1. Get your service URL from Railway dashboard → Settings → Networking
 * 2. Replace the placeholder below with your actual URL
 * 3. Format: https://lifeline-serpapi-service-production-XXXX.up.railway.app
 */
const API_URL = 'https://lifeline-serpapi-service-production.up.railway.app';

// ========================================
// TYPE DEFINITIONS
// ========================================

interface ImageCandidate {
  url: string;
  thumbnail: string;
  title: string;
  source: string;      // Domain (e.g., "imdb.com")
  score: number;       // 0-25 points
}

interface SerpApiSearchModalProps {
  open: boolean;
  onClose: () => void;
  entryId: string;
  initialQuery: string;
  onImportComplete: () => void;
}

// ========================================
// MAIN COMPONENT
// ========================================

export const SerpApiSearchModal = ({
  open,
  onClose,
  entryId,
  initialQuery,
  onImportComplete
}: SerpApiSearchModalProps) => {
  // ========================================
  // STATE
  // ========================================

  const [step, setStep] = useState<'edit' | 'results'>('edit');
  const [query, setQuery] = useState(initialQuery || '');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ImageCandidate[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Sync modal state when entry or query changes
  useEffect(() => {
    if (open) {
      setStep('edit');
      setQuery(initialQuery || '');
      setResults([]);
      setSelected(new Set());
      setPreviewUrl(null);
    }
  }, [open, entryId, initialQuery]);

  // ========================================
  // API CALLS
  // ========================================

  /**
   * Search for images using Railway API
   * Does NOT upload - just returns candidates
   * 
   * Note: Always requests 20 images (max) since SerpAPI charges per API call,
   * not per result returned. Same cost for 1 or 20 images.
   */
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
          num_results: 20  // Hardcoded: no cost difference between 1 and 20
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
        toast.error('No images found. Try a different query.');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search images. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Import selected images to Supabase Storage
   * Creates media_assets + entry_media records
   */
  const handleImport = async () => {
    if (selected.size === 0) {
      toast.error('Please select at least one image');
      return;
    }

    setLoading(true);
    try {
      const selectedImages = results
        .filter(img => selected.has(img.url))
        .map(img => ({
          url: img.url,
          title: img.title,
          score: img.score
        }));

      const response = await fetch(`${API_URL}/api/import-selected-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry_id: entryId,
          images: selectedImages
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        toast.success(`Imported ${data.imported_count} image(s)`);

        if (data.failed_urls && data.failed_urls.length > 0) {
          toast.warning(`Failed to import ${data.failed_urls.length} image(s)`);
        }

        onImportComplete();
        onClose();

        // Reset state for next use
        setStep('edit');
        setResults([]);
        setSelected(new Set());
      } else {
        toast.error('Import failed');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import images. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  // ========================================
  // UI HANDLERS
  // ========================================

  const handleToggleSelect = (url: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(url)) {
      newSelected.delete(url);
    } else {
      newSelected.add(url);
    }
    setSelected(newSelected);
  };

  const handleRerun = () => {
    setStep('edit');
    setSelected(new Set());
  };

  const handleClose = () => {
    // Clear state - useEffect will rehydrate on next open
    setStep('edit');
    setQuery('');
    setResults([]);
    setSelected(new Set());
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
              {step === 'edit' ? 'SerpAPI Image Search' : 'Select Images to Import'}
            </DialogTitle>
          </DialogHeader>

          {/* STEP 1: Query Editor */}
          {step === 'edit' && (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Search Query
                </label>
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., Walter White cooking in lab"
                  className="w-full"
                  disabled={loading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !loading && query.trim()) {
                      handleSearch();
                    }
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Describe what you're looking for. Press Enter to search.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSearch}
                  disabled={loading || !query.trim()}
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
                <Button variant="outline" onClick={handleClose} disabled={loading}>
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
                Found {results.length} image{results.length !== 1 ? 's' : ''} • {selected.size} selected
              </div>

              {/* Image Grid */}
              <div className="grid grid-cols-3 gap-4">
                {results.map((image) => {
                  const isSelected = selected.has(image.url);

                  return (
                    <div
                      key={image.url}
                      className={`
                        relative border-2 rounded-lg overflow-hidden cursor-pointer
                        transition-all hover:shadow-lg
                        ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-300'}
                      `}
                      onClick={() => handleToggleSelect(image.url)}
                    >
                      {/* Image */}
                      <div className="relative h-48 bg-gray-100">
                        <img
                          src={image.thumbnail || image.url}
                          alt={image.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback if thumbnail fails
                            e.currentTarget.src = image.url;
                          }}
                        />

                        {/* Score Badge */}
                        <div className={`absolute top-2 right-2 ${getScoreColor(image.score)} text-white text-xs font-bold px-2 py-1 rounded`}>
                          {image.score}
                        </div>

                        {/* Preview Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewUrl(image.url);
                          }}
                          className="absolute bottom-2 right-2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-colors"
                          title="Preview full size"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Info Footer */}
                      <div className="p-3 bg-white">
                        <div className="flex items-start gap-2">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleSelect(image.url)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-700 truncate" title={image.title}>
                              {image.title || 'Untitled'}
                            </p>
                            <p className="text-xs text-gray-500 truncate" title={image.source}>
                              {image.source}
                            </p>
                          </div>
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
                  disabled={loading || selected.size === 0}
                  className="min-w-[160px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    `Import ${selected.size} Image${selected.size !== 1 ? 's' : ''}`
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRerun}
                  disabled={loading}
                >
                  Rerun Search
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Lightbox Preview */}
      {previewUrl && (
        <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
          <DialogContent className="max-w-6xl max-h-[90vh] p-0">
            <div className="relative">
              <button
                onClick={() => setPreviewUrl(null)}
                className="absolute top-4 right-4 z-10 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-auto max-h-[85vh] object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};