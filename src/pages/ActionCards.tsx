import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Star, Check, X, ChevronUp, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as LucideIcons from "lucide-react";
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

interface ActionCard {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_name: string | null;
  icon_url: string | null;
  is_implemented: boolean;
  implementation_notes: string | null;
  is_default: boolean;
  default_order: number | null;
  status: string;
  created_at: string;
}

// Dynamic icon component
const DynamicIcon = ({ name, className }: { name: string | null; className?: string }) => {
  if (!name) return null;
  const Icon = (LucideIcons as any)[name];
  if (!Icon) return null;
  return <Icon className={className} />;
};

export default function ActionCards() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: actionCards, isLoading } = useQuery({
    queryKey: ["action-cards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("action_cards")
        .select("*")
        .order("is_default", { ascending: false })
        .order("default_order", { ascending: true, nullsFirst: false })
        .order("name");
      if (error) throw error;
      return data as ActionCard[];
    },
  });

  // Get default cards sorted by order
  const defaultCards = actionCards?.filter(c => c.is_default).sort((a, b) => (a.default_order || 0) - (b.default_order || 0)) || [];
  const nonDefaultCards = actionCards?.filter(c => !c.is_default) || [];

  const setDefaultMutation = useMutation({
    mutationFn: async ({ id, isDefault }: { id: string; isDefault: boolean }) => {
      // If adding to defaults, assign next order number
      let newOrder = null;
      if (isDefault) {
        const maxOrder = defaultCards.reduce((max, c) => Math.max(max, c.default_order || 0), 0);
        newOrder = maxOrder + 1;
      }
      
      const { error } = await supabase
        .from("action_cards")
        .update({ is_default: isDefault, default_order: newOrder })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["action-cards"] });
      queryClient.invalidateQueries({ queryKey: ["action-cards-defaults"] });
      toast({
        title: "Updated",
        description: "Default status has been updated",
      });
    },
  });

  // Reorder default cards
  const reorderMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: "up" | "down" }) => {
      const cardIndex = defaultCards.findIndex(c => c.id === id);
      if (cardIndex === -1) return;

      const swapIndex = direction === "up" ? cardIndex - 1 : cardIndex + 1;
      if (swapIndex < 0 || swapIndex >= defaultCards.length) return;

      const card = defaultCards[cardIndex];
      const swapCard = defaultCards[swapIndex];

      // Swap default_order values
      await supabase
        .from("action_cards")
        .update({ default_order: swapCard.default_order })
        .eq("id", card.id);

      await supabase
        .from("action_cards")
        .update({ default_order: card.default_order })
        .eq("id", swapCard.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["action-cards"] });
      queryClient.invalidateQueries({ queryKey: ["action-cards-defaults"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("action_cards")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["action-cards"] });
      toast({
        title: "Deleted",
        description: "Action card has been deleted",
      });
      setDeleteId(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Could not delete action card. It may be in use by collections.",
        variant: "destructive",
      });
      setDeleteId(null);
    },
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div>Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Action Cards</h1>
            <p className="text-muted-foreground">
              Manage action cards that appear below collection hero images
            </p>
          </div>
          <Button onClick={() => navigate("/admin/action-cards/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Action Card
          </Button>
        </div>

        {/* Default Cards Configuration Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-primary text-primary" />
              Default Cards ({defaultCards.length})
            </CardTitle>
            <CardDescription>
              These cards appear on all collections that use default settings. Drag to reorder.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {defaultCards.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No default cards configured. Mark cards as default below to add them here.
              </p>
            ) : (
              <div className="space-y-2">
                {defaultCards.map((card, index) => (
                  <div
                    key={card.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                  >
                    <div className="flex flex-col gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === 0}
                        onClick={() => reorderMutation.mutate({ id: card.id, direction: "up" })}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === defaultCards.length - 1}
                        onClick={() => reorderMutation.mutate({ id: card.id, direction: "down" })}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <span className="text-lg font-bold text-muted-foreground w-6">
                      {index + 1}
                    </span>
                    
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      {card.icon_url ? (
                        <img src={card.icon_url} alt="" className="h-6 w-6" />
                      ) : (
                        <DynamicIcon name={card.icon_name} className="h-6 w-6" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="font-medium">{card.name}</div>
                      <code className="text-xs text-muted-foreground">{card.slug}</code>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDefaultMutation.mutate({ id: card.id, isDefault: false })}
                    >
                      Remove from Defaults
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <h2 className="text-xl font-semibold pt-4">All Action Cards</h2>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {actionCards?.map((card) => (
            <Card key={card.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      {card.icon_url ? (
                        <img src={card.icon_url} alt="" className="h-6 w-6" />
                      ) : (
                        <DynamicIcon name={card.icon_name} className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {card.name}
                        {card.is_default && (
                          <Star className="h-4 w-4 fill-primary text-primary" />
                        )}
                      </CardTitle>
                      <code className="text-xs text-muted-foreground">{card.slug}</code>
                    </div>
                  </div>
                </div>
                <CardDescription className="mt-2">
                  {card.description || "No description"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={card.status === "active" ? "default" : "secondary"}>
                    {card.status}
                  </Badge>
                  {card.is_default && (
                    <Badge variant="outline">Default #{card.default_order}</Badge>
                  )}
                  <Badge variant={card.is_implemented ? "default" : "destructive"}>
                    {card.is_implemented ? (
                      <><Check className="h-3 w-3 mr-1" /> Implemented</>
                    ) : (
                      <><X className="h-3 w-3 mr-1" /> Not Implemented</>
                    )}
                  </Badge>
                </div>

                {!card.is_implemented && (
                  <p className="text-xs text-muted-foreground italic">
                    Work with Claude Code to implement this action
                  </p>
                )}

                {card.is_implemented && card.implementation_notes && (
                  <p className="text-xs text-muted-foreground">
                    {card.implementation_notes}
                  </p>
                )}

                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/admin/action-cards/${card.id}`)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  {!card.is_default ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDefaultMutation.mutate({ id: card.id, isDefault: true })}
                    >
                      <Star className="mr-2 h-4 w-4" />
                      Make Default
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDefaultMutation.mutate({ id: card.id, isDefault: false })}
                    >
                      <Star className="mr-2 h-4 w-4 fill-current" />
                      Remove Default
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteId(card.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {actionCards?.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No action cards yet. Create your first one!
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Action Card?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. If this card is assigned to any collections,
              they will fall back to showing default cards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
