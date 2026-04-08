import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DirectImageUpload } from "@/components/DirectImageUpload";
import { CropBoxPicker, CropData } from "@/components/admin/CropBoxPicker";
import { toast } from "sonner";
import { Trash2, Image as ImageIcon } from "lucide-react";

export default function HomeManager() {
  const queryClient = useQueryClient();
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroImageId, setHeroImageId] = useState<string | null>(null);
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const [heroImagePath, setHeroImagePath] = useState<string | null>(null);
  const [heroImagePosition, setHeroImagePosition] = useState({ x: 50, y: 50 });
  const [showCropPicker, setShowCropPicker] = useState(false);

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
      // Prefer hero_image_url column, fallback to media_asset relation
      setHeroImageUrl((data as any).hero_image_url || data.hero_image?.url || null);
      setHeroImagePath((data as any).hero_image_path || null);
      setHeroImagePosition({
        x: data.hero_image_position_x || 50,
        y: data.hero_image_position_y || 50,
      });
      
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

  const handleCropComplete = (crop: CropData) => {
    // Convert crop box to center position
    const centerX = crop.x + crop.width / 2;
    const centerY = crop.y + crop.height / 2;
    setHeroImagePosition({ x: centerX, y: centerY });
    setShowCropPicker(false);
    toast.success("Position updated. Click 'Save Hero Settings' to apply.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Home Page Manager</h1>
        <p className="text-muted-foreground">
          Manage the hero section for the home page. Use Page Builder to configure content.
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
            <Label>Hero Image (6:1)</Label>
            <p className="text-xs text-muted-foreground">
              Used on the home page header. Upload at 3840×640 or similar 6:1 ratio for best results.
            </p>
            
            {heroImageUrl ? (
              <div className="space-y-2">
                <div className="relative w-full rounded-lg overflow-hidden border aspect-6/1">
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
                viewType="banner"
                onUploadComplete={(url, path) => {
                  setHeroImageUrl(url);
                  setHeroImagePath(path);
                  // Auto-save after upload - save URL and path to new columns
                  supabase
                    .from("home_page_settings")
                    .update({
                      hero_image_url: url,
                      hero_image_path: path,
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
                  setHeroImagePath(null);
                  // Clear from database
                  supabase
                    .from("home_page_settings")
                    .update({
                      hero_image_url: null,
                      hero_image_path: null,
                      hero_image_id: null,
                    })
                    .eq("id", settings?.id)
                    .then(() => {
                      queryClient.invalidateQueries({ queryKey: ["home-settings"] });
                    });
                }}
                label="Upload Hero Image"
              />
            )}
            
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
              aspectRatio={6}
              title="Adjust Hero Image Position"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
