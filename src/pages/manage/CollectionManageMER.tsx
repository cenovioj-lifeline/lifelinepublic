import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CollectionManageLayout } from "@/components/manage/CollectionManageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { Plus, Pencil, Trash2, Award, Trophy } from "lucide-react";

interface ElectionCategory {
  id: string;
  category: string;
  winner: string;
  reasoning: string | null;
  order_index: number;
}

interface ElectionSection {
  id: string;
  name: string;
  order_index: number;
  categories: ElectionCategory[];
}

interface MockElection {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  sections: ElectionSection[];
}

export default function CollectionManageMER() {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();

  const [selectedCategory, setSelectedCategory] = useState<ElectionCategory | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formCategory, setFormCategory] = useState("");
  const [formWinner, setFormWinner] = useState("");
  const [formReasoning, setFormReasoning] = useState("");

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

  // Fetch MER data
  const { data: elections, isLoading } = useQuery({
    queryKey: ["manage-mer", collection?.id],
    queryFn: async () => {
      // Get mock elections
      const { data: electionsData, error: electionsError } = await supabase
        .from("mock_elections")
        .select("id, title, description, slug")
        .eq("collection_id", collection!.id)
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (electionsError) throw electionsError;

      // For each election, get categories (election_results)
      const electionsWithSections: MockElection[] = [];

      for (const election of electionsData || []) {
        // Get categories directly from election_results
        const { data: categoriesData } = await supabase
          .from("election_results")
          .select("id, category, winner_name, notes")
          .eq("election_id", election.id);

        // Group by superlative_category or just create a single section
        const sections: ElectionSection[] = [{
          id: election.id + "-results",
          name: "Results",
          order_index: 0,
          categories: (categoriesData || []).map((c, idx) => ({
            id: c.id,
            category: c.category,
            winner: c.winner_name || "",
            reasoning: c.notes,
            order_index: idx,
          })),
        }];

        electionsWithSections.push({
          id: election.id,
          title: election.title,
          subtitle: election.description,
          slug: election.slug,
          sections,
        });
      }

      return electionsWithSections;
    },
    enabled: !!collection?.id,
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async (data: { id: string; category: string; winner: string; reasoning: string }) => {
      const { error } = await supabase
        .from("election_results")
        .update({
          category: data.category,
          winner: data.winner,
          reasoning: data.reasoning || null,
        })
        .eq("id", data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manage-mer"] });
      toast.success("Category updated");
      resetForm();
    },
    onError: () => {
      toast.error("Failed to update category");
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("election_results")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manage-mer"] });
      toast.success("Category deleted");
    },
    onError: () => {
      toast.error("Failed to delete category");
    },
  });

  const resetForm = () => {
    setFormCategory("");
    setFormWinner("");
    setFormReasoning("");
    setSelectedCategory(null);
    setIsEditing(false);
  };

  const openEdit = (category: ElectionCategory) => {
    setSelectedCategory(category);
    setFormCategory(category.category);
    setFormWinner(category.winner);
    setFormReasoning(category.reasoning || "");
    setIsEditing(true);
  };

  const handleSubmit = () => {
    if (!formCategory.trim() || !formWinner.trim()) {
      toast.error("Category and winner are required");
      return;
    }

    if (selectedCategory) {
      updateCategoryMutation.mutate({
        id: selectedCategory.id,
        category: formCategory,
        winner: formWinner,
        reasoning: formReasoning,
      });
    }
  };

  const totalCategories = elections?.reduce(
    (acc, e) => acc + e.sections.reduce((sAcc, s) => sAcc + s.categories.length, 0),
    0
  ) || 0;

  return (
    <CollectionManageLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mock Election Results</h1>
            <p className="text-muted-foreground">
              Manage awards for this collection ({totalCategories} categories)
            </p>
          </div>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-6 text-center">Loading...</CardContent>
          </Card>
        ) : elections?.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No Mock Election Results found for this collection.</p>
              <p className="text-sm mt-2">MER is generated during collection creation.</p>
            </CardContent>
          </Card>
        ) : (
          elections?.map((election) => (
            <Card key={election.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  {election.title}
                </CardTitle>
                {election.subtitle && (
                  <CardDescription>{election.subtitle}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  {election.sections.map((section) => (
                    <AccordionItem key={section.id} value={section.id}>
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <span>{section.name}</span>
                          <Badge variant="secondary">
                            {section.categories.length} awards
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pl-4">
                          {section.categories.map((category) => (
                            <div
                              key={category.id}
                              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                            >
                              <div>
                                <div className="font-medium">{category.category}</div>
                                <div className="text-sm text-muted-foreground">
                                  Winner: <span className="font-medium">{category.winner}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEdit(category)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (confirm("Delete this award?")) {
                                      deleteCategoryMutation.mutate(category.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={() => resetForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Award</DialogTitle>
            <DialogDescription>Update the award details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category">Award Name *</Label>
              <Input
                id="category"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                placeholder="Most Likely To..."
              />
            </div>

            <div>
              <Label htmlFor="winner">Winner *</Label>
              <Input
                id="winner"
                value={formWinner}
                onChange={(e) => setFormWinner(e.target.value)}
                placeholder="Winner name"
              />
            </div>

            <div>
              <Label htmlFor="reasoning">Reasoning</Label>
              <Textarea
                id="reasoning"
                value={formReasoning}
                onChange={(e) => setFormReasoning(e.target.value)}
                placeholder="Why did they win?"
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={updateCategoryMutation.isPending}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </CollectionManageLayout>
  );
}
