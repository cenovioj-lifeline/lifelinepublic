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
import { Loader2, X, ZoomIn, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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

  const handleImport = async () => {
    if (!selectedUrl) {
      toast.error('Please select an image');
      return;
    }

    setImporting(true);
    try {
      const { error } = await supabase.functions.invoke('import-profile-image', {
        body: {
          profileId,
          imageUrl: selectedUrl,
          altText: `Profile avatar`,
        }
      });

      if (error) throw error;

      toast.success('Profile image imported successfully');
      onImportComplete();
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import image');
    } finally {
      setImporting(false);
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
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Search Query
                </label>
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., Jess Day portrait"
                  className="w-full"
                  disabled={loading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !loading && query.trim()) {
                      handleSearch();
                    }
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Describe the profile image you're looking for. Press Enter to search.
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
    </>
  );
};
