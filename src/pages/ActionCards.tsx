import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Star, Check, X, ChevronUp, ChevronDown, RotateCcw } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface Collection {
  id: string;
  title: string;
  slug: string;
  show_action_cards: boolean | null;
}

interface CollectionActionCard {
  id: string;
  action_card_id: string;
  display_order: number;
  label_override: string | null;
  action_card: ActionCard;
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
  const [selectedContext, setSelectedContext] = useState<string>("defaults");
  const [selectedCardToAdd, setSelectedCardToAdd] = useState<string>("");

  // Fetch all collections
  const { data: collections } = useQuery({
    queryKey: ["collections-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("id, title, slug, show_action_cards")
        .order("title");
      if (error) throw error;
      return data as Collection[];
    },
  });

  // Get the selected collection's show_action_cards setting
  const selectedCollection = collections?.find(c => c.id === selectedContext);
  const showActionCards = selectedCollection?.show_action_cards !== false;

  // Toggle show action cards mutation
  const toggleShowActionCards = useMutation({
    mutationFn: async (show: boolean) => {
      const { error } = await supabase
        .from("collections")
        .update({ show_action_cards: show })
        .eq("id", selectedContext);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections-list"] });
      queryClient.invalidateQueries({ queryKey: ["public-collection"] });
      toast({ title: showActionCards ? "Action cards hidden" : "Action cards shown" });
    },
  });

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

  // Fetch collection's custom action cards when a collection is selected
  const { data: collectionCards } = useQuery({
    queryKey: ["collection-action-cards", selectedContext],
    queryFn: async () => {
      if (selectedContext === "defaults") return null;
      const { data, error } = await supabase
        .from("collection_action_cards")
        .select(`
          id,
          action_card_id,
          display_order,
          label_override,
          action_card:action_cards(*)
        `)
        .eq("collection_id", selectedContext)
        .eq("is_enabled", true)
        .order("display_order");
      if (error) throw error;
      return data as unknown as CollectionActionCard[];
    },
    enabled: selectedContext !== "defaults",
  });

  // Get default cards sorted by order
  const defaultCards = actionCards?.filter(c => c.is_default).sort((a, b) => (a.default_order || 0) - (b.default_order || 0)) || [];
  
  // Determine if we're in defaults mode or collection mode
  const isDefaultsMode = selectedContext === "defaults";
  const hasCustomCards = collectionCards && collectionCards.length > 0;

  // Set default mutation
  const setDefaultMutation = useMutation({
    mutationFn: async ({ id, isDefault }: { id: string; isDefault: boolean }) => {
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
      toast({ title: "Updated", description: "Default status has been updated" });
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

  // Delete action card
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
      toast({ title: "Deleted", description: "Action card has been deleted" });
      setDeleteId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Could not delete action card. It may be in use by collections.",
        variant: "destructive",
      });
      setDeleteId(null);
    },
  });

  // Collection-specific mutations
  const addToCollectionMutation = useMutation({
    mutationFn: async (actionCardId: string) => {
      const maxOrder = collectionCards?.reduce((max, c) => Math.max(max, c.display_order), 0) || 0;
      const { error } = await supabase
        .from("collection_action_cards")
        .insert({
          collection_id: selectedContext,
          action_card_id: actionCardId,
          display_order: maxOrder + 1,
          is_enabled: true,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection-action-cards", selectedContext] });
      setSelectedCardToAdd("");
      toast({ title: "Card added to collection" });
    },
  });

  const removeFromCollectionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("collection_action_cards")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection-action-cards", selectedContext] });
      toast({ title: "Card removed from collection" });
    },
  });

  const updateLabelMutation = useMutation({
    mutationFn: async ({ id, label }: { id: string; label: string }) => {
      const { error } = await supabase
        .from("collection_action_cards")
        .update({ label_override: label || null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection-action-cards", selectedContext] });
    },
  });

  const reorderCollectionCardMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: "up" | "down" }) => {
      if (!collectionCards) return;

      const cardIndex = collectionCards.findIndex(c => c.id === id);
      if (cardIndex === -1) return;

      const swapIndex = direction === "up" ? cardIndex - 1 : cardIndex + 1;
      if (swapIndex < 0 || swapIndex >= collectionCards.length) return;

      const card = collectionCards[cardIndex];
      const swapCard = collectionCards[swapIndex];

      await supabase
        .from("collection_action_cards")
        .update({ display_order: swapCard.display_order })
        .eq("id", card.id);

      await supabase
        .from("collection_action_cards")
        .update({ display_order: card.display_order })
        .eq("id", swapCard.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection-action-cards", selectedContext] });
    },
  });

  const resetToDefaultsMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("collection_action_cards")
        .delete()
        .eq("collection_id", selectedContext);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection-action-cards", selectedContext] });
      toast({ title: "Reset to defaults", description: "Collection will now use default action cards" });
    },
  });

  const initializeFromDefaultsMutation = useMutation({
    mutationFn: async () => {
      const inserts = defaultCards.map((card, index) => ({
        collection_id: selectedContext,
        action_card_id: card.id,
        display_order: index + 1,
        is_enabled: true,
      }));

      const { error } = await supabase
        .from("collection_action_cards")
        .insert(inserts);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection-action-cards", selectedContext] });
      toast({ title: "Initialized from defaults", description: "You can now customize the cards" });
    },
  });

  // Cards assigned to collection
  const assignedCardIds = collectionCards?.map(c => c.action_card_id) || [];
  // Available cards to add
  const availableCards = actionCards?.filter(c => c.status === "active" && !assignedCardIds.includes(c.id)) || [];

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
          <div className="flex items-center gap-4">
            <Select value={selectedContext} onValueChange={setSelectedContext}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="defaults">
                  <span className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Default Home Page
                  </span>
                </SelectItem>
                {collections?.map((collection) => (
                  <SelectItem key={collection.id} value={collection.id}>
                    {collection.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => navigate("/admin/action-cards/new")}>
              <Plus className="mr-2 h-4 w-4" />
              New Action Card
            </Button>
          </div>
        </div>

        {/* Show Action Cards Toggle (for collections) */}
        {!isDefaultsMode && selectedCollection && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-action-cards" className="text-base font-medium">
                  Show action cards in collection
                </Label>
                <p className="text-sm text-muted-foreground">
                  When disabled, action cards won't appear on this collection's public page
                </p>
              </div>
              <Switch
                id="show-action-cards"
                checked={showActionCards}
                onCheckedChange={(checked) => toggleShowActionCards.mutate(checked)}
              />
            </div>
          </Card>
        )}

        {/* Context-specific Cards Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isDefaultsMode ? (
                <>
                  <Star className="h-5 w-5 fill-primary text-primary" />
                  Default Cards ({defaultCards.length})
                </>
              ) : (
                <>
                  Cards for {selectedCollection?.title || "Collection"} 
                  ({hasCustomCards ? collectionCards?.length : "Using Defaults"})
                </>
              )}
            </CardTitle>
            <CardDescription>
              {isDefaultsMode 
                ? "These cards appear on all collections that use default settings."
                : hasCustomCards 
                  ? "Custom cards configured for this collection."
                  : "This collection uses default cards. Add cards below to customize."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isDefaultsMode ? (
              // Default cards management
              defaultCards.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No default cards configured. Mark cards as default in "All Action Cards" below.
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
              )
            ) : (
              // Collection-specific cards management
              <>
                {!hasCustomCards ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Currently showing default cards: {defaultCards.map(c => c.name).join(", ") || "None"}
                    </p>
                    <Button onClick={() => initializeFromDefaultsMutation.mutate()}>
                      <Plus className="mr-2 h-4 w-4" />
                      Customize Cards for This Collection
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {collectionCards?.map((card, index) => (
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
                              onClick={() => reorderCollectionCardMutation.mutate({ id: card.id, direction: "up" })}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              disabled={index === (collectionCards?.length || 0) - 1}
                              onClick={() => reorderCollectionCardMutation.mutate({ id: card.id, direction: "down" })}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <span className="text-lg font-bold text-muted-foreground w-6">
                            {index + 1}
                          </span>
                          
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                            {card.action_card.icon_url ? (
                              <img src={card.action_card.icon_url} alt="" className="h-6 w-6" />
                            ) : (
                              <DynamicIcon name={card.action_card.icon_name} className="h-6 w-6" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{card.action_card.name}</div>
                            <code className="text-xs text-muted-foreground">{card.action_card.slug}</code>
                          </div>
                          
                          <Input
                            placeholder="Label override"
                            className="w-36 h-8 text-sm"
                            defaultValue={card.label_override || ""}
                            onBlur={(e) => updateLabelMutation.mutate({ id: card.id, label: e.target.value })}
                          />
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => removeFromCollectionMutation.mutate(card.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    
                    {availableCards.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Select value={selectedCardToAdd} onValueChange={setSelectedCardToAdd}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select card to add" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableCards.map((card) => (
                              <SelectItem key={card.id} value={card.id}>
                                {card.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!selectedCardToAdd}
                          onClick={() => selectedCardToAdd && addToCollectionMutation.mutate(selectedCardToAdd)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Card
                        </Button>
                      </div>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resetToDefaultsMutation.mutate()}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset to Defaults
                    </Button>
                  </div>
                )}
              </>
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
                  {isDefaultsMode ? (
                    !card.is_default ? (
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
                    )
                  ) : (
                    hasCustomCards && !assignedCardIds.includes(card.id) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addToCollectionMutation.mutate(card.id)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add to {selectedCollection?.title}
                      </Button>
                    )
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
