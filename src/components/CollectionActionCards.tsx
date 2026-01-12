import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, GripVertical } from "lucide-react";
import * as LucideIcons from "lucide-react";

interface ActionCard {
  id: string;
  name: string;
  slug: string;
  icon_name: string | null;
  icon_url: string | null;
  is_implemented: boolean;
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

interface CollectionActionCardsProps {
  collectionId: string;
}

export function CollectionActionCards({ collectionId }: CollectionActionCardsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"defaults" | "custom">("defaults");
  const [selectedCardToAdd, setSelectedCardToAdd] = useState<string>("");

  // Fetch all available action cards
  const { data: allCards } = useQuery({
    queryKey: ["action-cards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("action_cards")
        .select("*")
        .eq("status", "active")
        .order("name");
      if (error) throw error;
      return data as ActionCard[];
    },
  });

  // Fetch default cards
  const { data: defaultCards } = useQuery({
    queryKey: ["action-cards-defaults"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("action_cards")
        .select("*")
        .eq("is_default", true)
        .eq("status", "active")
        .order("default_order");
      if (error) throw error;
      return data as ActionCard[];
    },
  });

  // Fetch collection's custom action cards
  const { data: customCards, isLoading } = useQuery({
    queryKey: ["collection-action-cards", collectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collection_action_cards")
        .select(`
          id,
          action_card_id,
          display_order,
          label_override,
          action_card:action_cards(*)
        `)
        .eq("collection_id", collectionId)
        .eq("is_enabled", true)
        .order("display_order");
      if (error) throw error;
      return data as unknown as CollectionActionCard[];
    },
  });

  // Determine current mode based on whether custom cards exist
  const hasCustomCards = customCards && customCards.length > 0;
  const currentMode = hasCustomCards ? "custom" : "defaults";

  // Switch to custom mode - copy defaults as starting point
  const switchToCustomMutation = useMutation({
    mutationFn: async () => {
      if (!defaultCards) return;

      // Create custom entries for each default card
      const inserts = defaultCards.map((card, index) => ({
        collection_id: collectionId,
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
      queryClient.invalidateQueries({ queryKey: ["collection-action-cards", collectionId] });
      toast({ title: "Switched to custom cards", description: "You can now customize which cards appear" });
    },
  });

  // Switch back to defaults - delete all custom cards
  const switchToDefaultsMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("collection_action_cards")
        .delete()
        .eq("collection_id", collectionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection-action-cards", collectionId] });
      toast({ title: "Using default cards", description: "Collection will show the default action cards" });
    },
  });

  // Add a card
  const addCardMutation = useMutation({
    mutationFn: async (actionCardId: string) => {
      const maxOrder = customCards?.reduce((max, c) => Math.max(max, c.display_order), 0) || 0;
      const { error } = await supabase
        .from("collection_action_cards")
        .insert({
          collection_id: collectionId,
          action_card_id: actionCardId,
          display_order: maxOrder + 1,
          is_enabled: true,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection-action-cards", collectionId] });
      setSelectedCardToAdd("");
      toast({ title: "Card added" });
    },
  });

  // Remove a card
  const removeCardMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("collection_action_cards")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection-action-cards", collectionId] });
      toast({ title: "Card removed" });
    },
  });

  // Update label override
  const updateLabelMutation = useMutation({
    mutationFn: async ({ id, label }: { id: string; label: string }) => {
      const { error } = await supabase
        .from("collection_action_cards")
        .update({ label_override: label || null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection-action-cards", collectionId] });
    },
  });

  // Move card up/down
  const moveCardMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: "up" | "down" }) => {
      if (!customCards) return;

      const cardIndex = customCards.findIndex(c => c.id === id);
      if (cardIndex === -1) return;

      const swapIndex = direction === "up" ? cardIndex - 1 : cardIndex + 1;
      if (swapIndex < 0 || swapIndex >= customCards.length) return;

      const card = customCards[cardIndex];
      const swapCard = customCards[swapIndex];

      // Swap display_order values
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
      queryClient.invalidateQueries({ queryKey: ["collection-action-cards", collectionId] });
    },
  });

  const handleModeChange = (newMode: string) => {
    if (newMode === "custom" && currentMode === "defaults") {
      switchToCustomMutation.mutate();
    } else if (newMode === "defaults" && currentMode === "custom") {
      switchToDefaultsMutation.mutate();
    }
  };

  // Cards already assigned
  const assignedCardIds = customCards?.map(c => c.action_card_id) || [];
  // Cards available to add
  const availableCards = allCards?.filter(c => !assignedCardIds.includes(c.id)) || [];

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>Card Configuration</Label>
        <RadioGroup value={currentMode} onValueChange={handleModeChange}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="defaults" id="defaults" />
            <Label htmlFor="defaults" className="font-normal cursor-pointer">
              Use Defaults ({defaultCards?.map(c => c.name).join(", ") || "Loading..."})
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="custom" id="custom" />
            <Label htmlFor="custom" className="font-normal cursor-pointer">
              Customize cards for this collection
            </Label>
          </div>
        </RadioGroup>
      </div>

      {currentMode === "custom" && (
        <>
          <div className="space-y-3">
            <Label>Assigned Cards</Label>
            {customCards?.length === 0 && (
              <p className="text-sm text-muted-foreground">No cards assigned. Add cards below.</p>
            )}
            <div className="space-y-2">
              {customCards?.map((card, index) => (
                <Card key={card.id}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === 0}
                        onClick={() => moveCardMutation.mutate({ id: card.id, direction: "up" })}
                      >
                        <GripVertical className="h-4 w-4 rotate-90" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === (customCards?.length || 0) - 1}
                        onClick={() => moveCardMutation.mutate({ id: card.id, direction: "down" })}
                      >
                        <GripVertical className="h-4 w-4 rotate-90" />
                      </Button>
                    </div>

                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                      {card.action_card.icon_url ? (
                        <img src={card.action_card.icon_url} alt="" className="h-5 w-5" />
                      ) : (
                        <DynamicIcon name={card.action_card.icon_name} className="h-5 w-5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{card.action_card.name}</div>
                      <code className="text-xs text-muted-foreground">{card.action_card.slug}</code>
                    </div>

                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Label override"
                        className="w-32 h-8 text-sm"
                        defaultValue={card.label_override || ""}
                        onBlur={(e) => updateLabelMutation.mutate({ id: card.id, label: e.target.value })}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeCardMutation.mutate(card.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
                onClick={() => selectedCardToAdd && addCardMutation.mutate(selectedCardToAdd)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Card
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
