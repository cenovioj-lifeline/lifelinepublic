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
import { ArrowLeft, Upload, Loader2 } from "lucide-react";
import { uploadImage, getImageDimensions } from "@/lib/storage";

type MediaForm = {
  filename: string;
  url: string;
  type: string;
  alt_text: string;
  credit: string;
  source_url: string;
  width: string;
  height: string;
};

export default function MediaEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isNew = id === "new";
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const form = useForm<MediaForm>({
    defaultValues: {
      filename: "",
      url: "",
      type: "image",
      alt_text: "",
      credit: "",
      source_url: "",
      width: "",
      height: "",
    },
  });

  const { data: media } = useQuery({
    queryKey: ["media", id],
    queryFn: async () => {
      if (isNew) return null;
      const { data, error } = await supabase
        .from("media_assets")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !isNew,
  });

  useEffect(() => {
    if (media) {
      form.reset({
        filename: media.filename,
        url: media.url,
        type: media.type,
        alt_text: media.alt_text || "",
        credit: media.credit || "",
        source_url: media.source_url || "",
        width: media.width?.toString() || "",
        height: media.height?.toString() || "",
      });
      setPreview(media.url);
    }
  }, [media, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: MediaForm) => {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = {
        filename: data.filename,
        url: data.url,
        type: data.type,
        alt_text: data.alt_text || null,
        credit: data.credit || null,
        source_url: data.source_url || null,
        width: data.width ? parseInt(data.width) : null,
        height: data.height ? parseInt(data.height) : null,
      };
      
      if (isNew) {
        const { error } = await supabase.from("media_assets").insert({
          ...payload,
          created_by: user?.id,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("media_assets")
          .update(payload)
          .eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] });
      toast({
        title: "Success",
        description: `Media ${isNew ? "created" : "updated"} successfully`,
      });
      navigate("/media");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MediaForm) => {
    saveMutation.mutate(data);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setPreview(URL.createObjectURL(file));

    try {
      const { url } = await uploadImage(file);
      
      form.setValue("filename", file.name);
      form.setValue("url", url);
      form.setValue("type", file.type.startsWith("image/") ? "image" : file.type.split("/")[0]);
      form.setValue("alt_text", file.name.split(".")[0].replace(/-/g, " "));

      if (file.type.startsWith("image/")) {
        const dimensions = await getImageDimensions(file);
        form.setValue("width", dimensions.width.toString());
        form.setValue("height", dimensions.height.toString());
      }

      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/media")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isNew ? "New Media" : "Edit Media"}
          </h1>
          <p className="text-muted-foreground">
            {isNew ? "Add new media asset" : "Update media details"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {isNew && (
            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {uploading ? (
                    <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                  ) : preview ? (
                    <img src={preview} alt="Preview" className="max-h-32 object-cover rounded" />
                  ) : (
                    <>
                      <Upload className="h-12 w-12 mb-4 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Images, videos, audio up to 10MB
                      </p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,video/*,audio/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="filename"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Filename</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="image.jpg" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="image, video, audio" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="width"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Width (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" placeholder="1920" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="height"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Height (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" placeholder="1080" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="credit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Credit (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Photo by..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="source_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source URL (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="alt_text"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alt Text</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Describe the image for accessibility"
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : "Save Media"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/media")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
