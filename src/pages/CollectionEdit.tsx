import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormDescription,
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
import { ArrowLeft } from "lucide-react";
import { DirectImageUpload } from "@/components/DirectImageUpload";
import { CollectionQuotesUpload } from "@/components/CollectionQuotesUpload";
import { CollectionFeaturedProfiles } from "@/components/CollectionFeaturedProfiles";
import { CollectionProfileManager } from "@/components/CollectionProfileManager";
import { ImagePositionPicker } from "@/components/ImagePositionPicker";
import { CollectionContentManager } from "@/components/CollectionContentManager";

const collectionFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(["draft", "published"]),
  is_featured: z.boolean(),
  color_scheme_id: z.string().nullable(),
  hero_image_url: z.string(),
  hero_image_path: z.string(),
  hero_image_position_x: z.number(),
  hero_image_position_y: z.number(),
  card_image_position_x: z.number(),
  card_image_position_y: z.number(),
});

type CollectionForm = z.infer<typeof collectionFormSchema>;

export default function CollectionEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isNew = id === "new";
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);

  const { data: colorSchemes } = useQuery({
    queryKey: ["color-schemes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("color_schemes")
        .select("*")
        .order("is_default", { ascending: false })
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  const defaultScheme = colorSchemes?.find(scheme => scheme.is_default);

  const form = useForm<CollectionForm>({
    resolver: zodResolver(collectionFormSchema),
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      category: "",
      status: "draft",
      is_featured: false,
      color_scheme_id: null,
      hero_image_url: "",
      hero_image_path: "",
      hero_image_position_x: 50,
      hero_image_position_y: 50,
      card_image_position_x: 50,
      card_image_position_y: 50,
    },
  });

  const { data: collection } = useQuery({
    queryKey: ["collection", id],
    queryFn: async () => {
      if (isNew) return null;
      const { data, error } = await supabase
        .from("collections")
        .select("*")
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
        title: collection.title || "",
        slug: collection.slug || "",
        description: collection.description || "",
        category: collection.category || "",
        status: collection.status || "draft",
        is_featured: collection.is_featured || false,
        color_scheme_id: collection.color_scheme_id || defaultScheme?.id || null,
        hero_image_url: collection.hero_image_url || "",
        hero_image_path: collection.hero_image_path || "",
        hero_image_position_x: collection.hero_image_position_x ?? 50,
        hero_image_position_y: collection.hero_image_position_y ?? 50,
        card_image_position_x: collection.card_image_position_x ?? 50,
        card_image_position_y: collection.card_image_position_y ?? 50,
      });
      setHeroImageUrl(collection.hero_image_url || "");
    } else if (isNew && defaultScheme) {
      form.setValue("color_scheme_id", defaultScheme.id);
    }
  }, [collection, isNew, defaultScheme, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: CollectionForm) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const payload = {
        title: data.title,
        slug: data.slug,
        description: data.description || null,
        category: data.category || null,
        status: data.status,
        is_featured: data.is_featured,
        color_scheme_id: data.color_scheme_id,
        hero_image_url: data.hero_image_url || null,
        hero_image_path: data.hero_image_path || null,
        hero_image_position_x: data.hero_image_position_x,
        hero_image_position_y: data.hero_image_position_y,
        card_image_position_x: data.card_image_position_x,
        card_image_position_y: data.card_image_position_y,
      };
      
      if (isNew) {
        const { error } = await supabase.from("collections").insert({
          ...payload,
          created_by: user?.id,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("collections")
          .update(payload)
          .eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["collections-grid"] });
      queryClient.invalidateQueries({ queryKey: ["collection-lifelines-all"] });
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

  // Auto-save image changes immediately
  const saveImageMutation = useMutation({
    mutationFn: async ({ url, path }: { url: string; path: string }) => {
      if (isNew) return;
      
      const { error } = await supabase
        .from("collections")
        .update({
          hero_image_url: url,
          hero_image_path: path,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection", id] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["collections-grid"] });
      queryClient.invalidateQueries({ queryKey: ["collection-lifelines-all"] });
      toast({
        title: "Image saved",
        description: "Collection image updated successfully",
      });
    },
  });

  // Auto-save position changes
  const savePositionMutation = useMutation({
    mutationFn: async (positions: {
      hero_image_position_x?: number;
      hero_image_position_y?: number;
      card_image_position_x?: number;
      card_image_position_y?: number;
    }) => {
      if (isNew) return;
      
      const { error } = await supabase
        .from("collections")
        .update(positions)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection", id] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["collections-grid"] });
      queryClient.invalidateQueries({ queryKey: ["collection-lifelines-all"] });
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
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Collection description" rows={4} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_featured"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-4 w-4"
                  />
                </FormControl>
                <FormLabel className="!mt-0">Featured Collection</FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="color_scheme_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Color Scheme</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value || undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a color scheme" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {colorSchemes?.map((scheme) => (
                      <SelectItem key={scheme.id} value={scheme.id}>
                        {scheme.name} {scheme.is_default ? "(Default)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose a color scheme for this collection. Manage color schemes in the Color Schemes section.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-6 mt-8">
            <h3 className="text-lg font-medium">Hero Image</h3>
            <DirectImageUpload
              currentImageUrl={form.watch("hero_image_url")}
              currentImagePath={form.watch("hero_image_path")}
              onUploadComplete={(url, path) => {
                form.setValue("hero_image_url", url);
                form.setValue("hero_image_path", path);
                setHeroImageUrl(url);
                if (!isNew) {
                  saveImageMutation.mutate({ url, path });
                }
              }}
              onRemove={() => {
                form.setValue("hero_image_url", "");
                form.setValue("hero_image_path", "");
                setHeroImageUrl(null);
                if (!isNew) {
                  saveImageMutation.mutate({ url: "", path: "" });
                }
              }}
              onPositionChange={(position) => {
                form.setValue("hero_image_position_x", position.x);
                form.setValue("hero_image_position_y", position.y);
                if (!isNew) {
                  savePositionMutation.mutate({
                    hero_image_position_x: position.x,
                    hero_image_position_y: position.y,
                  });
                }
              }}
              initialPosition={{
                x: form.watch("hero_image_position_x"),
                y: form.watch("hero_image_position_y"),
              }}
              viewType="banner"
              label="Upload Collection Hero Image"
            />
          </div>

          {!isNew && (
            <>
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Collection Quotes</h3>
                <CollectionQuotesUpload collectionId={id!} />
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Profile Connections</h3>
                <CollectionProfileManager collectionId={id!} />
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Featured Profiles</h3>
                <CollectionFeaturedProfiles collectionId={id!} />
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Collection Content</h3>
                <CollectionContentManager collectionId={id!} />
              </div>
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
