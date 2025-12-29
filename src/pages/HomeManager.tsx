import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DirectImageUpload } from "@/components/DirectImageUpload";
import { CropBoxPicker, CropData } from "@/components/admin/CropBoxPicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, Plus, Image as ImageIcon, GripVertical } from "lucide-react";
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
      <Button variant="ghost" size="icon" onClick={onRemove}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function HomeManager() {
  const queryClient = useQueryClient();
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroImageId, setHeroImageId] = useState<string | null>(null);
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const [heroImagePosition, setHeroImagePosition] = useState({ x: 50, y: 50 });
  const [showCropPicker, setShowCropPicker] = useState(false);
  const [customSectionName, setCustomSectionName] = useState("New Content");

  const { data: settings } = useQuery({
    queryKey: ["home-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_page_settings")
        .select(`
          *,
          hero_image:media_assets(url, alt_text)
        `)
        .single();

      if (error) throw error;
      
      setHeroTitle(data.hero_title || "");
      setHeroSubtitle(data.hero_subtitle || "");
      setHeroImageId(data.hero_image_id);
      setHeroImageUrl(data.hero_image?.url || null);
      setHeroImagePosition({
        x: data.hero_image_position_x || 50,
        y: data.hero_image_position_y || 50,
      });
      setCustomSectionName(data.custom_section_name || "New Content");
      
      return data;
    },
  });

  const { data: featuredItems } = useQuery({
    queryKey: ["home-featured-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_page_featured_items")
        .select("*")
        .order("order_index");

      if (error) throw error;
      return data;
    },
  });

  const { data: newContentItems } = useQuery({
    queryKey: ["home-new-content-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_page_new_content_items")
        .select("*")
        .order("order_index");

      if (error) throw error;
      return data;
    },
  });

  const { data: collections } = useQuery({
    queryKey: ["collections-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("id, title")
        .eq("status", "published")
        .order("title");

      if (error) throw error;
      return data;
    },
  });

  const { data: lifelines } = useQuery({
    queryKey: ["lifelines-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lifelines")
        .select("id, title")
        .eq("status", "published")
        .order("title");

      if (error) throw error;
      return data;
    },
  });

  const { data: elections } = useQuery({
    queryKey: ["elections-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mock_elections")
        .select("id, title")
        .eq("status", "published")
        .order("title");

      if (error) throw error;
      return data;
    },
  });

  const updateSettings = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("home_page_settings")
        .update({
          hero_title: heroTitle,
          hero_subtitle: heroSubtitle,
          hero_image_id: heroImageId,
          hero_image_position_x: Math.round(heroImagePosition.x),
          hero_image_position_y: Math.round(heroImagePosition.y),
          custom_section_name: customSectionName,
        })
        .eq("id", settings?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home-settings"] });
      toast.success("Home page settings updated");
    },
    onError: () => {
      toast.error("Failed to update settings");
    },
  });

  const handleImageUpload = async (mediaAssetId: string, url: string) => {
    setHeroImageId(mediaAssetId);
    setHeroImageUrl(url);
    
    // Auto-save after upload
    try {
      await supabase
        .from("home_page_settings")
        .update({
          hero_image_id: mediaAssetId,
          hero_image_position_x: 50,
          hero_image_position_y: 50,
        })
        .eq("id", settings?.id);
      
      setHeroImagePosition({ x: 50, y: 50 });
      queryClient.invalidateQueries({ queryKey: ["home-settings"] });
      toast.success("Hero image uploaded");
    } catch (error) {
      toast.error("Failed to save hero image");
    }
  };

  const handleCropComplete = (crop: CropData) => {
    // Convert crop box to center position
    const centerX = crop.x + crop.width / 2;
    const centerY = crop.y + crop.height / 2;
    setHeroImagePosition({ x: centerX, y: centerY });
    setShowCropPicker(false);
    toast.success("Position updated. Click 'Save Hero Settings' to apply.");
  };

  const addFeaturedItem = useMutation({
    mutationFn: async ({ type, id }: { type: string; id: string }) => {
      const maxOrder = featuredItems?.reduce((max, item) => Math.max(max, item.order_index), -1) ?? -1;
      
      const { error } = await supabase
        .from("home_page_featured_items")
        .insert({
          item_type: type,
          item_id: id,
          order_index: maxOrder + 1,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home-featured-items"] });
      toast.success("Featured item added");
    },
  });

  const removeFeaturedItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("home_page_featured_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home-featured-items"] });
      toast.success("Featured item removed");
    },
  });

  const addNewContentItem = useMutation({
    mutationFn: async ({ type, id }: { type: string; id: string }) => {
      const maxOrder = newContentItems?.reduce((max, item) => Math.max(max, item.order_index), -1) ?? -1;
      
      const { error } = await supabase
        .from("home_page_new_content_items")
        .insert({
          item_type: type,
          item_id: id,
          order_index: maxOrder + 1,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home-new-content-items"] });
      toast.success("New content item added");
    },
  });

  const removeNewContentItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("home_page_new_content_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home-new-content-items"] });
      toast.success("New content item removed");
    },
  });

  const reorderFeaturedItems = useMutation({
    mutationFn: async (items: Array<{ id: string; order_index: number }>) => {
      const updates = items.map(item => 
        supabase
          .from("home_page_featured_items")
          .update({ order_index: item.order_index })
          .eq("id", item.id)
      );
      
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home-featured-items"] });
      toast.success("Featured items reordered");
    },
  });

  const reorderNewContentItems = useMutation({
    mutationFn: async (items: Array<{ id: string; order_index: number }>) => {
      const updates = items.map(item => 
        supabase
          .from("home_page_new_content_items")
          .update({ order_index: item.order_index })
          .eq("id", item.id)
      );
      
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home-new-content-items"] });
      toast.success("New content items reordered");
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

  const handleNewContentDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && newContentItems) {
      const oldIndex = newContentItems.findIndex((item) => item.id === active.id);
      const newIndex = newContentItems.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(newContentItems, oldIndex, newIndex);
      const updates = newItems.map((item, index) => ({
        id: item.id,
        order_index: index,
      }));

      reorderNewContentItems.mutate(updates);
    }
  };

  // Helper function to get content title
  const getContentTitle = (item: { item_type: string; item_id: string }) => {
    if (item.item_type === 'collection') {
      const collection = collections?.find(c => c.id === item.item_id);
      return collection?.title || 'Unknown Collection';
    } else if (item.item_type === 'lifeline') {
      const lifeline = lifelines?.find(l => l.id === item.item_id);
      return lifeline?.title || 'Unknown Lifeline';
    } else if (item.item_type === 'election') {
      const election = elections?.find(e => e.id === item.item_id);
      return election?.title || 'Unknown Election';
    }
    return 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Home Page Manager</h1>
        <p className="text-muted-foreground">
          Manage the hero section, featured content, and new content on the home page
        </p>
      </div>

      {/* Hero Section Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Hero Section</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="hero-title">Hero Title</Label>
            <Input
              id="hero-title"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              placeholder="Welcome to Lifeline Public"
            />
          </div>
          <div>
            <Label htmlFor="hero-subtitle">Hero Subtitle</Label>
            <Input
              id="hero-subtitle"
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
              placeholder="Explore stories, profiles, and collections"
            />
          </div>
          <div>
            <Label htmlFor="custom-section-name">Custom Section Name</Label>
            <Input
              id="custom-section-name"
              value={customSectionName}
              onChange={(e) => setCustomSectionName(e.target.value)}
              placeholder="New Content"
            />
          </div>
          <div className="space-y-4">
            <Label>Hero Image (1920x480 recommended)</Label>
            
            {heroImageUrl ? (
              <div className="space-y-2">
                <div className="relative w-full rounded-lg overflow-hidden border" style={{ height: "240px" }}>
                  <img
                    src={heroImageUrl}
                    alt="Hero preview"
                    className="w-full h-full object-cover"
                    style={{
                      objectPosition: `${heroImagePosition.x}% ${heroImagePosition.y}%`,
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCropPicker(true)}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Adjust Position
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setHeroImageId(null);
                      setHeroImageUrl(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Image
                  </Button>
                </div>
              </div>
            ) : (
              <DirectImageUpload
                currentImageUrl={heroImageUrl || undefined}
                onUploadComplete={(url, path) => {
                  setHeroImageUrl(url);
                  // Auto-save after upload
                  supabase
                    .from("home_page_settings")
                    .update({
                      hero_image_id: null,
                      hero_image_position_x: 50,
                      hero_image_position_y: 50,
                    })
                    .eq("id", settings?.id)
                    .then(() => {
                      setHeroImagePosition({ x: 50, y: 50 });
                      queryClient.invalidateQueries({ queryKey: ["home-settings"] });
                      toast.success("Hero image uploaded");
                    });
                }}
                onRemove={() => {
                  setHeroImageUrl(null);
                }}
                label="Upload Hero Image"
              />
            )}
            
            <div className="text-xs text-muted-foreground">
              Hero image must be 1920x480 recommended
            </div>
          </div>
          <Button onClick={() => updateSettings.mutate()}>
            Save Hero Settings
          </Button>
          
          {heroImageUrl && (
            <CropBoxPicker
              imageUrl={heroImageUrl}
              open={showCropPicker}
              onOpenChange={setShowCropPicker}
              onCropComplete={handleCropComplete}
              aspectRatio={3}
              title="Adjust Hero Image Position"
            />
          )}
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
                <SelectItem value="divider" disabled>Collections</SelectItem>
                {collections?.map((c) => (
                  <SelectItem key={c.id} value={`collection:${c.id}`}>
                    {c.title}
                  </SelectItem>
                ))}
                <SelectItem value="divider2" disabled>Lifelines</SelectItem>
                {lifelines?.map((l) => (
                  <SelectItem key={l.id} value={`lifeline:${l.id}`}>
                    {l.title}
                  </SelectItem>
                ))}
                <SelectItem value="divider3" disabled>Elections</SelectItem>
                {elections?.map((e) => (
                  <SelectItem key={e.id} value={`election:${e.id}`}>
                    {e.title}
                  </SelectItem>
                ))}
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
            onDragEnd={handleNewContentDragEnd}
          >
            <SortableContext
              items={newContentItems?.map((item) => item.id) || []}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {newContentItems?.map((item) => (
                  <SortableItem
                    key={item.id}
                    id={item.id}
                    title={getContentTitle(item)}
                    subtitle={item.item_type}
                    onRemove={() => removeNewContentItem.mutate(item.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          
          <div className="flex gap-2">
            <Select
              onValueChange={(value) => {
                const [type, id] = value.split(":");
                addNewContentItem.mutate({ type, id });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Add new content item..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="divider" disabled>Collections</SelectItem>
                {collections?.map((c) => (
                  <SelectItem key={c.id} value={`collection:${c.id}`}>
                    {c.title}
                  </SelectItem>
                ))}
                <SelectItem value="divider2" disabled>Lifelines</SelectItem>
                {lifelines?.map((l) => (
                  <SelectItem key={l.id} value={`lifeline:${l.id}`}>
                    {l.title}
                  </SelectItem>
                ))}
                <SelectItem value="divider3" disabled>Elections</SelectItem>
                {elections?.map((e) => (
                  <SelectItem key={e.id} value={`election:${e.id}`}>
                    {e.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
