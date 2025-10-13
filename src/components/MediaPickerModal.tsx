import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ImageIcon, Search, Check, Move } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ImagePositionPicker } from "./ImagePositionPicker";

interface MediaPickerModalProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  allowNone?: boolean;
}

export function MediaPickerModal({
  value,
  onValueChange,
  placeholder = "Select an image",
  allowNone = true,
}: MediaPickerModalProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [positionPickerOpen, setPositionPickerOpen] = useState(false);
  const [selectedImageForPosition, setSelectedImageForPosition] = useState<string | null>(null);

  const { data: mediaAssets } = useQuery({
    queryKey: ["media-assets-picker"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media_assets")
        .select("id, filename, url, type, alt_text")
        .eq("type", "image")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const selectedMedia = mediaAssets?.find(m => m.id === value);

  const filteredMedia = mediaAssets?.filter(media => 
    media.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    media.alt_text?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (mediaId: string) => {
    onValueChange(mediaId);
    setOpen(false);
  };

  const handlePositionImage = (mediaUrl: string) => {
    setSelectedImageForPosition(mediaUrl);
    setPositionPickerOpen(true);
  };

  const handleClear = () => {
    onValueChange("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-left font-normal">
          {value && selectedMedia ? (
            <div className="flex items-center gap-2 w-full">
              <img
                src={selectedMedia.url}
                alt={selectedMedia.filename}
                className="h-6 w-6 rounded object-cover"
              />
              <span className="truncate flex-1">{selectedMedia.filename}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{placeholder}</span>
            </div>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select Cover Image</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search images..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[500px] pr-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {allowNone && (
                <button
                  onClick={handleClear}
                  className={cn(
                    "relative aspect-video rounded-lg border-2 border-dashed transition-colors hover:border-primary",
                    !value && "border-primary bg-primary/5"
                  )}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">No Image</span>
                  </div>
                  {!value && (
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </button>
              )}
              
              {filteredMedia?.map((media) => (
                <div key={media.id} className="relative group">
                  <button
                    onClick={() => handleSelect(media.id)}
                    className={cn(
                      "relative aspect-video rounded-lg border-2 overflow-hidden transition-all hover:border-primary hover:shadow-lg w-full",
                      value === media.id ? "border-primary ring-2 ring-primary ring-offset-2" : "border-border"
                    )}
                  >
                    <img
                      src={media.url}
                      alt={media.alt_text || media.filename}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <p className="text-xs text-white truncate">{media.filename}</p>
                    </div>
                    {value === media.id && (
                      <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute top-2 left-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePositionImage(media.url);
                    }}
                  >
                    <Move className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {filteredMedia?.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ImageIcon className="h-12 w-12 mb-4" />
                <p className="text-lg font-medium">No images found</p>
                <p className="text-sm">Try adjusting your search</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>

      {selectedImageForPosition && (
        <ImagePositionPicker
          imageUrl={selectedImageForPosition}
          open={positionPickerOpen}
          onOpenChange={setPositionPickerOpen}
          onPositionChange={(position) => {
            console.log("Image position:", position);
            // Position can be saved to media_assets table if needed
          }}
        />
      )}
    </Dialog>
  );
}
