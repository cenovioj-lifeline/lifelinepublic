import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function Collections() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<any>(null);
  const [deletionStats, setDeletionStats] = useState<any>(null);

  const { data: collections, isLoading } = useQuery({
    queryKey: ["collections", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("collections")
        .select("*")
        .order("updated_at", { ascending: false });

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,slug.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const deleteCollectionMutation = useMutation({
    mutationFn: async (collectionId: string) => {
      const { data, error } = await supabase.functions.invoke('delete-collection', {
        body: { collectionId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Collection deleted",
        description: `Deleted ${data.deletedCounts.lifelines} lifelines and ${data.deletedCounts.entries} entries`,
      });
      if (data.storageFailures.length > 0) {
        toast({
          title: "Storage warning",
          description: `${data.storageFailures.length} storage files could not be deleted`,
          variant: "destructive",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      setDeleteDialogOpen(false);
      setCollectionToDelete(null);
      setDeletionStats(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete collection",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleDeleteClick = async (collection: any, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Fetch deletion stats
    const { data: lifelines } = await supabase
      .from('lifelines')
      .select('id')
      .eq('collection_id', collection.id);
    
    const lifelineIds = lifelines?.map(l => l.id) || [];
    
    let entriesCount = 0;
    let imagesCount = 0;
    let favoritesCount = 0;
    
    if (lifelineIds.length > 0) {
      const { count: eCount } = await supabase
        .from('entries')
        .select('*', { count: 'exact', head: true })
        .in('lifeline_id', lifelineIds);
      entriesCount = eCount || 0;

      const { data: entries } = await supabase
        .from('entries')
        .select('id')
        .in('lifeline_id', lifelineIds);
      
      const entryIds = entries?.map(e => e.id) || [];
      
      if (entryIds.length > 0) {
        const { count: iCount } = await supabase
          .from('entry_images')
          .select('*', { count: 'exact', head: true })
          .in('entry_id', entryIds);
        imagesCount = iCount || 0;
      }

      const { count: fCount } = await supabase
        .from('user_favorites')
        .select('*', { count: 'exact', head: true })
        .eq('item_type', 'lifeline')
        .in('item_id', lifelineIds);
      favoritesCount = fCount || 0;
    }

    const { count: cFavCount } = await supabase
      .from('user_favorites')
      .select('*', { count: 'exact', head: true })
      .eq('item_type', 'collection')
      .eq('item_id', collection.id);
    
    favoritesCount += cFavCount || 0;

    const { count: electionsCount } = await supabase
      .from('mock_elections')
      .select('*', { count: 'exact', head: true })
      .eq('collection_id', collection.id);

    setDeletionStats({
      lifelines: lifelineIds.length,
      entries: entriesCount,
      images: imagesCount,
      favorites: favoritesCount,
      elections: electionsCount || 0,
    });
    
    setCollectionToDelete(collection);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (collectionToDelete) {
      deleteCollectionMutation.mutate(collectionToDelete.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Collections</h1>
          <p className="text-muted-foreground">
            Manage themed collections of lifelines and content
          </p>
        </div>
        <Button onClick={() => navigate("/collections/new")}>
          <Plus className="mr-2 h-4 w-4" />
          New Collection
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search collections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Featured</TableHead>
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
            ) : collections?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No collections found
                </TableCell>
              </TableRow>
            ) : (
              collections?.map((collection) => (
                <TableRow
                  key={collection.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/collections/${collection.id}`)}
                >
                  <TableCell className="font-medium">{collection.title}</TableCell>
                  <TableCell className="text-muted-foreground">{collection.slug}</TableCell>
                  <TableCell>
                    <Badge variant={collection.status === "published" ? "default" : "secondary"}>
                      {collection.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {collection.is_featured && <Badge variant="outline">Featured</Badge>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(collection.updated_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/collections/${collection.id}`);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteClick(collection, e)}
                        disabled={deleteCollectionMutation.isPending}
                        className="hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{collectionToDelete?.title}"?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p className="font-semibold">This will permanently delete:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>{deletionStats?.lifelines || 0} lifelines</li>
                <li>{deletionStats?.entries || 0} events/entries</li>
                <li>{deletionStats?.images || 0} images from storage</li>
              </ul>
              
              {(deletionStats?.favorites > 0 || deletionStats?.elections > 0) && (
                <>
                  <p className="font-semibold mt-4">This will also:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {deletionStats?.favorites > 0 && (
                      <li>Remove {deletionStats.favorites} user favorites</li>
                    )}
                    {deletionStats?.elections > 0 && (
                      <li>Orphan {deletionStats.elections} elections (they'll remain but won't be in a collection)</li>
                    )}
                    <li>Clear profile references to this collection</li>
                  </ul>
                </>
              )}
              
              <p className="text-destructive font-semibold mt-4">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteCollectionMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteCollectionMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCollectionMutation.isPending ? "Deleting..." : "Delete Collection"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
