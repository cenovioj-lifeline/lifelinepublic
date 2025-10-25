import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";

type ThemeColorField = {
  name: string;
  label: string;
  placeholder?: string;
  defaultColor?: string;
  description?: string;
};

type ThemeSection = {
  title: string;
  description: string;
  fields: ThemeColorField[];
};

interface CollectionThemeEditorProps {
  form: UseFormReturn<any>;
}

export function CollectionThemeEditor({ form }: CollectionThemeEditorProps) {
  const themeSections: ThemeSection[] = [
    {
      title: "Navigation Bar",
      description: "Header navigation menu colors",
      fields: [
        { name: "web_primary", label: "Background", placeholder: "#333333", defaultColor: "#333333", description: "Nav bar background" },
        { name: "web_secondary", label: "Title Text", placeholder: "#ffffff", defaultColor: "#ffffff", description: "Collection title color" },
        { name: "menu_text_color", label: "Menu Text", placeholder: "#ffffff", defaultColor: "#ffffff", description: "Menu item text" },
        { name: "nav_button_color", label: "Button/Icon Color", placeholder: "#ffffff", defaultColor: "#ffffff", description: "Menu buttons and icons" },
        { name: "menu_hover_color", label: "Hover Background", placeholder: "rgba(255,255,255,0.1)", defaultColor: "#ffffff", description: "Menu item hover state" },
        { name: "menu_active_color", label: "Active Background", placeholder: "rgba(255,255,255,0.2)", defaultColor: "#ffffff", description: "Active menu item" },
      ],
    },
    {
      title: "Page Colors",
      description: "Global page styling",
      fields: [
        { name: "collection_bg_color", label: "Page Background", placeholder: "#ffffff", defaultColor: "#ffffff" },
        { name: "collection_text_color", label: "Primary Text", placeholder: "#000000", defaultColor: "#000000" },
        { name: "collection_heading_color", label: "Heading Text", placeholder: "#000000", defaultColor: "#000000" },
        { name: "collection_muted_text", label: "Muted/Secondary Text", placeholder: "#6b7280", defaultColor: "#6b7280" },
        { name: "collection_accent_color", label: "Accent/Button Color", placeholder: "#16a34a", defaultColor: "#16a34a" },
        { name: "link_color", label: "Link Color", placeholder: "#2563eb", defaultColor: "#2563eb" },
        { name: "link_hover_color", label: "Link Hover Color", placeholder: "#1d4ed8", defaultColor: "#1d4ed8" },
        { name: "default_color", label: "Default/Fallback Color", placeholder: "#565D6D", defaultColor: "#565D6D", description: "For undefined elements" },
      ],
    },
    {
      title: "Home Page Banner",
      description: "Collection home page hero banner",
      fields: [
        { name: "banner_text_color", label: "Banner Text Overlay", placeholder: "#ffffff", defaultColor: "#ffffff", description: "Text over banner image" },
      ],
    },
    {
      title: "Home Action Cards",
      description: "Featured sections on home page",
      fields: [
        { name: "actions_bg_color", label: "Card Background", placeholder: "#f9fafb", defaultColor: "#f9fafb" },
        { name: "actions_border_color", label: "Card Border", placeholder: "#e5e7eb", defaultColor: "#e5e7eb" },
        { name: "actions_icon_color", label: "Icon Color", placeholder: "#16a34a", defaultColor: "#16a34a" },
        { name: "actions_text_color", label: "Text Color", placeholder: "#000000", defaultColor: "#000000" },
      ],
    },
    {
      title: "Cards & Lists",
      description: "General card styling throughout collection",
      fields: [
        { name: "collection_card_bg", label: "Card Background", placeholder: "#ffffff", defaultColor: "#ffffff" },
        { name: "collection_border_color", label: "Card Border", placeholder: "#e5e7eb", defaultColor: "#e5e7eb" },
        { name: "card_text_color", label: "Card Text", placeholder: "#000000", defaultColor: "#000000" },
        { name: "collection_badge_color", label: "Badge/Tag Color", placeholder: "#f3f4f6", defaultColor: "#f3f4f6" },
      ],
    },
    {
      title: "Lifeline Graph Colors",
      description: "Timeline bars and score visualization",
      fields: [
        { name: "primary_color", label: "Positive Score Color", placeholder: "#16a34a", defaultColor: "#16a34a", description: "Green bars for positive events" },
        { name: "secondary_color", label: "Negative Score Color", placeholder: "#dc2626", defaultColor: "#dc2626", description: "Red bars for negative events" },
        { name: "graph_line_color", label: "Graph Line/UI Elements", placeholder: "#565D6D", defaultColor: "#565D6D", description: "Centerline and scrollbar" },
        { name: "graph_highlight_color", label: "Selection Highlight", placeholder: "#F3F4F6", defaultColor: "#F3F4F6", description: "Selected entry highlight" },
        { name: "graph_bg_color", label: "Graph Background", placeholder: "#ffffff", defaultColor: "#ffffff" },
      ],
    },
    {
      title: "Lifeline Display",
      description: "Main lifeline viewer container",
      fields: [
        { name: "lifeline_display_bg", label: "Display Background", placeholder: "#f9fafb", defaultColor: "#f9fafb" },
        { name: "lifeline_display_border", label: "Display Border", placeholder: "#e5e7eb", defaultColor: "#e5e7eb" },
        { name: "lifeline_display_title_text", label: "Title Text Color", placeholder: "#000000", defaultColor: "#000000" },
      ],
    },
    {
      title: "Lifeline Entry Details",
      description: "Individual entry detail panel",
      fields: [
        { name: "entry_header_bg", label: "Header Background", placeholder: "#f9fafb", defaultColor: "#f9fafb" },
        { name: "entry_header_text", label: "Header Text", placeholder: "#000000", defaultColor: "#000000" },
        { name: "entry_button_color", label: "Navigation Button", placeholder: "#000000", defaultColor: "#000000", description: "Previous/Next buttons" },
        { name: "entry_title_text", label: "Entry Title Text", placeholder: "#000000", defaultColor: "#000000" },
        { name: "entry_contributor_button", label: "Contributor Button", placeholder: "#16a34a", defaultColor: "#16a34a", description: "Contribute new event button" },
        { name: "entry_bg_color", label: "Entry Background", placeholder: "#ffffff", defaultColor: "#ffffff" },
      ],
    },
    {
      title: "Awards/Elections",
      description: "Election and award pages",
      fields: [
        { name: "award_heading_text", label: "Heading Text", placeholder: "#000000", defaultColor: "#000000" },
        { name: "award_heading_icon", label: "Heading Icon", placeholder: "#16a34a", defaultColor: "#16a34a" },
        { name: "award_heading_tag", label: "Heading Tag/Badge", placeholder: "#f3f4f6", defaultColor: "#f3f4f6" },
        { name: "award_icon_color", label: "Award Icon/Avatar", placeholder: "#6b7280", defaultColor: "#6b7280" },
        { name: "award_title_text", label: "Award Title Text", placeholder: "#000000", defaultColor: "#000000" },
        { name: "award_bg_color", label: "Award Item Background", placeholder: "#ffffff", defaultColor: "#ffffff" },
        { name: "award_border_color", label: "Award Item Border", placeholder: "#e5e7eb", defaultColor: "#e5e7eb" },
      ],
    },
    {
      title: "Profile Pages",
      description: "Profile viewing pages",
      fields: [
        { name: "profile_header_bg", label: "Header Background", placeholder: "#f9fafb", defaultColor: "#f9fafb" },
        { name: "profile_header_text", label: "Header Text", placeholder: "#000000", defaultColor: "#000000" },
        { name: "profile_card_bg", label: "Profile Card Background", placeholder: "#ffffff", defaultColor: "#ffffff" },
        { name: "profile_card_border", label: "Profile Card Border", placeholder: "#e5e7eb", defaultColor: "#e5e7eb" },
      ],
    },
  ];

  const renderColorField = (field: ThemeColorField) => (
    <FormField
      key={field.name}
      control={form.control}
      name={field.name}
      render={({ field: fieldData }) => (
        <FormItem>
          <FormLabel className="text-sm">
            {field.label}
            {field.description && (
              <span className="text-xs text-muted-foreground ml-2">({field.description})</span>
            )}
          </FormLabel>
          <div className="flex gap-2">
            <FormControl>
              <Input
                {...fieldData}
                type="text"
                placeholder={field.placeholder}
                pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})|rgba?.*$"
                className="flex-1 font-mono text-sm"
              />
            </FormControl>
            <Input
              type="color"
              value={fieldData.value || field.defaultColor || "#000000"}
              onChange={(e) => fieldData.onChange(e.target.value)}
              className="w-16 h-10 cursor-pointer"
            />
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Theme Colors</h2>
          <p className="text-sm text-muted-foreground">
            Customize the appearance of your collection. Colors are organized by page section for easy theming.
          </p>
        </div>

        <Accordion type="multiple" className="w-full" defaultValue={["nav"]}>
          {themeSections.map((section, index) => (
            <AccordionItem key={section.title} value={section.title.toLowerCase().replace(/\s+/g, '-')}>
              <AccordionTrigger className="text-left">
                <div>
                  <div className="font-semibold">{section.title}</div>
                  <div className="text-xs text-muted-foreground">{section.description}</div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-4 md:grid-cols-2 pt-4">
                  {section.fields.map(renderColorField)}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Card>
  );
}
