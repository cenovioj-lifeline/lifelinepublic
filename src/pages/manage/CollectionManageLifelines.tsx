import { useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CollectionManageLayout } from "@/components/manage/CollectionManageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Pencil, Trash2, Search, ExternalLink, List } from "lucide-react";
import { LifelineBookIcon } from "@/components/icons/LifelineBookIcon";

interface Lifeline {
  id: string;
  title: string;
  slug: string;
  lifeline_type: string;
  description: string | null;
  entry_count?: number;
}

export default function CollectionManageLifelines() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLifeline, setSelectedLifeline] = useState<Lifeline | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(searchParams.get("action") === "new");

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState<"person" | "list">("list");

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

  // Fetch lifelines with entry counts
  const { data: lifelines, isLoading } = useQuery({
    queryKey: ["manage-lifelines", collection?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lifelines")
        .select(`
          id,
          title,
          slug,
          lifeline_type,
          description,
          entries(id)
        `)
        .eq("collection_id", collection!.id)
        .order("title");

      if (error) throw error;

      return data.map((l: any) => ({
        ...l,
        entry_count: l.entries?.length || 0,
      }));
    },
    enabled: !!collection?.id,
  });

  // Create lifeline mutation
  const createMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; lifeline_type: string }) => {
      const lifelineSlug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const { error } = await supabase.from("lifelines").insert({
        collection_id: collection!.id,
        title: data.title,
        slug: lifelineSlug,
        lifeline_type: data.lifeline_type as "person" | "list",
        intro: data.description || null,
        status: "published",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manage-lifelines"] });
      toast.success("Lifeline created");
      resetForm();
    },
    onError: () => {
      toast.error("Failed to create lifeline");
    },
  });

  // Update lifeline mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; title: string; description: string }) => {
      const { error } = await supabase
        .from("lifelines")
        .update({
          title: data.title,
          description: data.description || null,
        })
        .eq("id", data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manage-lifelines"] });
      toast.success("Lifeline updated");
      resetForm();
    },
    onError: () => {
      toast.error("Failed to update lifeline");
    },
  });

  // Delete lifeline mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lifelines").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manage-lifelines"] });
      toast.success("Lifeline deleted");
    },
    onError: () => {
      toast.error("Failed to delete lifeline");
    },
  });

  const resetForm = () => {
    setFormTitle("");
    setFormDescription("");
    setFormType("list");
    setSelectedLifeline(null);
    setIsEditing(false);
    setIsCreating(false);
    setSearchParams({});
  };

  const openEdit = (lifeline: Lifeline) => {
    setSelectedLifeline(lifeline);
    setFormTitle(lifeline.title);
    setFormDescription(lifeline.description || "");
    setFormType(lifeline.lifeline_type as "person" | "list");
    setIsEditing(true);
  };

  const handleSubmit = () => {
    if (!formTitle.trim()) {
      toast.error("Title is required");
      return;
    }

    if (isEditing && selectedLifeline) {
      updateMutation.mutate({
        id: selectedLifeline.id,
        title: formTitle,
        description: formDescription,
      });
    } else {
      createMutation.mutate({
        title: formTitle,
        description: formDescription,
        lifeline_type: formType,
      });
    }
  };

  const filteredLifelines = lifelines?.filter((l) =>
    l.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <CollectionManageLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Lifelines</h1>
            <p className="text-muted-foreground">
              Manage lifelines for this collection
            </p>
          </div>
          <Button onClick={() => setIsCreating(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Lifeline
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search lifelines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Lifelines Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Entries</TableHead>
                  <TableHead className="w-[140px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : filteredLifelines?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      {searchQuery ? "No lifelines match your search" : "No lifelines yet"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLifelines?.map((lifeline) => (
                    <TableRow key={lifeline.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <LifelineBookIcon className="h-4 w-4 text-muted-foreground" />
                          {lifeline.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {lifeline.lifeline_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{lifeline.entry_count}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            title="Manage Entries"
                          >
                            <Link to={`/public/collections/${slug}/manage/lifelines/${lifeline.id}/entries`}>
                              <List className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(lifeline)}
                            title="Edit Lifeline"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Delete this lifeline and all its entries?")) {
                                deleteMutation.mutate(lifeline.id);
                              }
                            }}
                            title="Delete Lifeline"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            title="View Public Page"
                          >
                            <a
                              href={`/public/collections/${slug}/lifelines/${lifeline.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
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
            <DialogTitle>{isEditing ? "Edit Lifeline" : "Create Lifeline"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the lifeline details"
                : "Add a new lifeline to this collection"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Lifeline title..."
              />
            </div>

            {!isEditing && (
              <div>
                <Label>Type *</Label>
                <div className="flex gap-2 mt-1">
                  <Button
                    type="button"
                    variant={formType === "list" ? "default" : "outline-solid"}
                    onClick={() => setFormType("list")}
                    className="flex-1"
                  >
                    List
                  </Button>
                  <Button
                    type="button"
                    variant={formType === "person" ? "default" : "outline-solid"}
                    onClick={() => setFormType("person")}
                    className="flex-1"
                  >
                    Person
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Person lifelines are linked to a profile. List lifelines are standalone.
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Brief description..."
                rows={3}
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
                {isEditing ? "Save Changes" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </CollectionManageLayout>
  );
}
