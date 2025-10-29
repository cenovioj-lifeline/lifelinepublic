import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImagePositionPicker } from "@/components/ImagePositionPicker";
import { toast } from "sonner";
import { Loader2, Image as ImageIcon, Search, FileText } from "lucide-react";

interface LifelineEntry {
  id: string;
  title: string;
  occurred_on: string | null;
  media: Array<{
    id: string;
    media_id: string;
    media_assets: {
      id: string;
      url: string;
      position_x: number;
      position_y: number;
      scale: number;
    };
  }>;
}

export default function LifelineImageManager() {
  const queryClient = useQueryClient();
  const [selectedLifelineId, setSelectedLifelineId] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);
  const [isGeneratingQueries, setIsGeneratingQueries] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [editingImage, setEditingImage] = useState<{
    mediaAssetId: string;
    url: string;
    position: { x: number; y: number; scale: number };
  } | null>(null);

  // Fetch lifelines
  const { data: lifelines } = useQuery({
    queryKey: ["lifelines-for-image-manager"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lifelines")
        .select("id, title, slug")
        .order("title");
      if (error) throw error;
      return data;
    },
  });

  // Fetch entries for selected lifeline
  const { data: entries, isLoading: entriesLoading } = useQuery({
    queryKey: ["lifeline-entries-with-media", selectedLifelineId],
    queryFn: async () => {
      if (!selectedLifelineId) return [];
      const { data, error } = await supabase
        .from("entries")
        .select(`
          id,
          title,
          occurred_on,
          entry_media (
            id,
            media_id,
            media_assets (
              id,
              url,
              position_x,
              position_y,
              scale
            )
          )
        `)
        .eq("lifeline_id", selectedLifelineId)
        .order("occurred_on");
      
      if (error) throw error;
      
      return data.map(entry => ({
        ...entry,
        media: entry.entry_media.map((em: any) => ({
          id: em.id,
          media_id: em.media_id,
          media_assets: em.media_assets
        }))
      })) as LifelineEntry[];
    },
    enabled: !!selectedLifelineId,
  });

  // Update media position mutation
  const updatePositionMutation = useMutation({
    mutationFn: async ({ 
      mediaAssetId, 
      position 
    }: { 
      mediaAssetId: string; 
      position: { x: number; y: number; scale: number } 
    }) => {
      const { error } = await supabase
        .from("media_assets")
        .update({
          position_x: position.x,
          position_y: position.y,
          scale: position.scale,
        })
        .eq("id", mediaAssetId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lifeline-entries-with-media", selectedLifelineId] });
      toast.success("Image position updated");
    },
    onError: () => {
      toast.error("Failed to update image position");
    },
  });

  const handleLoadImages = async () => {
    if (!selectedLifelineId) {
      toast.error("Please select a lifeline first");
      return;
    }

    // Check if already running
    if (isSearching) {
      toast.error("Image loading is already in progress. Please wait for it to complete.");
      return;
    }

    setIsSearching(true);
    toast.info("Finding and importing images... This may take several minutes as it processes in batches.");

    try {
      const { data, error } = await supabase.functions.invoke('find-and-import-lifeline-images', {
        body: { lifelineId: selectedLifelineId, dryRun: false, startIndex: 0 }
      });

      if (error) {
        console.error('Error finding images:', error);
        toast.error(error.message || "Failed to find images");
        return;
      }

      // Refetch entries to show newly imported images
      await queryClient.invalidateQueries({ queryKey: ['lifeline-entries-with-media', selectedLifelineId] });

      const { imported, failed, skipped, isComplete, batchInfo } = data;
      
      if (isComplete) {
        toast.success(`Import complete: ${imported} images imported, ${failed} failed, ${skipped} already had images`);
      } else {
        toast.success(`Batch ${batchInfo?.batchEnd}/${batchInfo?.totalToProcess} complete. Processing continues in background...`);
        // Poll for completion or show progress
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['lifeline-entries-with-media', selectedLifelineId] });
        }, 5000); // Refresh after 5 seconds to show progress
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSearching(false);
    }
  };

  const handleReturnQuery = async () => {
    if (!selectedLifelineId) {
      toast.error("Please select a lifeline first");
      return;
    }

    setIsGeneratingQueries(true);
    toast.info("Generating query preview...");

    try {
      const { data, error } = await supabase.functions.invoke('find-and-import-lifeline-images', {
        body: { lifelineId: selectedLifelineId, dryRun: true }
      });

      if (error) {
        console.error('Error generating queries:', error);
        toast.error(error.message || "Failed to generate queries");
        return;
      }

      // Create MD file content
      let mdContent = `# SerpAPI Query Preview\n\n`;
      mdContent += `## Lifeline Metadata\n\n`;
      mdContent += `- **Character:** ${data.lifeline?.characterName || 'N/A'}\n`;
      mdContent += `- **Collection:** ${data.lifeline?.collectionTitle || 'N/A'}\n`;
      if (data.lifeline?.actorName) {
        mdContent += `- **Actor:** ${data.lifeline.actorName}\n`;
      }
      mdContent += `- **Type:** ${data.lifeline?.type || 'N/A'}\n\n`;
      
      mdContent += `## Generated Queries\n\n`;
      data.queryPreview?.forEach((item: any, index: number) => {
        mdContent += `### ${index + 1}. ${item.entryTitle}\n\n`;
        item.queries.forEach((query: string, qIndex: number) => {
          const variantLabel = qIndex === 0 ? "Broad" : qIndex === 1 ? "Context-focused" : "Domain-biased";
          mdContent += `**Variant ${qIndex + 1} (${variantLabel}):**\n\`\`\`\n${query}\n\`\`\`\n\n`;
        });
      });

      // Download the file
      const blob = new Blob([mdContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `query-preview-${Date.now()}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Query preview downloaded");
    } catch (error) {
      console.error('Error:', error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsGeneratingQueries(false);
    }
  };

  const handleExportLifeline = async () => {
    if (!selectedLifelineId) {
      toast.error("Please select a lifeline first");
      return;
    }

    setIsExporting(true);
    toast.info("Exporting lifeline data...");

    try {
      // Fetch lifeline with collection
      const { data: lifeline, error: lifelineError } = await supabase
        .from("lifelines")
        .select(`
          *,
          collections (
            id,
            title,
            description,
            category
          )
        `)
        .eq("id", selectedLifelineId)
        .single();

      if (lifelineError) throw lifelineError;

      // Fetch entries
      const { data: entries, error: entriesError } = await supabase
        .from("entries")
        .select("*")
        .eq("lifeline_id", selectedLifelineId)
        .order("occurred_on");

      if (entriesError) throw entriesError;

      // Build MD content
      let mdContent = ``;
      
      // Add collection info if exists
      if (lifeline.collections) {
        const collection = lifeline.collections as any;
        mdContent += `# Collection: ${collection.title}\n\n`;
        if (collection.description) {
          mdContent += `${collection.description}\n\n`;
        }
        if (collection.category) {
          mdContent += `**Category:** ${collection.category}\n\n`;
        }
        mdContent += `---\n\n`;
      }

      // Add lifeline info
      mdContent += `# Lifeline: ${lifeline.title}\n\n`;
      if (lifeline.subtitle) {
        mdContent += `**${lifeline.subtitle}**\n\n`;
      }
      if (lifeline.intro) {
        mdContent += `## Introduction\n\n${lifeline.intro}\n\n`;
      }

      // Add entries
      if (entries && entries.length > 0) {
        mdContent += `## Timeline Events\n\n`;
        entries.forEach((entry: any, index: number) => {
          mdContent += `### ${index + 1}. ${entry.title}\n\n`;
          if (entry.occurred_on) {
            mdContent += `**Date:** ${new Date(entry.occurred_on).toLocaleDateString()}\n\n`;
          }
          if (entry.summary) {
            mdContent += `${entry.summary}\n\n`;
          }
          if (entry.details) {
            mdContent += `**Details:**\n\n${entry.details}\n\n`;
          }
          mdContent += `---\n\n`;
        });
      }

      if (lifeline.conclusion) {
        mdContent += `## Conclusion\n\n${lifeline.conclusion}\n\n`;
      }

      // Download the file
      const blob = new Blob([mdContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${lifeline.slug}-lifeline-${Date.now()}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Lifeline data exported");
    } catch (error) {
      console.error('Error:', error);
      toast.error("Failed to export lifeline");
    } finally {
      setIsExporting(false);
    }
  };

  const handlePositionSave = (position: { x: number; y: number; scale: number }) => {
    if (!editingImage) return;
    updatePositionMutation.mutate({
      mediaAssetId: editingImage.mediaAssetId,
      position,
    });
    setEditingImage(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Lifeline Image Manager</h1>
          <p className="text-muted-foreground mt-2">
            Select a lifeline to manage images, search for new ones, and adjust positioning
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select Lifeline</CardTitle>
            <CardDescription>Choose which lifeline you want to add or manage images for</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedLifelineId} onValueChange={setSelectedLifelineId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a lifeline..." />
              </SelectTrigger>
              <SelectContent>
                {lifelines?.map((lifeline) => (
                  <SelectItem key={lifeline.id} value={lifeline.id}>
                    {lifeline.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex gap-2">
              <Button
                onClick={handleLoadImages}
                disabled={!selectedLifelineId || isSearching}
                className="flex-1"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Load Images
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleReturnQuery}
                disabled={!selectedLifelineId || isGeneratingQueries}
                variant="outline"
                className="flex-1"
              >
                {isGeneratingQueries ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Return Query
                  </>
                )}
              </Button>

              <Button
                onClick={handleExportLifeline}
                disabled={!selectedLifelineId || isExporting}
                variant="outline"
                className="flex-1"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Export Lifeline as MD
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {selectedLifelineId && (
          <Card>
            <CardHeader>
              <CardTitle>Events & Images</CardTitle>
              <CardDescription>
                Click on any image to adjust its position and zoom
              </CardDescription>
            </CardHeader>
            <CardContent>
              {entriesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : entries && entries.length > 0 ? (
                <div className="space-y-4">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div>
                        <h3 className="font-semibold">{entry.title}</h3>
                        {entry.occurred_on && (
                          <p className="text-sm text-muted-foreground">
                            {new Date(entry.occurred_on).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      {entry.media.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {entry.media.map((media) => (
                            <button
                              key={media.id}
                              onClick={() =>
                                setEditingImage({
                                  mediaAssetId: media.media_assets.id,
                                  url: media.media_assets.url,
                                  position: {
                                    x: media.media_assets.position_x,
                                    y: media.media_assets.position_y,
                                    scale: media.media_assets.scale,
                                  },
                                })
                              }
                              className="relative aspect-video rounded-md overflow-hidden border-2 border-transparent hover:border-primary transition-colors group"
                            >
                              <img
                                src={media.media_assets.url}
                                alt=""
                                className="w-full h-full object-cover"
                                style={{
                                  objectPosition: `${media.media_assets.position_x}% ${media.media_assets.position_y}%`,
                                  transform: `scale(${media.media_assets.scale})`,
                                }}
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                  Click to adjust
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-muted-foreground py-4">
                          <ImageIcon className="h-4 w-4" />
                          <span className="text-sm">No images yet</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No events found for this lifeline
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {editingImage && (
        <ImagePositionPicker
          imageUrl={editingImage.url}
          initialPosition={editingImage.position}
          onPositionChange={handlePositionSave}
          open={!!editingImage}
          onOpenChange={(open) => !open && setEditingImage(null)}
          title="Adjust Image Position"
          viewType="both"
        />
      )}

    </AdminLayout>
  );
}
