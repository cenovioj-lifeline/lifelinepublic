import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Search, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MediaUploadDialog } from "@/components/MediaUploadDialog";
import { MediaCollectionTagger } from "@/components/MediaCollectionTagger";

export default function Media() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [collectionFilter, setCollectionFilter] = useState<string>("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const { data: media, isLoading, refetch } = useQuery({
    queryKey: ["media", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("media_assets")
        .select("*")
        .order("created_at", { ascending: false });

      if (searchTerm) {
        query = query.or(`filename.ilike.%${searchTerm}%,alt_text.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Get unique collection tags from all media
  const allCollectionTags = Array.from(
    new Set(media?.flatMap(m => m.collection_tags || []) || [])
  ).sort();

  // Filter media by collection
  const filteredMedia = collectionFilter
    ? media?.filter(m => m.collection_tags?.includes(collectionFilter))
    : media;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredMedia?.map(m => m.id) || []);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  const handleRemoveTag = async (mediaId: string, tagToRemove: string) => {
    const mediaItem = media?.find(m => m.id === mediaId);
    if (!mediaItem) return;

    const updatedTags = (mediaItem.collection_tags || []).filter(tag => tag !== tagToRemove);
    
    await supabase
      .from("media_assets")
      .update({ collection_tags: updatedTags })
      .eq("id", mediaId);
    
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
          <p className="text-muted-foreground">
            Manage images, videos, and other media assets
          </p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Media
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search media..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        {allCollectionTags.length > 0 && (
          <Select value={collectionFilter} onValueChange={setCollectionFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by collection" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All collections</SelectItem>
              {allCollectionTags.map(tag => (
                <SelectItem key={tag} value={tag}>{tag}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{selectedIds.length} selected</Badge>
            <MediaCollectionTagger 
              selectedIds={selectedIds} 
              onComplete={() => {
                setSelectedIds([]);
                refetch();
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds([])}
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedIds.length > 0 && selectedIds.length === filteredMedia?.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Preview</TableHead>
              <TableHead>Filename</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Dimensions</TableHead>
              <TableHead>Collections</TableHead>
              <TableHead>Uploaded</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredMedia?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No media found
                </TableCell>
              </TableRow>
            ) : (
              filteredMedia?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(item.id)}
                      onCheckedChange={(checked) => handleSelectOne(item.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell>
                    {item.type.startsWith("image") ? (
                      <img
                        src={item.url}
                        alt={item.alt_text || item.filename}
                        className="h-12 w-12 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded bg-muted">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{item.filename}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.type}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.width && item.height ? `${item.width} × ${item.height}` : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {item.collection_tags && item.collection_tags.length > 0 ? (
                        item.collection_tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="gap-1">
                            {tag}
                            <button
                              onClick={() => handleRemoveTag(item.id, tag)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <MediaUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUploadComplete={() => refetch()}
      />
    </div>
  );
}
