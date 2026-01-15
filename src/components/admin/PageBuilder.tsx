import React, { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  usePageLayout,
  usePageLayoutItems,
  useCreatePageLayout,
  useReorderLayoutItems,
  useRemoveLayoutItem,
  useResolveLayoutContent,
} from "@/hooks/usePageLayout";
import { AddCardModal } from "./AddCardModal";
import { EditCardModal } from "./EditCardModal";
import { SortablePageLayoutCard } from "./SortablePageLayoutCard";
import type { PageType, PageLayoutItemWithContent } from "@/types/pageLayout";
import { toast } from "@/hooks/use-toast";

interface PageBuilderProps {
  initialPageType?: PageType;
  initialEntityId?: string;
}

export function PageBuilder({
  initialPageType = "home",
  initialEntityId,
}: PageBuilderProps) {
  // Page context state
  const [pageType, setPageType] = useState<PageType>(initialPageType);
  const [entityId, setEntityId] = useState<string | undefined>(initialEntityId);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PageLayoutItemWithContent | null>(null);
  const [sectionName, setSectionName] = useState("");
  const queryClient = useQueryClient();

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch collections for dropdown
  const { data: collections = [] } = useQuery({
    queryKey: ["collections-for-page-builder"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("id, title, slug")
        .eq("status", "published")
        .order("title");
      if (error) throw error;
      return data || [];
    },
  });

  // Data hooks
  const { data: layout, isLoading: layoutLoading } = usePageLayout(pageType, entityId);
  const { data: items = [], isLoading: itemsLoading } = usePageLayoutItems(layout?.id);
  const { data: itemsWithContent = [], isLoading: contentLoading } = useResolveLayoutContent(items);

  // Mutation hooks
  const createLayout = useCreatePageLayout();
  const reorderItems = useReorderLayoutItems();
  const removeItem = useRemoveLayoutItem();

  // Ensure layout exists when page context changes
  useEffect(() => {
    if (!layout && !layoutLoading && pageType) {
      createLayout.mutate({ pageType, entityId });
    }
  }, [pageType, entityId, layout, layoutLoading]);

  // Get current section name from collection
  const { data: currentCollection } = useQuery({
    queryKey: ["collection-section-name", entityId],
    queryFn: async () => {
      if (!entityId) return null;
      const { data, error } = await supabase
        .from("collections")
        .select("custom_section_name")
        .eq("id", entityId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!entityId && pageType === "collection",
  });

  // Update section name state when collection data loads
  useEffect(() => {
    if (currentCollection) {
      setSectionName(currentCollection.custom_section_name || "");
    } else {
      setSectionName("");
    }
  }, [currentCollection]);

  // Mutation to update section name
  const updateSectionName = useMutation({
    mutationFn: async (name: string) => {
      if (!entityId) throw new Error("No collection selected");
      const { error } = await supabase
        .from("collections")
        .update({ custom_section_name: name || null })
        .eq("id", entityId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection-section-name", entityId] });
      queryClient.invalidateQueries({ queryKey: ["public-collection"] });
      toast({ title: "Section name updated" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update section name",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle page context change
  const handleContextChange = (value: string) => {
    if (value === "home") {
      setPageType("home");
      setEntityId(undefined);
    } else {
      setPageType("collection");
      setEntityId(value);
    }
  };

  // Handle drag end for reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !layout) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(items, oldIndex, newIndex);

    // Update display_order for all items
    const updates = reordered.map((item, index) => ({
      id: item.id,
      display_order: index,
    }));

    reorderItems.mutate({ layoutId: layout.id, items: updates });
  };

  // Handle remove card
  const handleRemove = (itemId: string) => {
    if (!layout) return;
    removeItem.mutate({ itemId, layoutId: layout.id });
  };

  const isLoading = layoutLoading || itemsLoading || contentLoading;

  return (
    <div className="space-y-6">
      {/* Header with context selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Page Builder</h2>

        <Select
          value={pageType === "home" ? "home" : entityId}
          onValueChange={handleContextChange}
        >
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select page to edit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="home">Home Page</SelectItem>
            {collections.map((collection) => (
              <SelectItem key={collection.id} value={collection.id}>
                {collection.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Section Name Editor (for collection pages) */}
      {pageType === "collection" && entityId && (
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <Label htmlFor="section-name">Section Title</Label>
          <div className="flex gap-2">
            <Input
              id="section-name"
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              placeholder="Explore"
              className="max-w-xs"
            />
            <Button
              variant="outline"
              onClick={() => updateSectionName.mutate(sectionName)}
              disabled={updateSectionName.isPending}
            >
              {updateSectionName.isPending ? "Saving..." : "Save"}
            </Button>
            {sectionName && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSectionName("");
                  updateSectionName.mutate("");
                }}
              >
                Clear
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            This is the heading that appears above your cards (e.g., "Featured" or "Explore")
          </p>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Card
        </Button>
        <span className="text-sm text-muted-foreground">
          {items.length} cards • Drag to reorder
        </span>
      </div>

      {/* Card Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={itemsWithContent.map((item) => item.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {isLoading ? (
              // Loading skeletons
              Array(4)
                .fill(0)
                .map((_, i) => (
                  <Card key={i} className="h-48 animate-pulse bg-muted" />
                ))
            ) : (
              itemsWithContent.map((item) => (
                <SortablePageLayoutCard
                  key={item.id}
                  item={item}
                  onRemove={() => handleRemove(item.id)}
                  onEdit={() => setEditingItem(item)}
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>

      {/* Empty state */}
      {!isLoading && items.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">No cards added yet</p>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Card
          </Button>
        </Card>
      )}

      {/* Add Card Modal */}
      <AddCardModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        layoutId={layout?.id}
        pageType={pageType}
        entityId={entityId}
        existingItemIds={items.map((i) => i.item_id)}
        nextOrder={items.length}
      />

      {/* Edit Card Modal */}
      <EditCardModal
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
        item={editingItem}
      />
    </div>
  );
}
