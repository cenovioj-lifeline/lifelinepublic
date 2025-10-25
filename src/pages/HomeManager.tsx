import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DirectImageUpload } from "@/components/DirectImageUpload";
import { ImagePositionPicker } from "@/components/ImagePositionPicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, Plus, Image as ImageIcon } from "lucide-react";

export default function HomeManager() {
  const queryClient = useQueryClient();
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroImageId, setHeroImageId] = useState<string | null>(null);
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const [heroImagePosition, setHeroImagePosition] = useState({ x: 50, y: 50 });
  const [showPositionPicker, setShowPositionPicker] = useState(false);

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
          hero_image_position_x: heroImagePosition.x,
          hero_image_position_y: heroImagePosition.y,
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

  const handlePositionSave = (position: { x: number; y: number }) => {
    setHeroImagePosition(position);
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
                    onClick={() => setShowPositionPicker(true)}
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
            <ImagePositionPicker
              imageUrl={heroImageUrl}
              onPositionChange={handlePositionSave}
              initialPosition={heroImagePosition}
              open={showPositionPicker}
              onOpenChange={setShowPositionPicker}
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
          <div className="space-y-2">
            {featuredItems?.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {getContentTitle(item)}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {item.item_type}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFeaturedItem.mutate(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          
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

      {/* New Content Section */}
      <Card>
        <CardHeader>
          <CardTitle>New Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {newContentItems?.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {getContentTitle(item)}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {item.item_type}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeNewContentItem.mutate(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          
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