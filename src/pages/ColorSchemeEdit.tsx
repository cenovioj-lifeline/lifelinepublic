import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/AdminLayout";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ArrowLeft, Eye } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { COLOR_MAPPINGS } from "@/hooks/useColorScheme";

type ColorSchemeForm = {
  name: string;
  description: string;
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
};

export default function ColorSchemeEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isNew = id === "new";

  const form = useForm<ColorSchemeForm>({
    defaultValues: {
      name: "",
      description: "",
      nav_bg_color: "#1a1a1a",
      nav_text_color: "#ffffff",
      nav_button_color: "#FF6B35",
      ll_display_bg: "#F5E6D3",
      ll_graph_positive: "#22C55E",
      ll_graph_negative: "#EF4444",
      ll_entry_title_text: "#1a1a1a",
      ll_entry_contributor_button: "#8B5CF6",
      ll_graph_bg: "#FFFFFF",
      ch_banner_text: "#FFFFFF",
      ch_actions_bg: "#F5E6D3",
      ch_actions_border: "#E0D4C0",
      ch_actions_icon: "#1a1a1a",
      ch_actions_text: "#1a1a1a",
      cards_bg: "#FFFFFF",
      cards_border: "#E0E0E0",
      cards_text: "#1a1a1a",
      title_text: "#1a1a1a",
      award_bg: "#F5E6D3",
      award_border: "#E0D4C0",
    },
  });

  const { data: colorScheme } = useQuery({
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
      form.reset(colorScheme);
    }
  }, [colorScheme, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: ColorSchemeForm) => {
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

  const onSubmit = (data: ColorSchemeForm) => {
    saveMutation.mutate(data);
  };

  const renderColorField = (fieldKey: keyof typeof COLOR_MAPPINGS) => {
    const config = COLOR_MAPPINGS[fieldKey];
    return (
      <FormField
        key={fieldKey}
        control={form.control}
        name={fieldKey}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{config.label}</FormLabel>
            <div className="flex gap-2">
              <FormControl>
                <Input
                  {...field}
                  placeholder="#000000"
                  className="font-mono"
                />
              </FormControl>
              <Input
                type="color"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                className="w-16 h-10 cursor-pointer"
              />
            </div>
            <FormDescription className="text-xs">
              Used in: {config.uses.join(", ")}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    );
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
              Define 20 semantic colors that will be reused intelligently across your site
            </p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Name and describe this color scheme</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="My Color Scheme" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe this color scheme..."
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Color Definitions (20 Colors)</CardTitle>
                <CardDescription>
                  Each color has a semantic label and shows where it's used. Undefined elements
                  will inherit from these colors based on context.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  <AccordionItem value="navigation">
                    <AccordionTrigger>Navigation Colors (3)</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      {renderColorField("nav_bg_color")}
                      {renderColorField("nav_text_color")}
                      {renderColorField("nav_button_color")}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="lifeline-display">
                    <AccordionTrigger>Lifeline Display Colors (6)</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      {renderColorField("ll_display_bg")}
                      {renderColorField("ll_graph_positive")}
                      {renderColorField("ll_graph_negative")}
                      {renderColorField("ll_entry_title_text")}
                      {renderColorField("ll_entry_contributor_button")}
                      {renderColorField("ll_graph_bg")}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="collection-home">
                    <AccordionTrigger>Collection Home Colors (5)</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      {renderColorField("ch_banner_text")}
                      {renderColorField("ch_actions_bg")}
                      {renderColorField("ch_actions_border")}
                      {renderColorField("ch_actions_icon")}
                      {renderColorField("ch_actions_text")}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="cards">
                    <AccordionTrigger>Cards Colors (3)</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      {renderColorField("cards_bg")}
                      {renderColorField("cards_border")}
                      {renderColorField("cards_text")}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="awards">
                    <AccordionTrigger>Award/Title Colors (3)</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      {renderColorField("title_text")}
                      {renderColorField("award_bg")}
                      {renderColorField("award_border")}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button type="submit" disabled={saveMutation.isPending}>
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
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}
