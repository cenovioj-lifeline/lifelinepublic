import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CollectionManageLayout } from "@/components/manage/CollectionManageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, ArrowLeft, ArrowUp, ArrowDown, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Entry = {
  id: string;
  title: string;
  summary: string | null;
  details: string | null;
  occurred_on: string | null;
  sentiment: "positive" | "negative" | "neutral" | "mixed" | null;
  score: number | null;
  order_index: number;
  sequence_label: string | null;
};

export default function CollectionManageEntries() {
  const { slug, lifelineId } = useParams<{ slug: string; lifelineId: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<Entry | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    details: "",
    occurred_on: "",
    sentiment: "neutral" as "positive" | "negative" | "neutral" | "mixed",
    score: "",
    sequence_label: "",
  });

  // Fetch collection
  const { data: collection } = useQuery({
    queryKey: ["manage-collection", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("id, title, slug")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Fetch lifeline
  const { data: lifeline } = useQuery({
    queryKey: ["manage-lifeline", lifelineId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lifelines")
        .select("id, title, slug")
        .eq("id", lifelineId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!lifelineId,
  });

  // Fetch entries
  const { data: entries, isLoading } = useQuery({
    queryKey: ["manage-entries", lifelineId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entries")
        .select("id, title, summary, details, occurred_on, sentiment, score, order_index, sequence_label")
        .eq("lifeline_id", lifelineId)
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data as Entry[];
    },
    enabled: !!lifelineId,
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      const entryData = {
        title: data.title,
        summary: data.summary || null,
        details: data.details || null,
        occurred_on: data.occurred_on || null,
        sentiment: data.sentiment,
        score: data.score ? parseFloat(data.score) : null,
        sequence_label: data.sequence_label || null,
        lifeline_id: lifelineId,
        collection_id: collection?.id,
      };

      if (data.id) {
        const { error } = await supabase
          .from("entries")
          .update(entryData)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        // Get max order_index
        const maxOrder = entries?.reduce((max, e) => Math.max(max, e.order_index), -1) ?? -1;
        const { error } = await supabase
          .from("entries")
          .insert({ ...entryData, order_index: maxOrder + 1 });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manage-entries", lifelineId] });
      setIsDialogOpen(false);
      setEditingEntry(null);
      resetForm();
      toast({
        title: editingEntry ? "Entry updated" : "Entry created",
        description: "The entry has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manage-entries", lifelineId] });
      setDeleteEntry(null);
      toast({
        title: "Entry deleted",
        description: "The entry has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async ({ entryId, direction }: { entryId: string; direction: "up" | "down" }) => {
      if (!entries) return;
      const currentIndex = entries.findIndex((e) => e.id === entryId);
      const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      
      if (swapIndex < 0 || swapIndex >= entries.length) return;

      const currentEntry = entries[currentIndex];
      const swapEntry = entries[swapIndex];

      // Swap order_index values
      await supabase
        .from("entries")
        .update({ order_index: swapEntry.order_index })
        .eq("id", currentEntry.id);
      await supabase
        .from("entries")
        .update({ order_index: currentEntry.order_index })
        .eq("id", swapEntry.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manage-entries", lifelineId] });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      summary: "",
      details: "",
      occurred_on: "",
      sentiment: "neutral",
      score: "",
      sequence_label: "",
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setEditingEntry(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (entry: Entry) => {
    setEditingEntry(entry);
    setFormData({
      title: entry.title,
      summary: entry.summary || "",
      details: entry.details || "",
      occurred_on: entry.occurred_on || "",
      sentiment: entry.sentiment || "neutral",
      score: entry.score?.toString() || "",
      sequence_label: entry.sequence_label || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      ...formData,
      id: editingEntry?.id,
    });
  };

  const filteredEntries = entries?.filter((entry) =>
    entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.summary?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSentimentColor = (sentiment: string | null) => {
    switch (sentiment) {
      case "positive":
        return "bg-green-100 text-green-800";
      case "negative":
        return "bg-red-100 text-red-800";
      case "mixed":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <CollectionManageLayout>
      <div className="space-y-6">
        {/* Header with back link */}
        <div className="flex items-center gap-4">
          <Link to={`/public/collections/${slug}/manage/lifelines`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Lifelines
            </Button>
          </Link>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Manage Entries</h1>
            {lifeline && (
              <p className="text-muted-foreground">
                Lifeline: {lifeline.title}
              </p>
            )}
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Entries Table */}
        {isLoading ? (
          <div>Loading entries...</div>
        ) : filteredEntries && filteredEntries.length > 0 ? (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Sentiment</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="w-32">Order</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry, index) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-muted-foreground">
                      {entry.sequence_label || entry.order_index + 1}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{entry.title}</div>
                        {entry.summary && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {entry.summary}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {entry.occurred_on || "-"}
                    </TableCell>
                    <TableCell>
                      {entry.sentiment && (
                        <Badge variant="secondary" className={getSentimentColor(entry.sentiment)}>
                          {entry.sentiment}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {entry.score !== null ? entry.score : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => reorderMutation.mutate({ entryId: entry.id, direction: "up" })}
                          disabled={index === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => reorderMutation.mutate({ entryId: entry.id, direction: "down" })}
                          disabled={index === filteredEntries.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(entry)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteEntry(entry)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            {searchQuery ? "No entries match your search." : "No entries yet. Create one to get started."}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? "Edit Entry" : "Create Entry"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="details">Details</Label>
              <Textarea
                id="details"
                value={formData.details}
                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="occurred_on">Date</Label>
                <Input
                  id="occurred_on"
                  value={formData.occurred_on}
                  onChange={(e) => setFormData({ ...formData, occurred_on: e.target.value })}
                  placeholder="e.g., 2024 or January 15, 2024"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sequence_label">Sequence Label</Label>
                <Input
                  id="sequence_label"
                  value={formData.sequence_label}
                  onChange={(e) => setFormData({ ...formData, sequence_label: e.target.value })}
                  placeholder="e.g., 1, 2a, etc."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sentiment">Sentiment</Label>
                <Select
                  value={formData.sentiment}
                  onValueChange={(value: "positive" | "negative" | "neutral" | "mixed") =>
                    setFormData({ ...formData, sentiment: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positive">Positive</SelectItem>
                    <SelectItem value="negative">Negative</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="score">Score</Label>
                <Input
                  id="score"
                  type="number"
                  step="0.1"
                  value={formData.score}
                  onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                  placeholder="e.g., 7.5"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : editingEntry ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteEntry} onOpenChange={() => setDeleteEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteEntry?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteEntry && deleteMutation.mutate(deleteEntry.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CollectionManageLayout>
  );
}
