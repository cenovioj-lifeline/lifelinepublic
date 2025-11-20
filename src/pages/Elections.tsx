import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, ArrowUpDown, Trash2 } from "lucide-react";
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

export default function Elections() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [electionToDelete, setElectionToDelete] = useState<any>(null);
  const [deletionStats, setDeletionStats] = useState<any>(null);

  const { data: elections, isLoading } = useQuery({
    queryKey: ["elections", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("mock_elections")
        .select("*, collections(title)")
        .order("updated_at", { ascending: false });

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,slug.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const deleteElectionMutation = useMutation({
    mutationFn: async (electionId: string) => {
      const { data, error } = await supabase.functions.invoke('delete-election', {
        body: { electionId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Election deleted",
        description: `Deleted ${data.deletedCounts.ballotItems} ballot items and ${data.deletedCounts.results} results`,
      });
      if (data.storageFailures.length > 0) {
        toast({
          title: "Storage warning",
          description: `${data.storageFailures.length} storage files could not be deleted`,
          variant: "destructive",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["elections"] });
      setDeleteDialogOpen(false);
      setElectionToDelete(null);
      setDeletionStats(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete election",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleDeleteClick = async (election: any, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Fetch deletion stats
    const { data: ballotItems } = await supabase
      .from('ballot_items')
      .select('id')
      .eq('election_id', election.id);
    
    const ballotItemIds = ballotItems?.map(item => item.id) || [];
    
    let ballotOptionsCount = 0;
    let resultsCount = 0;
    let favoritesCount = 0;
    
    if (ballotItemIds.length > 0) {
      const { count: optionsCount } = await supabase
        .from('ballot_options')
        .select('*', { count: 'exact', head: true })
        .in('ballot_item_id', ballotItemIds);
      ballotOptionsCount = optionsCount || 0;
    }

    const { count: rCount } = await supabase
      .from('election_results')
      .select('*', { count: 'exact', head: true })
      .eq('election_id', election.id);
    resultsCount = rCount || 0;

    const { count: fCount } = await supabase
      .from('user_favorites')
      .select('*', { count: 'exact', head: true })
      .eq('item_id', election.id)
      .eq('item_type', 'election');
    favoritesCount = fCount || 0;

    setElectionToDelete(election);
    setDeletionStats({
      ballotItems: ballotItemIds.length,
      ballotOptions: ballotOptionsCount,
      results: resultsCount,
      favorites: favoritesCount,
    });
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mock Election Results</h1>
          <p className="text-muted-foreground">
            Manage mock election results and outcomes
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate("/elections-category-order")}
          >
            <ArrowUpDown className="mr-2 h-4 w-4" />
            Order Categories
          </Button>
          <Button onClick={() => navigate("/elections/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New MER
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search mock election results..."
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
              <TableHead>Collection</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : elections?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No mock election results found
                </TableCell>
              </TableRow>
            ) : (
              elections?.map((election) => (
                <TableRow
                  key={election.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/elections/${election.id}`)}
                >
                  <TableCell className="font-medium">{election.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {election.collections?.title || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={election.status === "published" ? "default" : "secondary"}>
                      {election.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(election.updated_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/elections/${election.id}`);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteClick(election, e)}
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
            <AlertDialogTitle>Delete Mock Election Result</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{electionToDelete?.title}</strong>?
              <br /><br />
              This will permanently delete:
              <ul className="list-disc list-inside mt-2 space-y-1">
                {deletionStats && (
                  <>
                    <li>{deletionStats.ballotItems} ballot items</li>
                    <li>{deletionStats.ballotOptions} ballot options</li>
                    <li>{deletionStats.results} election results</li>
                    <li>{deletionStats.favorites} user favorites</li>
                  </>
                )}
              </ul>
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (electionToDelete) {
                  deleteElectionMutation.mutate(electionToDelete.id);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
