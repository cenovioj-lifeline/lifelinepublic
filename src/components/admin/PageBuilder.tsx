import React, { useState, useEffect, useRef } from "react";
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
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
  useAddLayoutItem,
} from "@/hooks/usePageLayout";
import {
  usePageLayoutSections,
  useCreateSection,
  useUpdateSection,
  useDeleteSection,
  useReorderSections,
} from "@/hooks/usePageLayoutSections";
import { AddCardModal } from "./AddCardModal";
import { EditCardModal } from "./EditCardModal";
import { SortablePageLayoutCard } from "./SortablePageLayoutCard";
import type { PageType, PageLayoutItemWithContent, PageLayoutSection } from "@/types/pageLayout";
import { toast } from "@/hooks/use-toast";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface PageBuilderProps {
  initialPageType?: PageType;
  initialEntityId?: string;
}

// Sortable section wrapper
function SortableSection({
  section,
  items,
  onUpdateTitle,
  onUpdateColumns,
  onDelete,
  onAddCard,
  onRemoveCard,
  onEditCard,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  layoutId,
}: {
  section: PageLayoutSection;
  items: PageLayoutItemWithContent[];
  onUpdateTitle: (title: string) => void;
  onUpdateColumns: (count: number) => void;
  onDelete: () => void;
  onAddCard: () => void;
  onRemoveCard: (itemId: string) => void;
  onEditCard: (item: PageLayoutItemWithContent) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
  layoutId: string;
}) {
  // Local state for section title with debounced save
  const [localTitle, setLocalTitle] = useState(section.section_title || "");
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null);

  // Sync local state when section prop changes (e.g., after server update)
  useEffect(() => {
    setLocalTitle(section.section_title || "");
  }, [section.section_title]);

  const handleTitleChange = (value: string) => {
    setLocalTitle(value);
    // Clear previous debounce timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    // Set new debounce timer
    debounceRef.current = setTimeout(() => {
      onUpdateTitle(value);
    }, 500);
  };

  const handleTitleBlur = () => {
    // Save immediately on blur
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (localTitle !== (section.section_title || "")) {
      onUpdateTitle(localTitle);
    }
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const reorderItems = useReorderLayoutItems();

  // Handle reordering within this section
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(items, oldIndex, newIndex);
    const updates = reordered.map((item, index) => ({
      id: item.id,
      display_order: index,
    }));

    reorderItems.mutate({ layoutId, items: updates });
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="space-y-3">
      <Card className="p-4 bg-muted/50">
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-4">
          {/* Drag handle */}
          <div {...listeners} className="cursor-grab p-1 hover:bg-muted rounded">
            <GripVertical className="w-5 h-5 text-muted-foreground" />
          </div>

          {/* Move buttons */}
          <div className="flex flex-col gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              disabled={isFirst}
              onClick={onMoveUp}
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              disabled={isLast}
              onClick={onMoveDown}
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>

          {/* Section title */}
          <div className="flex-1">
            <Input
              placeholder="Section title (optional)"
              value={localTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              onBlur={handleTitleBlur}
              className="max-w-xs h-8"
            />
          </div>

          {/* Columns selector */}
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground">Columns:</Label>
            <Select
              value={String(section.columns_count)}
              onValueChange={(v) => onUpdateColumns(parseInt(v))}
            >
              <SelectTrigger className="w-16 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Delete section */}
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Cards Grid */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((item) => item.id)}
            strategy={rectSortingStrategy}
          >
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${section.columns_count}, minmax(0, 1fr))`,
              }}
            >
              {items.map((item) => (
                <SortablePageLayoutCard
                  key={item.id}
                  item={item}
                  onRemove={() => onRemoveCard(item.id)}
                  onEdit={() => onEditCard(item)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Add Card Button */}
        <div className="mt-4 pt-4 border-t border-dashed">
          <Button variant="outline" size="sm" onClick={onAddCard}>
            <Plus className="w-4 h-4 mr-2" />
            Add Card to Section
          </Button>
          <span className="ml-3 text-sm text-muted-foreground">
            {items.length} cards
          </span>
        </div>
      </Card>
    </div>
  );
}

// Unsectioned cards component with drag-and-drop
function UnsectionedCards({
  items,
  layoutId,
  onRemove,
  onEdit,
}: {
  items: PageLayoutItemWithContent[];
  layoutId: string;
  onRemove: (itemId: string) => void;
  onEdit: (item: PageLayoutItemWithContent) => void;
}) {
  const reorderItems = useReorderLayoutItems();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(items, oldIndex, newIndex);
    const updates = reordered.map((item, index) => ({
      id: item.id,
      display_order: index,
    }));

    reorderItems.mutate({ layoutId, items: updates });
  };

  return (
    <Card className="p-4 border-dashed">
      <h3 className="font-medium mb-3 text-muted-foreground">
        Unsectioned Cards ({items.length})
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        These cards were added before sections. Add a section and they'll be assigned to it.
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-3 gap-4">
            {items.map((item) => (
              <SortablePageLayoutCard
                key={item.id}
                item={item}
                onRemove={() => onRemove(item.id)}
                onEdit={() => onEdit(item)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </Card>
  );
}

export function PageBuilder({
  initialPageType = "home",
  initialEntityId,
}: PageBuilderProps) {
  // Page context state
  const [pageType, setPageType] = useState<PageType>(initialPageType);
  const [entityId, setEntityId] = useState<string | undefined>(initialEntityId);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addToSectionId, setAddToSectionId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<PageLayoutItemWithContent | null>(null);
  const [sectionName, setSectionName] = useState("");
  const queryClient = useQueryClient();

  // DnD sensors for sections
  const sectionSensors = useSensors(
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
  const { data: sections = [], isLoading: sectionsLoading } = usePageLayoutSections(layout?.id);

  // Mutation hooks
  const createLayout = useCreatePageLayout();
  const removeItem = useRemoveLayoutItem();
  const addItem = useAddLayoutItem();
  const createSection = useCreateSection();
  const updateSection = useUpdateSection();
  const deleteSection = useDeleteSection();
  const reorderSections = useReorderSections();

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
  const updateCollectionSectionName = useMutation({
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

  // Handle remove card
  const handleRemove = (itemId: string) => {
    if (!layout) return;
    removeItem.mutate({ itemId, layoutId: layout.id });
  };

  // Handle add section
  const handleAddSection = () => {
    if (!layout) return;
    createSection.mutate({
      layoutId: layout.id,
      displayOrder: sections.length,
    });
  };

  // Handle quick add card (creates section if needed)
  const handleQuickAddCard = () => {
    if (!layout) return;

    if (sections.length === 0) {
      // Create a default section first, then open modal
      createSection.mutate(
        { layoutId: layout.id, displayOrder: 0 },
        {
          onSuccess: (newSection) => {
            setAddToSectionId(newSection.id);
            setIsAddModalOpen(true);
          },
        }
      );
    } else {
      // Add to first section
      setAddToSectionId(sections[0].id);
      setIsAddModalOpen(true);
    }
  };

  // Handle section reorder via drag
  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !layout) return;

    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(sections, oldIndex, newIndex);
    const updates = reordered.map((section, index) => ({
      id: section.id,
      display_order: index,
    }));

    reorderSections.mutate({ layoutId: layout.id, sections: updates });
  };

  // Handle section move up/down
  const handleMoveSection = (sectionId: string, direction: "up" | "down") => {
    if (!layout) return;
    const index = sections.findIndex((s) => s.id === sectionId);
    if (index === -1) return;

    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= sections.length) return;

    const reordered = [...sections];
    [reordered[index], reordered[swapIndex]] = [reordered[swapIndex], reordered[index]];

    const updates = reordered.map((section, idx) => ({
      id: section.id,
      display_order: idx,
    }));

    reorderSections.mutate({ layoutId: layout.id, sections: updates });
  };

  // Group items by section
  const itemsBySection = sections.reduce((acc, section) => {
    acc[section.id] = itemsWithContent.filter((item) => item.section_id === section.id);
    return acc;
  }, {} as Record<string, PageLayoutItemWithContent[]>);

  // Items without a section (legacy or orphaned)
  const unsectionedItems = itemsWithContent.filter(
    (item) => !item.section_id || !sections.find((s) => s.id === item.section_id)
  );

  const isLoading = layoutLoading || itemsLoading || contentLoading || sectionsLoading;

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

      {/* Global Section Name Editor (for collection pages - legacy support) */}
      {pageType === "collection" && entityId && (
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <Label htmlFor="section-name">Default Section Title (Legacy)</Label>
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
              onClick={() => updateCollectionSectionName.mutate(sectionName)}
              disabled={updateCollectionSectionName.isPending}
            >
              {updateCollectionSectionName.isPending ? "Saving..." : "Save"}
            </Button>
            {sectionName && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSectionName("");
                  updateCollectionSectionName.mutate("");
                }}
              >
                Clear
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            This is the heading used when no sections are defined
          </p>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
        <Button onClick={handleAddSection} disabled={!layout}>
          <Plus className="w-4 h-4 mr-2" />
          Add Section
        </Button>
        <Button 
          onClick={handleQuickAddCard} 
          disabled={!layout}
          className="bg-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Card
        </Button>
        <span className="text-sm text-muted-foreground">
          {sections.length} sections • {itemsWithContent.length} total cards
        </span>
      </div>

      {/* Sections */}
      {isLoading ? (
        <div className="space-y-4">
          {Array(2)
            .fill(0)
            .map((_, i) => (
              <Card key={i} className="h-48 animate-pulse bg-muted" />
            ))}
        </div>
      ) : sections.length === 0 ? (
        /* Empty state - no sections yet */
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">
            No sections yet. Add a section to start building your page layout.
          </p>
          <Button onClick={handleAddSection} disabled={!layout}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Section
          </Button>
        </Card>
      ) : (
        <DndContext
          sensors={sectionSensors}
          collisionDetection={closestCenter}
          onDragEnd={handleSectionDragEnd}
        >
          <SortableContext
            items={sections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {sections.map((section, index) => (
                <SortableSection
                  key={section.id}
                  section={section}
                  items={itemsBySection[section.id] || []}
                  layoutId={layout?.id || ""}
                  onUpdateTitle={(title) =>
                    updateSection.mutate({ sectionId: section.id, sectionTitle: title })
                  }
                  onUpdateColumns={(count) =>
                    updateSection.mutate({ sectionId: section.id, columnsCount: count })
                  }
                  onDelete={() =>
                    deleteSection.mutate({ sectionId: section.id, layoutId: layout?.id || "" })
                  }
                  onAddCard={() => {
                    setAddToSectionId(section.id);
                    setIsAddModalOpen(true);
                  }}
                  onRemoveCard={handleRemove}
                  onEditCard={setEditingItem}
                  onMoveUp={() => handleMoveSection(section.id, "up")}
                  onMoveDown={() => handleMoveSection(section.id, "down")}
                  isFirst={index === 0}
                  isLast={index === sections.length - 1}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Unsectioned items (legacy support) */}
      {unsectionedItems.length > 0 && (
        <UnsectionedCards
          items={unsectionedItems}
          layoutId={layout?.id || ""}
          onRemove={handleRemove}
          onEdit={setEditingItem}
        />
      )}

      {/* Add Card Modal */}
      <AddCardModal
        open={isAddModalOpen}
        onOpenChange={(open) => {
          setIsAddModalOpen(open);
          if (!open) setAddToSectionId(null);
        }}
        layoutId={layout?.id}
        pageType={pageType}
        entityId={entityId}
        existingItemIds={items.map((i) => i.item_id)}
        nextOrder={
          addToSectionId
            ? (itemsBySection[addToSectionId]?.length || 0)
            : items.length
        }
        sectionId={addToSectionId}
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
