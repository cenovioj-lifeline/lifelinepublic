import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const FILTER_STORAGE_KEY = "lifelines-filters";

export default function Lifelines() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Load saved filters from localStorage
  const savedFilters = localStorage.getItem(FILTER_STORAGE_KEY);
  const initialFilters = savedFilters ? JSON.parse(savedFilters) : {
    searchTerm: "",
    collectionFilter: "all",
    pictureFilter: "all",
    lifelineTypeFilter: "all"
  };

  const [searchTerm, setSearchTerm] = useState(initialFilters.searchTerm);
  const [collectionFilter, setCollectionFilter] = useState<string>(initialFilters.collectionFilter);
  const [pictureFilter, setPictureFilter] = useState<string>(initialFilters.pictureFilter);
  const [lifelineTypeFilter, setLifelineTypeFilter] = useState<string>(initialFilters.lifelineTypeFilter);
  const [deletingLifeline, setDeletingLifeline] = useState<{ id: string; title: string } | null>(null);
  const [selectedLifelines, setSelectedLifelines] = useState<string[]>([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify({
      searchTerm,
      collectionFilter,
      pictureFilter,
      lifelineTypeFilter
    }));
  }, [searchTerm, collectionFilter, pictureFilter, lifelineTypeFilter]);

  const { data: collections } = useQuery({
    queryKey: ["collections-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("id, title")
        .order("title");
      if (error) throw error;
      return data;
    },
  });

  const { data: lifelines, isLoading } = useQuery({
    queryKey: ["lifelines", searchTerm, collectionFilter, pictureFilter, lifelineTypeFilter],
    queryFn: async () => {
      let query = supabase
        .from("lifelines")
        .select("*, profiles(name), collections(title)")
        .order("updated_at", { ascending: false });

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,slug.ilike.%${searchTerm}%`);
      }

      if (collectionFilter && collectionFilter !== "all") {
        query = query.eq("collection_id", collectionFilter);
      }

      if (pictureFilter === "with-pic") {
        query = query.not("cover_image_url", "is", null);
      } else if (pictureFilter === "without-pic") {
        query = query.is("cover_image_url", null);
      }

      if (lifelineTypeFilter && lifelineTypeFilter !== "all") {
        query = query.eq("lifeline_type", lifelineTypeFilter as "person" | "list" | "voting" | "rating");
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const deleteLifelineMutation = useMutation({
    mutationFn: async (lifelineIds: string[]) => {
      // Process each lifeline deletion
      for (const lifelineId of lifelineIds) {
        // Clean up all references to this lifeline
        
        // 1. Delete from home_page_featured_items
        await supabase
          .from("home_page_featured_items")
          .delete()
          .eq("item_type", "lifeline")
          .eq("item_id", lifelineId);

        // 2. Delete from home_page_new_content_items
        await supabase
          .from("home_page_new_content_items")
          .delete()
          .eq("item_type", "lifeline")
          .eq("item_id", lifelineId);

        // 3. Delete from profile_lifelines
        await supabase
          .from("profile_lifelines")
          .delete()
          .eq("lifeline_id", lifelineId);

        // 4. Delete lifeline_tags
        await supabase
          .from("lifeline_tags")
          .delete()
          .eq("lifeline_id", lifelineId);

        // 5. Get all entries for this lifeline
        const { data: entries } = await supabase
          .from("entries")
          .select("id")
          .eq("lifeline_id", lifelineId);

        if (entries && entries.length > 0) {
          const entryIds = entries.map(e => e.id);

          // Delete entry_media relationships
          await supabase
            .from("entry_media")
            .delete()
            .in("entry_id", entryIds);

          // Delete entry_images
          await supabase
            .from("entry_images")
            .delete()
            .in("entry_id", entryIds);

          // Delete entry_votes
          await supabase
            .from("entry_votes")
            .delete()
            .in("entry_id", entryIds);

          // Delete fan_contributions referencing these entries
          await supabase
            .from("fan_contributions")
            .delete()
            .in("entry_id", entryIds);

          // Delete entries themselves
          await supabase
            .from("entries")
            .delete()
            .eq("lifeline_id", lifelineId);
        }

        // 6. Delete user_favorites
        await supabase
          .from("user_favorites")
          .delete()
          .eq("item_type", "lifeline")
          .eq("item_id", lifelineId);

        // 7. Delete fan_contributions for this lifeline
        await supabase
          .from("fan_contributions")
          .delete()
          .eq("lifeline_id", lifelineId);

        // 8. Finally, delete the lifeline itself
        const { error } = await supabase
          .from("lifelines")
          .delete()
          .eq("id", lifelineId);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lifelines"] });
      const count = selectedLifelines.length || 1;
      toast.success(`${count} lifeline${count > 1 ? 's' : ''} deleted successfully`);
      setDeletingLifeline(null);
      setSelectedLifelines([]);
      setShowBulkDeleteDialog(false);
    },
    onError: (error: Error) => {
      console.error("Delete error:", error);
      toast.error(`Failed to delete lifeline: ${error.message}`);
    },
  });

  const handleDeleteClick = (e: React.MouseEvent, lifeline: any) => {
    e.stopPropagation();
    setDeletingLifeline({ id: lifeline.id, title: lifeline.title });
  };

  const handleDeleteConfirm = () => {
    if (deletingLifeline) {
      deleteLifelineMutation.mutate([deletingLifeline.id]);
    }
  };

  const handleBulkDelete = () => {
    setShowBulkDeleteDialog(true);
  };

  const handleBulkDeleteConfirm = () => {
    deleteLifelineMutation.mutate(selectedLifelines);
  };

  const toggleLifelineSelection = (id: string) => {
    setSelectedLifelines(prev =>
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedLifelines.length === lifelines?.length) {
      setSelectedLifelines([]);
    } else {
      setSelectedLifelines(lifelines?.map(l => l.id) || []);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lifelines</h1>
          <p className="text-muted-foreground">
            Manage scored timeline narratives with entries
          </p>
        </div>
        <div className="flex gap-2">
          {selectedLifelines.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={handleBulkDelete}
              disabled={deleteLifelineMutation.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete {selectedLifelines.length} Selected
            </Button>
          )}
          <Button onClick={() => navigate("/lifelines/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Lifeline
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search lifelines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={collectionFilter} onValueChange={setCollectionFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Collections" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Collections</SelectItem>
            {collections?.map((collection) => (
              <SelectItem key={collection.id} value={collection.id}>
                {collection.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={lifelineTypeFilter} onValueChange={setLifelineTypeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="person">Person</SelectItem>
            <SelectItem value="list">List</SelectItem>
            <SelectItem value="rating">Rating</SelectItem>
            <SelectItem value="voting">Voting</SelectItem>
          </SelectContent>
        </Select>
        <Select value={pictureFilter} onValueChange={setPictureFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Picture Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Pictures</SelectItem>
            <SelectItem value="with-pic">With Picture</SelectItem>
            <SelectItem value="without-pic">Without Picture</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedLifelines.length === lifelines?.length && lifelines?.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="w-[100px]">Cover Image</TableHead>
              <TableHead>Lifeline Name</TableHead>
              <TableHead>Collection</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : lifelines?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No lifelines found
                </TableCell>
              </TableRow>
            ) : (
              lifelines?.map((lifeline) => (
                <TableRow
                  key={lifeline.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/lifelines/${lifeline.id}`)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedLifelines.includes(lifeline.id)}
                      onCheckedChange={() => toggleLifelineSelection(lifeline.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="w-20 h-20 rounded overflow-hidden bg-muted flex items-center justify-center">
                      {lifeline.cover_image_url ? (
                        <img
                          src={lifeline.cover_image_url}
                          alt={lifeline.title}
                          className="w-full h-full object-cover"
                          style={{
                            objectPosition: `${lifeline.cover_image_position_x || 50}% ${lifeline.cover_image_position_y || 50}%`
                          }}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">No image</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{lifeline.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {lifeline.collections?.title || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(lifeline.updated_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/lifelines/${lifeline.id}`);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteClick(e, lifeline)}
                        disabled={deleteLifelineMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deletingLifeline} onOpenChange={(open) => !open && setDeletingLifeline(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lifeline</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingLifeline?.title}"? This will permanently remove:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>The lifeline and all its entries</li>
                <li>All images and media associated with entries</li>
                <li>All votes and fan contributions</li>
                <li>References from home page and profiles</li>
                <li>All tags and relationships</li>
              </ul>
              <p className="mt-2 font-semibold">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Lifeline
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedLifelines.length} Lifelines</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedLifelines.length} selected lifeline{selectedLifelines.length > 1 ? 's' : ''}? This will permanently remove:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All selected lifelines and their entries</li>
                <li>All images and media associated with entries</li>
                <li>All votes and fan contributions</li>
                <li>References from home page and profiles</li>
                <li>All tags and relationships</li>
              </ul>
              <p className="mt-2 font-semibold">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete {selectedLifelines.length} Lifelines
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
