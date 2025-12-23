import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DirectImageUpload } from "@/components/DirectImageUpload";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type EntryFormData = {
  title: string;
  occurred_on?: string;
  order_index: number;
  summary: string;
  details: string;
  score: number;
  tags?: string;
  related_lifelines?: string;
  media_suggestion?: string;
};

interface EntryFormProps {
  lifelineType: "person" | "list" | "voting" | "event" | "org" | "rating";
  defaultValues?: Partial<EntryFormData>;
  onSubmit: (data: EntryFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  isEditing?: boolean;
  entryId?: string;
}

export function EntryForm({
  lifelineType,
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
  isEditing,
  entryId,
}: EntryFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<EntryFormData>({
    defaultValues: {
      title: "",
      summary: "",
      details: "",
      score: 0,
      order_index: 0,
      tags: "",
      related_lifelines: "",
      media_suggestion: "",
      ...defaultValues,
    },
  });

  // Reset form when defaultValues change (e.g., when editing a different entry)
  useEffect(() => {
    form.reset({
      title: "",
      summary: "",
      details: "",
      score: 0,
      order_index: 0,
      tags: "",
      related_lifelines: "",
      media_suggestion: "",
      ...defaultValues,
    });
  }, [defaultValues, form]);

  // Fetch existing images for this entry
  const { data: entryImages } = useQuery({
    queryKey: ["entry-images", entryId],
    queryFn: async () => {
      if (!entryId) return [];
      const { data, error } = await supabase
        .from("entry_images")
        .select("*")
        .eq("entry_id", entryId)
        .order("order_index");
      if (error) throw error;
      return data || [];
    },
    enabled: !!entryId && isEditing,
  });

  // Add image to entry
  const addImageMutation = useMutation({
    mutationFn: async ({ url, path }: { url: string; path: string }) => {
      if (!entryId) throw new Error("Entry ID is required");
      
      // Get the next order index
      const maxOrder = entryImages?.reduce((max, img) => Math.max(max, img.order_index || 0), 0) || 0;
      
      const { error } = await supabase
        .from("entry_images")
        .insert({
          entry_id: entryId,
          image_url: url,
          image_path: path,
          order_index: maxOrder + 1,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entry-images", entryId] });
      toast({
        title: "Success",
        description: "Image added to entry",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove image from entry
  const removeImageMutation = useMutation({
    mutationFn: async (imageId: string) => {
      const { error } = await supabase
        .from("entry_images")
        .delete()
        .eq("id", imageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entry-images", entryId] });
      toast({
        title: "Success",
        description: "Image removed from entry",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFormSubmit = (data: EntryFormData) => {
    // Auto-calculate sentiment based on score
    const sentiment = data.score > 0 ? "positive" : data.score < 0 ? "negative" : "neutral";
    onSubmit({ ...data, sentiment } as any);
  };

  const isListType = lifelineType === "list" || lifelineType === "voting" || lifelineType === "rating";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Entry Title *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Entry title" required />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {isListType ? (
            <FormField
              control={form.control}
              name="order_index"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rank *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      placeholder="1, 2, 3..."
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <FormField
              control={form.control}
              name="occurred_on"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date (Optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {lifelineType !== "voting" && (
            <FormField
              control={form.control}
              name="score"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rating: {field.value}</FormLabel>
                  <FormControl>
                    <Slider
                      min={-10}
                      max={10}
                      step={1}
                      value={[field.value]}
                      onValueChange={(vals) => field.onChange(vals[0])}
                    />
                  </FormControl>
                  <FormDescription>
                    Positive scores = green (good events), Negative scores = red (challenges)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <FormField
          control={form.control}
          name="summary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description *</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  value={field.value || ""} 
                  placeholder="2-3 sentences" 
                  rows={4} 
                  required 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="details"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Extended Details (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  value={field.value || ""} 
                  placeholder="Additional context and information" 
                  rows={6} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags (Optional)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="tag1|tag2|tag3" />
                </FormControl>
                <FormDescription>Pipe-separated tags</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="related_lifelines"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Related Lifelines (Optional)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="lifeline-id-1|lifeline-id-2" />
                </FormControl>
                <FormDescription>Pipe-separated lifeline IDs</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="media_suggestion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Media Suggestion (Optional)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Suggest media for this entry" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {isEditing && entryId && (
          <Card>
            <CardHeader>
              <CardTitle>Entry Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {entryImages && entryImages.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {entryImages.map((img) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={img.image_url}
                        alt={img.alt_text || "Entry image"}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImageMutation.mutate(img.id)}
                        disabled={removeImageMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No images attached to this entry yet.</p>
              )}
              
              <div>
                <FormLabel>Add Image</FormLabel>
                <DirectImageUpload
                  onUploadComplete={(url, path) => {
                    addImageMutation.mutate({ url, path });
                  }}
                  label="Upload Entry Image"
                />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? isEditing
                ? "Updating..."
                : "Saving..."
              : isEditing
              ? "Update Entry"
              : "Save Entry"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            {isEditing ? "Cancel" : "Clear Form"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
