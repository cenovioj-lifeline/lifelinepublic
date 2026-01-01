import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, GripVertical } from "lucide-react";
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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableItem({
  id,
  title,
  subtitle,
  onRemove,
}: {
  id: string;
  title: string;
  subtitle: string;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 border rounded bg-card"
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <div className="flex flex-col flex-1">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-muted-foreground capitalize">{subtitle}</span>
      </div>
      <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface CollectionContentManagerProps {
  collectionId: string;
}

export function CollectionContentManager({ collectionId }: CollectionContentManagerProps) {
  const queryClient = useQueryClient();
  const [customSectionName, setCustomSectionName] = useState("New Content");

  // Fetch collection
  const { data: collection } = useQuery({
    queryKey: ["collection", collectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .eq("id", collectionId)
        .single();

      if (error) throw error;
      setCustomSectionName(data.custom_section_name || "New Content");
      return data;
    },
  });

  // Fetch featured items
  const { data: featuredItems } = useQuery({
    queryKey: ["collection-featured-items", collectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collection_featured_items")
        .select("*")
        .eq("collection_id", collectionId)
        .order("order_index");

      if (error) throw error;
      return data;
    },
  });

  // Fetch custom section items
  const { data: customSectionItems } = useQuery({
    queryKey: ["collection-custom-section-items", collectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collection_custom_section_items")
        .select("*")
        .eq("collection_id", collectionId)
        .order("order_index");

      if (error) throw error;
      return data;
    },
  });

  // Fetch available content in this collection
  const { data: lifelines } = useQuery({
    queryKey: ["collection-lifelines-list", collectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lifelines")
        .select("id, title")
        .eq("collection_id", collectionId)
        .eq("status", "published")
        .order("title");

      if (error) throw error;
      return data;
    },
  });

  const { data: elections } = useQuery({
    queryKey: ["collection-elections-list", collectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mock_elections")
        .select("id, title")
        .eq("collection_id", collectionId)
        .eq("status", "published")
        .order("title");

      if (error) throw error;
      return data;
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["collection-profiles-list", collectionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profile_collections")
        .select("profile_id, profiles!inner(id, name)")
        .eq("collection_id", collectionId);

      if (error) throw error;
      return data.map(pc => ({ 
        id: pc.profiles?.id || pc.profile_id, 
        title: pc.profiles?.name || 'Unknown Profile' 
      }));
    },
  });

  // Fetch books linked to profiles in this collection
  const { data: books } = useQuery({
    queryKey: ["collection-books-list", collectionId],
    queryFn: async () => {
      // First get profile IDs for this collection
      const { data: profileData, error: profileError } = await supabase
        .from("profile_collections")
        .select("profile_id")
        .eq("collection_id", collectionId);

      if (profileError) throw profileError;
      if (!profileData || profileData.length === 0) return [];

      const profileIds = profileData.map(p => p.profile_id);

      // Get books linked to these profiles
      const { data: profileBooks, error: booksError } = await supabase
        .from("profile_books")
        .select("book_id, books!inner(id, title, author_name, status)")
        .in("profile_id", profileIds);

      if (booksError) throw booksError;
      if (!profileBooks) return [];

      // Deduplicate and return published books
      const bookMap = new Map();
      profileBooks.forEach(pb => {
        const book = pb.books as any;
        if (book && book.status === 'published' && !bookMap.has(book.id)) {
          bookMap.set(book.id, {
            id: book.id,
            title: `${book.title} (${book.author_name})`
          });
        }
      });

      return Array.from(bookMap.values()).sort((a, b) => a.title.localeCompare(b.title));
    },
  });

  // Update custom section name
  const updateSectionName = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("collections")
        .update({ custom_section_name: customSectionName })
        .eq("id", collectionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection", collectionId] });
      toast.success("Section name updated");
    },
    onError: () => {
      toast.error("Failed to update section name");
    },
  });

  // Featured items mutations
  const addFeaturedItem = useMutation({
    mutationFn: async ({ type, id }: { type: string; id: string }) => {
      const maxOrder = featuredItems?.reduce((max, item) => Math.max(max, item.order_index), -1) ?? -1;
      
      const { error } = await supabase
        .from("collection_featured_items")
        .insert({
          collection_id: collectionId,
          item_type: type,
          item_id: id,
          order_index: maxOrder + 1,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection-featured-items", collectionId] });
      toast.success("Featured item added");
    },
  });

  const removeFeaturedItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("collection_featured_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection-featured-items", collectionId] });
      toast.success("Featured item removed");
    },
  });

  const reorderFeaturedItems = useMutation({
    mutationFn: async (items: Array<{ id: string; order_index: number }>) => {
      const updates = items.map(item => 
        supabase
          .from("collection_featured_items")
          .update({ order_index: item.order_index })
          .eq("id", item.id)
      );
      
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection-featured-items", collectionId] });
      toast.success("Featured items reordered");
    },
  });

  // Custom section items mutations
  const addCustomSectionItem = useMutation({
    mutationFn: async ({ type, id }: { type: string; id: string }) => {
      const maxOrder = customSectionItems?.reduce((max, item) => Math.max(max, item.order_index), -1) ?? -1;
      
      const { error } = await supabase
        .from("collection_custom_section_items")
        .insert({
          collection_id: collectionId,
          item_type: type,
          item_id: id,
          order_index: maxOrder + 1,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection-custom-section-items", collectionId] });
      toast.success("Item added");
    },
  });

  const removeCustomSectionItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("collection_custom_section_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection-custom-section-items", collectionId] });
      toast.success("Item removed");
    },
  });

  const reorderCustomSectionItems = useMutation({
    mutationFn: async (items: Array<{ id: string; order_index: number }>) => {
      const updates = items.map(item => 
        supabase
          .from("collection_custom_section_items")
          .update({ order_index: item.order_index })
          .eq("id", item.id)
      );
      
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection-custom-section-items", collectionId] });
      toast.success("Items reordered");
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFeaturedDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && featuredItems) {
      const oldIndex = featuredItems.findIndex((item) => item.id === active.id);
      const newIndex = featuredItems.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(featuredItems, oldIndex, newIndex);
      const updates = newItems.map((item, index) => ({
        id: item.id,
        order_index: index,
      }));

      reorderFeaturedItems.mutate(updates);
    }
  };

  const handleCustomSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && customSectionItems) {
      const oldIndex = customSectionItems.findIndex((item) => item.id === active.id);
      const newIndex = customSectionItems.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(customSectionItems, oldIndex, newIndex);
      const updates = newItems.map((item, index) => ({
        id: item.id,
        order_index: index,
      }));

      reorderCustomSectionItems.mutate(updates);
    }
  };

  // Helper function to get content title
  const getContentTitle = (item: { item_type: string; item_id: string }) => {
    if (item.item_type === 'lifeline') {
      const lifeline = lifelines?.find(l => l.id === item.item_id);
      return lifeline?.title || 'Unknown Lifeline';
    } else if (item.item_type === 'election') {
      const election = elections?.find(e => e.id === item.item_id);
      return election?.title || 'Unknown Election';
    } else if (item.item_type === 'profile') {
      const profile = profiles?.find(p => p.id === item.item_id);
      return profile?.title || 'Unknown Profile';
    } else if (item.item_type === 'book') {
      const book = books?.find(b => b.id === item.item_id);
      return book?.title || 'Unknown Book';
    }
    return 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* Custom Section Name */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Section Name</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="custom-section-name">Section Name</Label>
            <Input
              id="custom-section-name"
              value={customSectionName}
              onChange={(e) => setCustomSectionName(e.target.value)}
              placeholder="New Content"
            />
          </div>
          <Button type="button" onClick={() => updateSectionName.mutate()}>
            Save Section Name
          </Button>
        </CardContent>
      </Card>

      {/* Featured Section */}
      <Card>
        <CardHeader>
          <CardTitle>Featured Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleFeaturedDragEnd}
          >
            <SortableContext
              items={featuredItems?.map((item) => item.id) || []}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {featuredItems?.map((item) => (
                  <SortableItem
                    key={item.id}
                    id={item.id}
                    title={getContentTitle(item)}
                    subtitle={item.item_type}
                    onRemove={() => removeFeaturedItem.mutate(item.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          
          <div className="flex gap-2">
            <Select
              onValueChange={(value) => {
                const [type, id] = value.split(":");
                addFeaturedItem.mutate({ type, id });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Add featured item..." />
              </SelectTrigger>
              <SelectContent>
                {profiles && profiles.length > 0 && (
                  <>
                    <SelectItem value="divider-profiles" disabled>Profiles</SelectItem>
                    {profiles.map((p) => (
                      <SelectItem key={p.id} value={`profile:${p.id}`}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </>
                )}
                {lifelines && lifelines.length > 0 && (
                  <>
                    <SelectItem value="divider-lifelines" disabled>Lifelines</SelectItem>
                    {lifelines.map((l) => (
                      <SelectItem key={l.id} value={`lifeline:${l.id}`}>
                        {l.title}
                      </SelectItem>
                    ))}
                  </>
                )}
                {elections && elections.length > 0 && (
                  <>
                    <SelectItem value="divider-elections" disabled>Awards</SelectItem>
                    {elections.map((e) => (
                      <SelectItem key={e.id} value={`election:${e.id}`}>
                        {e.title}
                      </SelectItem>
                    ))}
                  </>
                )}
                {books && books.length > 0 && (
                  <>
                    <SelectItem value="divider-books" disabled>Books</SelectItem>
                    {books.map((b) => (
                      <SelectItem key={b.id} value={`book:${b.id}`}>
                        {b.title}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Custom Section */}
      <Card>
        <CardHeader>
          <CardTitle>{customSectionName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleCustomSectionDragEnd}
          >
            <SortableContext
              items={customSectionItems?.map((item) => item.id) || []}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {customSectionItems?.map((item) => (
                  <SortableItem
                    key={item.id}
                    id={item.id}
                    title={getContentTitle(item)}
                    subtitle={item.item_type}
                    onRemove={() => removeCustomSectionItem.mutate(item.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          
          <div className="flex gap-2">
            <Select
              onValueChange={(value) => {
                const [type, id] = value.split(":");
                addCustomSectionItem.mutate({ type, id });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Add item..." />
              </SelectTrigger>
              <SelectContent>
                {profiles && profiles.length > 0 && (
                  <>
                    <SelectItem value="divider-profiles" disabled>Profiles</SelectItem>
                    {profiles.map((p) => (
                      <SelectItem key={p.id} value={`profile:${p.id}`}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </>
                )}
                {lifelines && lifelines.length > 0 && (
                  <>
                    <SelectItem value="divider-lifelines" disabled>Lifelines</SelectItem>
                    {lifelines.map((l) => (
                      <SelectItem key={l.id} value={`lifeline:${l.id}`}>
                        {l.title}
                      </SelectItem>
                    ))}
                  </>
                )}
                {elections && elections.length > 0 && (
                  <>
                    <SelectItem value="divider-elections" disabled>Awards</SelectItem>
                    {elections.map((e) => (
                      <SelectItem key={e.id} value={`election:${e.id}`}>
                        {e.title}
                      </SelectItem>
                    ))}
                  </>
                )}
                {books && books.length > 0 && (
                  <>
                    <SelectItem value="divider-books" disabled>Books</SelectItem>
                    {books.map((b) => (
                      <SelectItem key={b.id} value={`book:${b.id}`}>
                        {b.title}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
