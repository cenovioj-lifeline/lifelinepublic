import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Star, Copy } from "lucide-react";
import { useNavigate } from "react-router-dom";
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

interface ColorScheme {
  id: string;
  name: string;
  description?: string;
  is_default: boolean;
  created_at: string;
  // All 20 color fields
  nav_bg_color: string;
  nav_text_color: string;
  nav_button_color: string;
  ll_display_bg: string;
  ll_graph_positive: string;
  ll_graph_negative: string;
  ll_entry_title_text: string;
  ll_entry_contributor_button: string;
  ll_graph_bg: string;
  ch_banner_text: string;
  ch_actions_bg: string;
  ch_actions_border: string;
  ch_actions_icon: string;
  ch_actions_text: string;
  cards_bg: string;
  cards_border: string;
  cards_text: string;
  title_text: string;
  award_bg: string;
  award_border: string;
}

export default function ColorSchemes() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: colorSchemes, isLoading } = useQuery({
    queryKey: ["color-schemes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("color_schemes")
        .select("*")
        .order("is_default", { ascending: false })
        .order("name");
      if (error) throw error;
      return data as ColorScheme[];
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      // First, unset all defaults
      await supabase
        .from("color_schemes")
        .update({ is_default: false })
        .neq("id", "00000000-0000-0000-0000-000000000000");

      // Then set the new default
      const { error } = await supabase
        .from("color_schemes")
        .update({ is_default: true })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["color-schemes"] });
      toast({
        title: "Default Updated",
        description: "Default color scheme has been updated",
      });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (scheme: ColorScheme) => {
      const { id, created_at, is_default, ...schemeData } = scheme;
      const { error } = await supabase
        .from("color_schemes")
        .insert({
          ...schemeData,
          name: `${scheme.name} (Copy)`,
          is_default: false,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["color-schemes"] });
      toast({
        title: "Scheme Duplicated",
        description: "Color scheme has been duplicated successfully",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("color_schemes")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["color-schemes"] });
      toast({
        title: "Scheme Deleted",
        description: "Color scheme has been deleted successfully",
      });
      setDeleteId(null);
    },
  });

  const ColorPreview = ({ scheme }: { scheme: ColorScheme }) => (
    <div className="flex gap-1 mt-2">
      {[
        scheme.nav_bg_color,
        scheme.nav_button_color,
        scheme.ch_actions_bg,
        scheme.cards_bg,
        scheme.ll_graph_positive,
        scheme.ll_graph_negative,
        scheme.award_bg,
        scheme.ll_entry_contributor_button,
      ].map((color, i) => (
        <div
          key={i}
          className="w-8 h-8 rounded border border-border"
          style={{ backgroundColor: color }}
          title={color}
        />
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <AdminLayout>
        <div>Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Color Schemes</h1>
            <p className="text-muted-foreground">
              Manage unified 20-color schemes for your site and collections
            </p>
          </div>
          <Button onClick={() => navigate("/admin/color-schemes/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Scheme
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {colorSchemes?.map((scheme) => (
            <Card key={scheme.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {scheme.name}
                      {scheme.is_default && (
                        <Star className="h-4 w-4 fill-primary text-primary" />
                      )}
                    </CardTitle>
                    <CardDescription>{scheme.description || "No description"}</CardDescription>
                  </div>
                </div>
                <ColorPreview scheme={scheme} />
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/admin/color-schemes/${scheme.id}`)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => duplicateMutation.mutate(scheme)}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate
                  </Button>
                  {!scheme.is_default && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDefaultMutation.mutate(scheme.id)}
                    >
                      <Star className="mr-2 h-4 w-4" />
                      Set Default
                    </Button>
                  )}
                  {!scheme.is_default && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteId(scheme.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Color Scheme?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Collections using this scheme will fall back to the
              default scheme.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
