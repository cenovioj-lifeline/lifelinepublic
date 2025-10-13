import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ColorSettings = {
  lifeline_bg_color: string;
  lifeline_text_color: string;
  lifeline_heading_color: string;
  lifeline_accent_color: string;
  lifeline_card_bg: string;
  lifeline_border_color: string;
  lifeline_timeline_positive: string;
  lifeline_timeline_negative: string;
  lifeline_timeline_neutral: string;
};

const colorFields = [
  { key: "lifeline_bg_color", label: "Background Color", description: "Background color for lifeline pages" },
  { key: "lifeline_text_color", label: "Text Color", description: "Primary text color" },
  { key: "lifeline_heading_color", label: "Heading Color", description: "Color for headings" },
  { key: "lifeline_accent_color", label: "Accent Color", description: "Used for links and highlights" },
  { key: "lifeline_card_bg", label: "Card Background", description: "Background color for cards" },
  { key: "lifeline_border_color", label: "Border Color", description: "Color for borders and dividers" },
  { key: "lifeline_timeline_positive", label: "Positive Event Color", description: "Color for positive timeline events" },
  { key: "lifeline_timeline_negative", label: "Negative Event Color", description: "Color for negative timeline events" },
  { key: "lifeline_timeline_neutral", label: "Neutral Event Color", description: "Color for neutral timeline events" },
];

export default function LifelineColorEditor() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ColorSettings>({
    defaultValues: {
      lifeline_bg_color: "#ffffff",
      lifeline_text_color: "#000000",
      lifeline_heading_color: "#1a1a1a",
      lifeline_accent_color: "#3b82f6",
      lifeline_card_bg: "#f9fafb",
      lifeline_border_color: "#e5e7eb",
      lifeline_timeline_positive: "#16a34a",
      lifeline_timeline_negative: "#dc2626",
      lifeline_timeline_neutral: "#6b7280",
    },
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ["lifeline-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lifeline_settings")
        .select("*")
        .in("setting_key", colorFields.map(f => f.key));
      if (error) throw error;
      
      const settingsMap: Record<string, string> = {};
      data?.forEach((s) => {
        settingsMap[s.setting_key] = s.setting_value || "";
      });
      return settingsMap;
    },
  });

  // Update form when settings load
  if (settings && !isLoading) {
    Object.keys(settings).forEach((key) => {
      if (settings[key]) {
        form.setValue(key as keyof ColorSettings, settings[key], { shouldDirty: false });
      }
    });
  }

  const saveMutation = useMutation({
    mutationFn: async (data: ColorSettings) => {
      const updates = Object.entries(data).map(([key, value]) => ({
        setting_key: key,
        setting_value: value,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("lifeline_settings")
          .update({ setting_value: update.setting_value })
          .eq("setting_key", update.setting_key);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lifeline-settings"] });
      toast({
        title: "Success",
        description: "Color settings updated successfully",
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

  const onSubmit = (data: ColorSettings) => {
    saveMutation.mutate(data);
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lifeline Color Editor</h1>
          <p className="text-muted-foreground">
            Customize colors used on public lifeline pages
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Color Settings</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              {colorFields.map((field) => (
                <FormField
                  key={field.key}
                  control={form.control}
                  name={field.key as keyof ColorSettings}
                  render={({ field: formField }) => (
                    <FormItem>
                      <FormLabel>{field.label}</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            {...formField}
                            type="text"
                            placeholder="#000000"
                            pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                            className="flex-1"
                          />
                        </FormControl>
                        <Input
                          type="color"
                          value={formField.value || "#000000"}
                          onChange={(e) => formField.onChange(e.target.value)}
                          className="w-16 h-10 cursor-pointer"
                        />
                      </div>
                      <FormDescription>{field.description}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate("/settings")}>
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
