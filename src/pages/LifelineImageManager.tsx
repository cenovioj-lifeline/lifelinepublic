import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImagePositionPicker } from "@/components/ImagePositionPicker";
import { toast } from "sonner";
import { Loader2, Image as ImageIcon, Search } from "lucide-react";

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

  const handleFindImages = async () => {
    if (!selectedLifelineId) {
      toast.error("Please select a lifeline first");
      return;
    }

    setIsSearching(true);
    toast.info("Finding and importing images... This may take a minute");

    try {
      const { data, error } = await supabase.functions.invoke('find-and-import-lifeline-images', {
        body: { lifelineId: selectedLifelineId }
      });

      if (error) {
        console.error('Error finding images:', error);
        toast.error(error.message || "Failed to find images");
        return;
      }

      // Refetch entries to show newly imported images
      await queryClient.invalidateQueries({ queryKey: ['lifeline-entries-with-media', selectedLifelineId] });

      const { imported, failed, skipped, processed } = data;
      toast.success(`Import complete: ${imported} images imported, ${failed} failed, ${skipped} already had images`);
    } catch (error) {
      console.error('Error:', error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSearching(false);
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
            <div className="flex gap-4">
              <Select value={selectedLifelineId} onValueChange={setSelectedLifelineId}>
                <SelectTrigger className="flex-1">
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
              
              <Button
                onClick={handleFindImages}
                disabled={!selectedLifelineId || isSearching}
              >
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Find Images
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
