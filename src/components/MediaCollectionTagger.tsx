import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MediaCollectionTaggerProps {
  selectedIds: string[];
  onComplete: () => void;
}

export function MediaCollectionTagger({ selectedIds, onComplete }: MediaCollectionTaggerProps) {
  const [collectionName, setCollectionName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleTagCollection = async () => {
    if (!collectionName.trim() || selectedIds.length === 0) return;

    setIsSubmitting(true);
    try {
      // Get current collection_tags for each media asset
      const { data: mediaAssets } = await supabase
        .from("media_assets")
        .select("id, collection_tags")
        .in("id", selectedIds);

      if (mediaAssets) {
        // Update each media asset with the new collection tag
        const updates = mediaAssets.map(asset => ({
          id: asset.id,
          collection_tags: Array.from(new Set([...(asset.collection_tags || []), collectionName.trim()]))
        }));

        for (const update of updates) {
          await supabase
            .from("media_assets")
            .update({ collection_tags: update.collection_tags })
            .eq("id", update.id);
        }
      }

      toast({
        title: "Success",
        description: `${selectedIds.length} media item(s) tagged with "${collectionName}"`,
      });

      setCollectionName("");
      onComplete();
    } catch (error) {
      console.error("Tagging error:", error);
      toast({
        title: "Error",
        description: "Failed to tag media items",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" disabled={selectedIds.length === 0}>
          <Tag className="mr-2 h-4 w-4" />
          Tag Collection
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Tag with Collection</h4>
            <p className="text-sm text-muted-foreground">
              Add {selectedIds.length} item(s) to a collection group
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Collection name..."
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleTagCollection();
                }
              }}
            />
            <Button onClick={handleTagCollection} disabled={isSubmitting || !collectionName.trim()}>
              Add
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
