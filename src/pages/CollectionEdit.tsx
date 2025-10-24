import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Trash2, Image as ImageIcon } from "lucide-react";
import { MediaPickerModal } from "@/components/MediaPickerModal";
import { CollectionQuotesUpload } from "@/components/CollectionQuotesUpload";
import { CollectionFeaturedProfiles } from "@/components/CollectionFeaturedProfiles";
import { ImagePositionPicker } from "@/components/ImagePositionPicker";

type CollectionForm = {
  title: string;
  slug: string;
  description: string;
  category: string;
  primary_color: string;
  secondary_color: string;
  web_primary: string;
  web_secondary: string;
  menu_text_color: string;
  menu_hover_color: string;
  menu_active_color: string;
  collection_bg_color: string;
  collection_text_color: string;
  collection_heading_color: string;
  collection_accent_color: string;
  collection_card_bg: string;
  collection_border_color: string;
  collection_muted_text: string;
  collection_badge_color: string;
  status: "draft" | "published";
  is_featured: boolean;
  hero_image_id: string;
  hero_image_position_x: number;
  hero_image_position_y: number;
};

export default function CollectionEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isNew = id === "new";
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const [showPositionPicker, setShowPositionPicker] = useState(false);

  const form = useForm<CollectionForm>({
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      category: "",
      primary_color: "#16a34a",
      secondary_color: "#dc2626",
      web_primary: "",
      web_secondary: "",
      menu_text_color: "",
      menu_hover_color: "",
      menu_active_color: "",
      collection_bg_color: "",
      collection_text_color: "",
      collection_heading_color: "",
      collection_accent_color: "",
      collection_card_bg: "",
      collection_border_color: "",
      collection_muted_text: "",
      collection_badge_color: "",
      status: "draft",
      is_featured: false,
      hero_image_id: "",
      hero_image_position_x: 50,
      hero_image_position_y: 50,
    },
  });

  const { data: collection } = useQuery({
    queryKey: ["collection", id],
    queryFn: async () => {
      if (isNew) return null;
      const { data, error } = await supabase
        .from("collections")
        .select(`
          *,
          hero_image:media_assets!collections_hero_image_id_fkey(url, alt_text)
        `)
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !isNew,
  });

  useEffect(() => {
    if (collection) {
      form.reset({
        title: collection.title,
        slug: collection.slug,
        description: collection.description || "",
        category: collection.category || "",
        primary_color: collection.primary_color || "#16a34a",
        secondary_color: collection.secondary_color || "#dc2626",
        web_primary: collection.web_primary || "",
        web_secondary: collection.web_secondary || "",
        menu_text_color: collection.menu_text_color || "",
        menu_hover_color: collection.menu_hover_color || "",
        menu_active_color: collection.menu_active_color || "",
        collection_bg_color: collection.collection_bg_color || "",
        collection_text_color: collection.collection_text_color || "",
        collection_heading_color: collection.collection_heading_color || "",
        collection_accent_color: collection.collection_accent_color || "",
        collection_card_bg: collection.collection_card_bg || "",
        collection_border_color: collection.collection_border_color || "",
        collection_muted_text: collection.collection_muted_text || "",
        collection_badge_color: collection.collection_badge_color || "",
        status: collection.status,
        is_featured: collection.is_featured || false,
        hero_image_id: collection.hero_image_id || "",
        hero_image_position_x: collection.hero_image_position_x || 50,
        hero_image_position_y: collection.hero_image_position_y || 50,
      });
      
      // Set hero image URL if available
      if (collection.hero_image?.url) {
        setHeroImageUrl(collection.hero_image.url);
      }
    }
  }, [collection, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: CollectionForm) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Convert empty strings to null for UUID fields
      const cleanedData = {
        ...data,
        hero_image_id: data.hero_image_id || null,
        web_primary: data.web_primary || null,
        web_secondary: data.web_secondary || null,
        menu_text_color: data.menu_text_color || null,
        menu_hover_color: data.menu_hover_color || null,
        menu_active_color: data.menu_active_color || null,
        collection_bg_color: data.collection_bg_color || null,
        collection_text_color: data.collection_text_color || null,
        collection_heading_color: data.collection_heading_color || null,
        collection_accent_color: data.collection_accent_color || null,
        collection_card_bg: data.collection_card_bg || null,
        collection_border_color: data.collection_border_color || null,
        collection_muted_text: data.collection_muted_text || null,
        collection_badge_color: data.collection_badge_color || null,
      };
      
      if (isNew) {
        const { error } = await supabase.from("collections").insert({
          ...cleanedData,
          created_by: user?.id,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("collections")
          .update(cleanedData)
          .eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast({
        title: "Success",
        description: `Collection ${isNew ? "created" : "updated"} successfully`,
      });
      navigate("/collections");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CollectionForm) => {
    saveMutation.mutate(data);
  };

  const generateSlug = () => {
    const title = form.getValues("title");
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    form.setValue("slug", slug);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/collections")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isNew ? "New Collection" : "Edit Collection"}
          </h1>
          <p className="text-muted-foreground">
            {isNew ? "Create a new themed collection" : "Update collection details"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Collection title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input {...field} placeholder="collection-slug" />
                    </FormControl>
                    <Button type="button" variant="outline" onClick={generateSlug}>
                      Generate
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., TV Shows, History" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="primary_color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Color (green bar)</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input 
                        {...field} 
                        type="text"
                        placeholder="#16a34a"
                        pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                        className="flex-1"
                      />
                    </FormControl>
                    <Input 
                      type="color" 
                      value={field.value || "#16a34a"}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="w-16 h-10 cursor-pointer"
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="secondary_color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Secondary Color (red bar)</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input 
                        {...field} 
                        type="text"
                        placeholder="#dc2626"
                        pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                        className="flex-1"
                      />
                    </FormControl>
                    <Input 
                      type="color" 
                      value={field.value || "#dc2626"}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="w-16 h-10 cursor-pointer"
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="web_primary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Web Primary Color (Optional)</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input 
                        {...field} 
                        type="text"
                        placeholder="#000000"
                        pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                        className="flex-1"
                      />
                    </FormControl>
                    <Input 
                      type="color" 
                      value={field.value || "#000000"}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="w-16 h-10 cursor-pointer"
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="web_secondary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Web Secondary Color (Optional)</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input 
                        {...field} 
                        type="text"
                        placeholder="#ffffff"
                        pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                        className="flex-1"
                      />
                    </FormControl>
                    <Input 
                      type="color" 
                      value={field.value || "#ffffff"}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="w-16 h-10 cursor-pointer"
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Menu Appearance (Optional)</h3>
            <p className="text-sm text-muted-foreground">
              Customize navigation menu colors. If not set, smart defaults will be used.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <FormField
              control={form.control}
              name="menu_text_color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Menu Text Color (Optional)</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input 
                        {...field} 
                        type="text"
                        placeholder="#ffffff"
                        pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                        className="flex-1"
                      />
                    </FormControl>
                    <Input 
                      type="color" 
                      value={field.value || "#ffffff"}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="w-16 h-10 cursor-pointer"
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="menu_hover_color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Menu Hover Color (Optional)</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input 
                        {...field} 
                        type="text"
                        placeholder="#rgba(255,255,255,0.1)"
                        className="flex-1"
                      />
                    </FormControl>
                    <Input 
                      type="color" 
                      value={field.value || "#ffffff"}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="w-16 h-10 cursor-pointer"
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="menu_active_color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Menu Active Color (Optional)</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input 
                        {...field} 
                        type="text"
                        placeholder="#rgba(255,255,255,0.2)"
                        className="flex-1"
                      />
                    </FormControl>
                    <Input 
                      type="color" 
                      value={field.value || "#ffffff"}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="w-16 h-10 cursor-pointer"
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Collection Page Colors (Optional)</h3>
            <p className="text-sm text-muted-foreground">
              Customize the colors for all pages within this collection. If not set, global colors will be used.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="collection_bg_color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Background Color</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input 
                        {...field} 
                        type="text"
                        placeholder="#ffffff"
                        pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                        className="flex-1"
                      />
                    </FormControl>
                    <Input 
                      type="color" 
                      value={field.value || "#ffffff"}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="w-16 h-10 cursor-pointer"
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="collection_text_color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Text Color</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input 
                        {...field} 
                        type="text"
                        placeholder="#000000"
                        pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                        className="flex-1"
                      />
                    </FormControl>
                    <Input 
                      type="color" 
                      value={field.value || "#000000"}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="w-16 h-10 cursor-pointer"
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="collection_heading_color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Heading Color</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input 
                        {...field} 
                        type="text"
                        placeholder="#000000"
                        pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                        className="flex-1"
                      />
                    </FormControl>
                    <Input 
                      type="color" 
                      value={field.value || "#000000"}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="w-16 h-10 cursor-pointer"
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="collection_accent_color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Accent Color (Buttons)</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input 
                        {...field} 
                        type="text"
                        placeholder="#16a34a"
                        pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                        className="flex-1"
                      />
                    </FormControl>
                    <Input 
                      type="color" 
                      value={field.value || "#16a34a"}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="w-16 h-10 cursor-pointer"
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="collection_card_bg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Card Background</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input 
                        {...field} 
                        type="text"
                        placeholder="#f9fafb"
                        pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                        className="flex-1"
                      />
                    </FormControl>
                    <Input 
                      type="color" 
                      value={field.value || "#f9fafb"}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="w-16 h-10 cursor-pointer"
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="collection_border_color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Border Color</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input 
                        {...field} 
                        type="text"
                        placeholder="#e5e7eb"
                        pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                        className="flex-1"
                      />
                    </FormControl>
                    <Input 
                      type="color" 
                      value={field.value || "#e5e7eb"}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="w-16 h-10 cursor-pointer"
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="collection_muted_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Muted Text Color</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input 
                        {...field} 
                        type="text"
                        placeholder="#6b7280"
                        pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                        className="flex-1"
                      />
                    </FormControl>
                    <Input 
                      type="color" 
                      value={field.value || "#6b7280"}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="w-16 h-10 cursor-pointer"
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="collection_badge_color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Badge Color</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input 
                        {...field} 
                        type="text"
                        placeholder="#f3f4f6"
                        pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                        className="flex-1"
                      />
                    </FormControl>
                    <Input 
                      type="color" 
                      value={field.value || "#f3f4f6"}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="w-16 h-10 cursor-pointer"
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <FormLabel>Hero Image (1920x480 recommended)</FormLabel>
            
            {heroImageUrl ? (
              <div className="space-y-2">
                {/* Hero Banner Preview (3:1 aspect - matches desktop view) */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground mb-2">Collection Banner Preview (Desktop 3:1 ratio):</p>
                  <div className="relative w-full rounded-lg overflow-hidden border aspect-[3/1]">
                    <img
                      src={heroImageUrl}
                      alt="Hero banner preview"
                      className="w-full h-full object-cover"
                      style={{
                        objectPosition: `${form.watch("hero_image_position_x")}% ${form.watch("hero_image_position_y")}%`,
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPositionPicker(true)}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Adjust Position
                  </Button>
                </div>
                
                {/* Collection Card Preview (16:9 aspect) */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground mb-2">Collection Card Preview (16:9 ratio):</p>
                  <div className="relative w-full max-w-md rounded-lg overflow-hidden border aspect-video">
                    <img
                      src={heroImageUrl}
                      alt="Card preview"
                      className="w-full h-full object-cover"
                      style={{
                        objectPosition: `${form.watch("hero_image_position_x")}% ${form.watch("hero_image_position_y")}%`,
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPositionPicker(true)}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Adjust Position
                  </Button>
                </div>
                
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      form.setValue("hero_image_id", "");
                      setHeroImageUrl(null);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Image
                  </Button>
                </div>
              </div>
            ) : (
              <FormField
                control={form.control}
                name="hero_image_id"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <MediaPickerModal
                        value={field.value}
                        onValueChange={(id) => {
                          field.onChange(id);
                          // Fetch the URL for the selected media
                          if (id) {
                            supabase
                              .from("media_assets")
                              .select("url")
                              .eq("id", id)
                              .single()
                              .then(({ data }) => {
                                if (data) setHeroImageUrl(data.url);
                              });
                          }
                        }}
                        placeholder="Select hero image"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {heroImageUrl && (
              <ImagePositionPicker
                imageUrl={heroImageUrl}
                onPositionChange={(position) => {
                  form.setValue("hero_image_position_x", position.x);
                  form.setValue("hero_image_position_y", position.y);
                  toast({
                    title: "Position updated",
                    description: "Click 'Save Collection' to apply changes",
                  });
                }}
                initialPosition={{
                  x: form.watch("hero_image_position_x"),
                  y: form.watch("hero_image_position_y"),
                }}
                open={showPositionPicker}
                onOpenChange={setShowPositionPicker}
              />
            )}
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Collection description"
                    rows={4}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_featured"
            render={({ field }) => (
              <FormItem className="flex items-center gap-4">
                <FormLabel>Featured Collection</FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {!isNew && collection && (
            <>
              <CollectionQuotesUpload collectionId={collection.id} />
              <CollectionFeaturedProfiles collectionId={collection.id} />
            </>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : "Save Collection"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/collections")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
