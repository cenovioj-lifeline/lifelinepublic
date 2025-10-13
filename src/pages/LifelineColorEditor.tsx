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
import { ArrowLeft, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";

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
  { key: "lifeline_bg_color", label: "Background Color", description: "Main page background color" },
  { key: "lifeline_text_color", label: "Text Color", description: "Primary text color throughout site" },
  { key: "lifeline_heading_color", label: "Heading Color", description: "Color for headings and titles" },
  { key: "lifeline_accent_color", label: "Primary/Button Color", description: "Primary buttons (Collections, Profiles, Elections), links, and accent elements" },
  { key: "lifeline_card_bg", label: "Card Background", description: "Background color for cards and content boxes" },
  { key: "lifeline_border_color", label: "Border Color", description: "Borders, dividers, and input outlines" },
  { key: "lifeline_timeline_positive", label: "Secondary/Badge Color", description: "Secondary buttons, badges (Real Person, Fictional), positive events" },
  { key: "lifeline_timeline_negative", label: "Negative/Destructive Color", description: "Error states, delete buttons, negative events" },
  { key: "lifeline_timeline_neutral", label: "Neutral/Muted Color", description: "Neutral events, muted text, disabled states" },
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

  const [savingField, setSavingField] = useState<string | null>(null);

  // Update form when settings load
  useEffect(() => {
    if (settings && !isLoading) {
      Object.keys(settings).forEach((key) => {
        if (settings[key]) {
          form.setValue(key as keyof ColorSettings, settings[key], { shouldDirty: false });
        }
      });
    }
  }, [settings, isLoading, form]);

  const saveFieldMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from("lifeline_settings")
        .update({ setting_value: value })
        .eq("setting_key", key);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lifeline-settings"] });
      queryClient.invalidateQueries({ queryKey: ["global-color-settings"] });
      setSavingField(null);
      toast({
        title: "Success",
        description: `${colorFields.find(f => f.key === variables.key)?.label} updated. Refresh to see changes.`,
      });
    },
    onError: (error: Error) => {
      setSavingField(null);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSaveField = (key: string, value: string) => {
    setSavingField(key);
    saveFieldMutation.mutate({ key, value });
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
          <h1 className="text-3xl font-bold tracking-tight">Global Site Colors</h1>
          <p className="text-muted-foreground">
            Customize the global color scheme used across all pages (except collection-specific pages)
          </p>
        </div>
      </div>

      <Form {...form}>
        <form className="space-y-6">
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
                        <Button
                          type="button"
                          size="icon"
                          onClick={() => handleSaveField(field.key, formField.value)}
                          disabled={savingField === field.key}
                        >
                          {savingField === field.key ? "..." : <Check className="h-4 w-4" />}
                        </Button>
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
            <Button type="button" variant="outline" onClick={() => navigate("/settings")}>
              Back to Settings
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
