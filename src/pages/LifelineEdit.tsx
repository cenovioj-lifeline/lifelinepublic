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
import { ArrowLeft, Plus } from "lucide-react";
import { MediaPickerModal } from "@/components/MediaPickerModal";
import { EntryCard } from "@/components/EntryCard";
import { Checkbox } from "@/components/ui/checkbox";
import { EntryForm } from "@/components/EntryForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type LifelineForm = {
  title: string;
  slug: string;
  subject: string;
  subtitle: string;
  intro: string;
  conclusion: string;
  visibility: "public" | "private" | "unlisted";
  lifeline_type: "person" | "list" | "voting";
  status: "draft" | "published";
  collection_id: string;
  cover_image_id: string;
  linked_profile_ids: string[];
  is_featured: boolean;
};

export default function LifelineEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isNew = id === "new";
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);

  const form = useForm<LifelineForm>({
    defaultValues: {
      title: "",
      slug: "",
      subject: "",
      subtitle: "",
      intro: "",
      conclusion: "",
      visibility: "public",
      lifeline_type: "person",
      status: "draft",
      collection_id: "",
      cover_image_id: "",
      linked_profile_ids: [],
      is_featured: false,
    },
  });

  const { data: lifeline } = useQuery({
    queryKey: ["lifeline", id],
    queryFn: async () => {
      if (isNew) return null;
      const { data, error } = await supabase
        .from("lifelines")
        .select(`
          *,
          profile_lifelines(profile_id)
        `)
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

  const { data: profiles } = useQuery({
    queryKey: ["profiles-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name")
        .order("display_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: entries } = useQuery({
    queryKey: ["entries", id],
    queryFn: async () => {
      if (isNew) return [];
      const { data, error } = await supabase
        .from("entries")
        .select("*")
        .eq("lifeline_id", id)
        .order(
          lifeline?.lifeline_type === "list" || lifeline?.lifeline_type === "voting" ? "order_index" : "occurred_on",
          { ascending: lifeline?.lifeline_type === "list" || lifeline?.lifeline_type === "voting" }
        );
      if (error) throw error;
      return data;
    },
    enabled: !isNew,
  });

  useEffect(() => {
    if (lifeline) {
      const linkedProfileIds = lifeline.profile_lifelines?.map((pl: any) => pl.profile_id) || [];
      form.reset({
        title: lifeline.title,
        slug: lifeline.slug,
        subject: lifeline.subject || "",
        subtitle: lifeline.subtitle || "",
        intro: lifeline.intro || "",
        conclusion: lifeline.conclusion || "",
        visibility: lifeline.visibility,
        lifeline_type: lifeline.lifeline_type,
        status: lifeline.status,
        collection_id: lifeline.collection_id || "",
        cover_image_id: lifeline.cover_image_id || "",
        linked_profile_ids: linkedProfileIds,
        is_featured: lifeline.is_featured || false,
      });
    }
  }, [lifeline, form]);

  // Auto-generate slug when title changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "title" && value.title && !form.formState.dirtyFields.slug) {
        const slug = value.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
        form.setValue("slug", slug, { shouldDirty: false });
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const saveMutation = useMutation({
    mutationFn: async (data: LifelineForm) => {
      const payload = {
        title: data.title,
        slug: data.slug,
        subject: data.subject || null,
        subtitle: data.subtitle || null,
        intro: data.intro || null,
        conclusion: data.conclusion || null,
        visibility: data.visibility,
        lifeline_type: data.lifeline_type,
        status: data.status,
        collection_id: data.collection_id || null,
        cover_image_id: data.cover_image_id || null,
        is_featured: data.is_featured,
      };
      
      let lifelineId = id;
      if (isNew) {
        const { data: newLifeline, error } = await supabase
          .from("lifelines")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        lifelineId = newLifeline.id;
      } else {
        const { error } = await supabase
          .from("lifelines")
          .update(payload)
          .eq("id", id);
        if (error) throw error;
      }

      // Update profile_lifelines junction table
      if (lifelineId) {
        // Delete existing relationships
        await supabase
          .from("profile_lifelines")
          .delete()
          .eq("lifeline_id", lifelineId);

        // Insert new relationships
        if (data.linked_profile_ids.length > 0) {
          const relationships = data.linked_profile_ids.map(profileId => ({
            lifeline_id: lifelineId,
            profile_id: profileId,
            relationship_type: "related",
          }));
          const { error } = await supabase
            .from("profile_lifelines")
            .insert(relationships);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lifelines"] });
      toast({
        title: "Success",
        description: `Lifeline ${isNew ? "created" : "updated"} successfully`,
      });
      navigate("/lifelines");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LifelineForm) => {
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

  const saveEntryMutation = useMutation({
    mutationFn: async (entryData: any) => {
      const payload = {
        ...entryData,
        lifeline_id: id,
        collection_id: lifeline?.collection_id || null,
      };

      if (editingEntry) {
        const { error } = await supabase
          .from("entries")
          .update(payload)
          .eq("id", editingEntry.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("entries").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries", id] });
      toast({
        title: "Success",
        description: `Entry ${editingEntry ? "updated" : "created"} successfully`,
      });
      setShowEntryForm(false);
      setEditingEntry(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await supabase.from("entries").delete().eq("id", entryId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries", id] });
      toast({
        title: "Success",
        description: "Entry deleted successfully",
      });
      setDeletingEntryId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEntrySubmit = (data: any) => {
    saveEntryMutation.mutate(data);
  };

  const handleEntryEdit = (entry: any) => {
    setEditingEntry(entry);
    setShowEntryForm(true);
  };

  const handleEntryCancel = () => {
    setShowEntryForm(false);
    setEditingEntry(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/lifelines")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isNew ? "New Lifeline" : "Edit Lifeline"}
          </h1>
          <p className="text-muted-foreground">
            {isNew ? "Create a new lifeline story" : "Update lifeline details"}
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
                  <FormLabel>Lifeline Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Lifeline name" />
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
                  <FormLabel>Slug (auto-generated)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="lifeline-slug" readOnly className="bg-muted" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Lifeline subject" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lifeline_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="person">Person</SelectItem>
                      <SelectItem value="list">List</SelectItem>
                      <SelectItem value="voting">Voting</SelectItem>
                    </SelectContent>
                  </Select>
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
                    <SelectContent className="bg-background">
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
              name="is_featured"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Featured in Collection
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Display this lifeline in the featured section of the collection homepage
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cover_image_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover Image (Optional)</FormLabel>
                  <FormControl>
                    <MediaPickerModal
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select cover image"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subtitle</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Brief subtitle" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="linked_profile_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Linked Profiles (Multi-select)</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      const current = field.value || [];
                      if (!current.includes(value)) {
                        field.onChange([...current, value]);
                      }
                    }} 
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Add profiles" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-background">
                      {profiles?.filter(p => !field.value?.includes(p.id)).map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {field.value?.map((profileId) => {
                      const profile = profiles?.find(p => p.id === profileId);
                      return profile ? (
                        <div key={profileId} className="flex items-center gap-2 bg-secondary text-secondary-foreground px-3 py-1 rounded-md">
                          <span className="text-sm">{profile.display_name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              field.onChange(field.value.filter((id: string) => id !== profileId));
                            }}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            ×
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="intro"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Introduction</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Introduction text"
                    rows={4}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="conclusion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Conclusion</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Conclusion text"
                    rows={4}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : "Save Lifeline"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/lifelines")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>

      {!isNew && (
        <>
          <Separator className="my-8" />

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Lifeline Entries</h2>
                <p className="text-muted-foreground">
                  {entries?.length || 0} {entries?.length === 1 ? "Entry" : "Entries"}
                </p>
              </div>
              <Button onClick={() => setShowEntryForm(!showEntryForm)}>
                <Plus className="mr-2 h-4 w-4" />
                {showEntryForm ? "Hide Form" : "New Entry"}
              </Button>
            </div>

            {showEntryForm && (
              <Card>
                <CardHeader>
                  <CardTitle>{editingEntry ? "Edit Entry" : "New Entry"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <EntryForm
                    lifelineType={lifeline?.lifeline_type || "person"}
                    defaultValues={editingEntry || undefined}
                    onSubmit={handleEntrySubmit}
                    onCancel={handleEntryCancel}
                    isSubmitting={saveEntryMutation.isPending}
                    isEditing={!!editingEntry}
                  />
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              {entries?.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No entries yet. Create your first entry above.
                  </CardContent>
                </Card>
              ) : (
                entries?.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    lifelineType={lifeline?.lifeline_type || "person"}
                    onEdit={() => handleEntryEdit(entry)}
                    onDelete={() => setDeletingEntryId(entry.id)}
                  />
                ))
              )}
            </div>
          </div>
        </>
      )}

      <AlertDialog open={!!deletingEntryId} onOpenChange={() => setDeletingEntryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingEntryId && deleteEntryMutation.mutate(deletingEntryId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
