import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/AdminLayout";
import { ArrowLeft, Check, Loader2, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ColorSchemeEditorFull,
  ColorScheme,
  DEFAULT_COLORS,
  extractColorFields,
} from "@/components/admin/ColorSchemeEditorFull";
import { SmartPaletteEditor } from "@/components/admin/SmartPaletteEditor";

export default function ColorSchemeEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isNew = id === "new";

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [colors, setColors] = useState<ColorScheme>(DEFAULT_COLORS);
  const [showSaveComplete, setShowSaveComplete] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [editorMode, setEditorMode] = useState<"smart" | "advanced">("smart");
  const [basePalette, setBasePalette] = useState<Record<string, string> | null>(null);

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
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
  });

  useEffect(() => {
    // Only initialize once when colorScheme first loads
    if (colorScheme && !hasInitialized) {
      setName(colorScheme.name || "");
      setDescription(colorScheme.description || "");
      setColors({
        ...DEFAULT_COLORS,
        ...extractColorFields(colorScheme as unknown as Record<string, unknown>),
      });
      // Load saved base palette if it exists
      if (colorScheme.base_palette) {
        setBasePalette(
          typeof colorScheme.base_palette === 'string'
            ? JSON.parse(colorScheme.base_palette)
            : colorScheme.base_palette
        );
      }
      setHasInitialized(true);
      return;
    }

    if (isNew && !hasInitialized) {
      setName("");
      setDescription("");
      setColors(DEFAULT_COLORS);
      setHasInitialized(true);
    }
  }, [colorScheme, isNew, hasInitialized]);

  const saveMutation = useMutation({
    mutationFn: async (vars: {
      name: string;
      description: string;
      colors: ColorScheme;
      basePalette?: Record<string, string> | null;
    }) => {
      const data: Record<string, unknown> = {
        name: vars.name,
        description: vars.description,
        ...vars.colors,
      };
      if (vars.basePalette) {
        data.base_palette = vars.basePalette;
      }

      if (isNew) {
        const { data: inserted, error } = await supabase
          .from("color_schemes")
          .insert(data as any)
          .select("*")
          .single();
        if (error) throw error;
        return { isNew: true as const, newId: inserted.id, updated: inserted };
      }

      const { data: updated, error } = await supabase
        .from("color_schemes")
        .update(data as any)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return { isNew: false as const, updated };
    },
    onSuccess: (result) => {
      // Update the cache for THIS specific color scheme so returning shows fresh data
      if (!result.isNew) {
        queryClient.setQueryData(["color-scheme", id], result.updated);
      }

      // Invalidate the list for the color schemes page
      queryClient.invalidateQueries({ queryKey: ["color-schemes"] });

      if (result.isNew && result.newId) {
        navigate(`/admin/color-schemes/${result.newId}`, { replace: true });
      }

      setShowSaveComplete(true);
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

    saveMutation.mutate({ name, description, colors, basePalette });
  };

  return (
    <AdminLayout>
      <div className="space-y-6 pb-24">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/color-schemes")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
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

        {/* Mode Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={editorMode === "smart" ? "default" : "outline-solid"}
            size="sm"
            onClick={() => setEditorMode("smart")}
          >
            Smart Palette
          </Button>
          <Button
            variant={editorMode === "advanced" ? "default" : "outline-solid"}
            size="sm"
            onClick={() => setEditorMode("advanced")}
          >
            Advanced (30 fields)
          </Button>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                Loading color scheme...
              </div>
            </CardContent>
          </Card>
        ) : editorMode === "smart" ? (
          <SmartPaletteEditor
            colors={colors}
            onChange={setColors}
            savedBasePalette={basePalette as any}
            onBasePaletteChange={setBasePalette as any}
          />
        ) : (
          <ColorSchemeEditorFull colors={colors} onChange={setColors} />
        )}
      </div>

      {/* Floating Save Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {/* Save Complete Message */}
        {showSaveComplete && (
          <div className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white shadow-lg">
            <Check className="h-4 w-4" />
            <span className="font-medium">Save complete</span>
            <button
              onClick={() => setShowSaveComplete(false)}
              className="ml-2 rounded p-0.5 hover:bg-green-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          size="lg"
          className="shadow-lg"
        >
          {saveMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Update"
          )}
        </Button>
      </div>
    </AdminLayout>
  );
}
