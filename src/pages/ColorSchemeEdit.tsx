import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/AdminLayout";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ColorSchemeEditorFull, ColorScheme } from "@/components/admin/ColorSchemeEditorFull";

export default function ColorSchemeEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isNew = id === "new";

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [colors, setColors] = useState<ColorScheme | null>(null);

  const { data: colorScheme, isLoading } = useQuery({
    queryKey: ["color-scheme", id],
    queryFn: async () => {
      if (isNew) return null;
      const { data, error } = await supabase
        .from("color_schemes")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !isNew,
  });

  useEffect(() => {
    if (colorScheme) {
      setName(colorScheme.name || "");
      setDescription(colorScheme.description || "");
    }
  }, [colorScheme]);

  const handleColorSchemeChange = useCallback((newColors: ColorScheme) => {
    setColors(newColors);
  }, []);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!colors) {
        throw new Error("Please configure colors before saving");
      }

      const data = {
        name,
        description,
        ...colors,
      };

      if (isNew) {
        const { error } = await supabase.from("color_schemes").insert(data);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("color_schemes")
          .update(data)
          .eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["color-schemes"] });
      toast({
        title: "Success",
        description: `Color scheme ${isNew ? "created" : "updated"} successfully`,
      });
      navigate("/admin/color-schemes");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a name for the color scheme",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/color-schemes")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isNew ? "New Color Scheme" : "Edit Color Scheme"}
            </h1>
            <p className="text-muted-foreground">
              Configure all color values with live preview
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Name and describe this color scheme</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Color Scheme"
                className="mt-1.5"
              />
            </div>

            <div>
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this color scheme..."
                rows={3}
                className="mt-1.5"
              />
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">Loading color scheme...</div>
            </CardContent>
          </Card>
        ) : (
          <ColorSchemeEditorFull
            initialColors={colorScheme || undefined}
            onChange={handleColorSchemeChange}
          />
        )}

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saveMutation.isPending || !colors}>
            {saveMutation.isPending ? "Saving..." : isNew ? "Create Scheme" : "Update Scheme"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/admin/color-schemes")}
          >
            Cancel
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}

