import { useEffect } from "react";
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
import { ArrowLeft } from "lucide-react";

type ElectionForm = {
  title: string;
  slug: string;
  description: string;
  opens_at: string;
  closes_at: string;
  visibility: "public" | "private" | "unlisted";
  status: "draft" | "published";
  collection_id: string;
};

export default function ElectionEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isNew = id === "new";

  const form = useForm<ElectionForm>({
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      opens_at: "",
      closes_at: "",
      visibility: "public",
      status: "draft",
      collection_id: "",
    },
  });

  const { data: election } = useQuery({
    queryKey: ["election", id],
    queryFn: async () => {
      if (isNew) return null;
      const { data, error } = await supabase
        .from("mock_elections")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !isNew,
  });

  const { data: collections } = useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("id, title")
        .order("title");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (election) {
      form.reset({
        title: election.title,
        slug: election.slug,
        description: election.description || "",
        opens_at: election.opens_at ? new Date(election.opens_at).toISOString().slice(0, 16) : "",
        closes_at: election.closes_at ? new Date(election.closes_at).toISOString().slice(0, 16) : "",
        visibility: election.visibility,
        status: election.status,
        collection_id: election.collection_id || "",
      });
    }
  }, [election, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: ElectionForm) => {
      const payload = {
        title: data.title,
        slug: data.slug,
        description: data.description || null,
        opens_at: data.opens_at || null,
        closes_at: data.closes_at || null,
        visibility: data.visibility,
        status: data.status,
        collection_id: data.collection_id || null,
      };
      
      if (isNew) {
        const { error } = await supabase.from("mock_elections").insert(payload);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("mock_elections")
          .update(payload)
          .eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["elections"] });
      toast({
        title: "Success",
        description: `Election ${isNew ? "created" : "updated"} successfully`,
      });
      navigate("/elections");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ElectionForm) => {
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
        <Button variant="ghost" size="icon" onClick={() => navigate("/elections")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isNew ? "New Election" : "Edit Election"}
          </h1>
          <p className="text-muted-foreground">
            {isNew ? "Create a new mock election" : "Update election details"}
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
                    <Input {...field} placeholder="Election title" />
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
                      <Input {...field} placeholder="election-slug" />
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
              name="visibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visibility</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="unlisted">Unlisted</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="collection_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Collection (Optional)</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(value === "none" ? "" : value)} 
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a collection" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {collections?.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="opens_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opens At (Optional)</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="closes_at"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Closes At (Optional)</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
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
                  <Textarea
                    {...field}
                    placeholder="Election description"
                    rows={4}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : "Save Election"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/elections")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
