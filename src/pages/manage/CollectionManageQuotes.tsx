import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CollectionManageLayout } from "@/components/manage/CollectionManageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Quote } from "lucide-react";

interface CollectionQuote {
  id: string;
  quote: string;
  author: string | null;
  context: string | null;
  created_at: string;
}

export default function CollectionManageQuotes() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQuote, setSelectedQuote] = useState<CollectionQuote | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(searchParams.get("action") === "new");

  // Form state
  const [formQuote, setFormQuote] = useState("");
  const [formAuthor, setFormAuthor] = useState("");
  const [formContext, setFormContext] = useState("");

  // Fetch collection
  const { data: collection } = useQuery({
    queryKey: ["manage-collection", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("id, title")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  // Fetch quotes
  const { data: quotes, isLoading } = useQuery({
    queryKey: ["manage-quotes", collection?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collection_quotes")
        .select("*")
        .eq("collection_id", collection!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CollectionQuote[];
    },
    enabled: !!collection?.id,
  });

  // Create quote mutation
  const createMutation = useMutation({
    mutationFn: async (data: { quote: string; author: string; context: string }) => {
      const { error } = await supabase.from("collection_quotes").insert({
        collection_id: collection!.id,
        quote: data.quote,
        author: data.author || null,
        context: data.context || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manage-quotes"] });
      toast.success("Quote added");
      resetForm();
    },
    onError: () => {
      toast.error("Failed to add quote");
    },
  });

  // Update quote mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; quote: string; author: string; context: string }) => {
      const { error } = await supabase
        .from("collection_quotes")
        .update({
          quote: data.quote,
          author: data.author || null,
          context: data.context || null,
        })
        .eq("id", data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manage-quotes"] });
      toast.success("Quote updated");
      resetForm();
    },
    onError: () => {
      toast.error("Failed to update quote");
    },
  });

  // Delete quote mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("collection_quotes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manage-quotes"] });
      toast.success("Quote deleted");
    },
    onError: () => {
      toast.error("Failed to delete quote");
    },
  });

  const resetForm = () => {
    setFormQuote("");
    setFormAuthor("");
    setFormContext("");
    setSelectedQuote(null);
    setIsEditing(false);
    setIsCreating(false);
    setSearchParams({});
  };

  const openEdit = (quote: CollectionQuote) => {
    setSelectedQuote(quote);
    setFormQuote(quote.quote);
    setFormAuthor(quote.author || "");
    setFormContext(quote.context || "");
    setIsEditing(true);
  };

  const handleSubmit = () => {
    if (!formQuote.trim()) {
      toast.error("Quote text is required");
      return;
    }

    if (isEditing && selectedQuote) {
      updateMutation.mutate({
        id: selectedQuote.id,
        quote: formQuote,
        author: formAuthor,
        context: formContext,
      });
    } else {
      createMutation.mutate({
        quote: formQuote,
        author: formAuthor,
        context: formContext,
      });
    }
  };

  const filteredQuotes = quotes?.filter(
    (q) =>
      q.quote.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.author && q.author.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <CollectionManageLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Quotes</h1>
            <p className="text-muted-foreground">
              Manage quotes for this collection
            </p>
          </div>
          <Button onClick={() => setIsCreating(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Quote
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search quotes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Quotes Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quote</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : filteredQuotes?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      {searchQuery ? "No quotes match your search" : "No quotes yet"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuotes?.map((quote) => (
                    <TableRow key={quote.id}>
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <Quote className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                          <span className="line-clamp-2">{quote.quote}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {quote.author || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(quote)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Delete this quote?")) {
                                deleteMutation.mutate(quote.id);
                              }
                            }}
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
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreating || isEditing} onOpenChange={() => resetForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Quote" : "Add Quote"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the quote details"
                : "Add a new quote to this collection"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="quote">Quote *</Label>
              <Textarea
                id="quote"
                value={formQuote}
                onChange={(e) => setFormQuote(e.target.value)}
                placeholder="Enter the quote..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={formAuthor}
                onChange={(e) => setFormAuthor(e.target.value)}
                placeholder="Who said this?"
              />
            </div>

            <div>
              <Label htmlFor="context">Context</Label>
              <Input
                id="context"
                value={formContext}
                onChange={(e) => setFormContext(e.target.value)}
                placeholder="When/where was this said?"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {isEditing ? "Save Changes" : "Add Quote"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </CollectionManageLayout>
  );
}
