import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

// Type for the full color scheme (all 20 fields)
export type ColorScheme = {
  // Navigation (3)
  nav_bg_color: string;
  nav_text_color: string;
  nav_button_color: string;

  // Lifeline Display (7)
  ll_display_bg: string;
  ll_display_title_text: string;
  ll_entry_title_text: string;
  ll_entry_contributor_button: string;
  ll_graph_bg: string;
  ll_graph_positive: string;
  ll_graph_negative: string;

  // Cards (4)
  cards_bg: string;
  cards_border: string;
  cards_text: string;
  ch_actions_bg: string;

  // Character Actions (4)
  ch_actions_border: string;
  ch_actions_icon: string;
  ch_actions_text: string;
  ch_banner_text: string;

  // Awards (2)
  award_bg: string;
  award_border: string;

  // Global Text (1)
  title_text: string;
};

type ColorSchemeEditorFullProps = {
  initialColors?: Partial<ColorScheme>;
  onChange: (colors: ColorScheme) => void;
};

// Default color scheme values
const DEFAULT_COLORS: ColorScheme = {
  nav_bg_color: "#352e28",
  nav_text_color: "#ffffff",
  nav_button_color: "#c05831",

  ll_display_bg: "#f4e7d7",
  ll_display_title_text: "#352e28",
  ll_entry_title_text: "#352e28",
  ll_entry_contributor_button: "#342d28",
  ll_graph_bg: "#ffffff",
  ll_graph_positive: "#566950",
  ll_graph_negative: "#982534",

  cards_bg: "#f4e7d7",
  cards_border: "#342d28",
  cards_text: "#352d28",
  ch_actions_bg: "#f4e7d7",

  ch_actions_border: "#342d28",
  ch_actions_icon: "#352d28",
  ch_actions_text: "#342d28",
  ch_banner_text: "#ffffff",

  award_bg: "#dc8418",
  award_border: "#342d28",

  title_text: "#352d28",
};

// Helper to extract only color fields from an object
const extractColorFields = (obj: Record<string, unknown>): Partial<ColorScheme> => {
  const colorKeys = Object.keys(DEFAULT_COLORS) as (keyof ColorScheme)[];
  const result: Partial<ColorScheme> = {};
  for (const key of colorKeys) {
    if (key in obj && typeof obj[key] === 'string') {
      result[key] = obj[key] as string;
    }
  }
  return result;
};

export function ColorSchemeEditorFull({ initialColors, onChange }: ColorSchemeEditorFullProps) {
  const [colors, setColors] = useState<ColorScheme>(() => {
    const colorFieldsOnly = initialColors ? extractColorFields(initialColors as Record<string, unknown>) : {};
    return { ...DEFAULT_COLORS, ...colorFieldsOnly };
  });

  useEffect(() => {
    if (initialColors) {
      // Only extract actual color fields, ignore name/description/id/etc
      const colorFieldsOnly = extractColorFields(initialColors as Record<string, unknown>);
      const newColors = { ...DEFAULT_COLORS, ...colorFieldsOnly };
      setColors(newColors);
      onChange(newColors);
    }
  }, [initialColors, onChange]);

  const handleColorChange = (field: keyof ColorScheme, value: string) => {
    const newColors = { ...colors, [field]: value };
    setColors(newColors);
    onChange(newColors);
  };

  const ColorInput = ({ label, field, description }: { label: string; field: keyof ColorScheme; description?: string }) => (
    <div className="space-y-2">
      <Label htmlFor={field} className="text-sm font-medium">
        {label}
      </Label>
      <div className="flex gap-2 items-center">
        <Input
          id={field}
          type="color"
          value={colors[field]}
          onChange={(e) => handleColorChange(field, e.target.value)}
          className="w-16 h-10 p-1 cursor-pointer"
        />
        <Input
          type="text"
          value={colors[field]}
          onChange={(e) => handleColorChange(field, e.target.value)}
          className="font-mono text-sm"
          placeholder="#000000"
        />
      </div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column: Color Fields */}
      <div className="space-y-6">
        {/* Navigation Colors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">📍</span>
              Navigation
            </CardTitle>
            <CardDescription>Colors for the navigation bar and menu</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ColorInput
              label="Navigation Background"
              field="nav_bg_color"
              description="Main navigation bar background"
            />
            <ColorInput
              label="Navigation Text"
              field="nav_text_color"
              description="Text color in navigation"
            />
            <ColorInput
              label="Navigation Buttons"
              field="nav_button_color"
              description="Active/highlighted buttons in nav"
            />
          </CardContent>
        </Card>

        {/* Cards & Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">🎨</span>
              Cards & Content
            </CardTitle>
            <CardDescription>Colors for content cards and action buttons</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ColorInput
              label="Card Background"
              field="cards_bg"
              description="Main content card backgrounds"
            />
            <ColorInput
              label="Card Border"
              field="cards_border"
              description="Borders around cards"
            />
            <ColorInput
              label="Card Text"
              field="cards_text"
              description="Text within cards"
            />
            <Separator className="my-4" />
            <ColorInput
              label="Action Buttons Background"
              field="ch_actions_bg"
              description="Character action button backgrounds"
            />
            <ColorInput
              label="Action Buttons Border"
              field="ch_actions_border"
              description="Borders for action buttons"
            />
            <ColorInput
              label="Action Buttons Icon"
              field="ch_actions_icon"
              description="Icon color in action buttons"
            />
            <ColorInput
              label="Action Buttons Text"
              field="ch_actions_text"
              description="Text in action buttons"
            />
          </CardContent>
        </Card>

        {/* Lifeline Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">📊</span>
              Lifeline Timeline
            </CardTitle>
            <CardDescription>Colors for the timeline display and graphs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ColorInput
              label="Timeline Background"
              field="ll_display_bg"
              description="Background for lifeline timeline"
            />
            <ColorInput
              label="Timeline Title Text"
              field="ll_display_title_text"
              description="Main lifeline title text"
            />
            <ColorInput
              label="Entry Title Text"
              field="ll_entry_title_text"
              description="Individual entry titles"
            />
            <ColorInput
              label="Contributor Button"
              field="ll_entry_contributor_button"
              description="Add contributor button color"
            />
            <Separator className="my-4" />
            <ColorInput
              label="Graph Background"
              field="ll_graph_bg"
              description="Background for impact graphs"
            />
            <ColorInput
              label="Graph Positive"
              field="ll_graph_positive"
              description="Positive impact bar color"
            />
            <ColorInput
              label="Graph Negative"
              field="ll_graph_negative"
              description="Negative impact bar color"
            />
          </CardContent>
        </Card>

        {/* Awards & Typography */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">🏆</span>
              Awards & Text
            </CardTitle>
            <CardDescription>Colors for awards and special text elements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ColorInput
              label="Award Background"
              field="award_bg"
              description="Background for award cards"
            />
            <ColorInput
              label="Award Border"
              field="award_border"
              description="Border around award cards"
            />
            <Separator className="my-4" />
            <ColorInput
              label="Page Title Text"
              field="title_text"
              description="Main page title color"
            />
            <ColorInput
              label="Banner Text"
              field="ch_banner_text"
              description="Banner/header text color"
            />
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Live Preview */}
      <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">👁️</span>
              Live Preview
            </CardTitle>
            <CardDescription>See your colors in action</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Navigation Preview */}
            <div>
              <p className="text-sm font-medium mb-2">Navigation Bar</p>
              <div
                style={{
                  backgroundColor: colors.nav_bg_color,
                  color: colors.nav_text_color,
                  padding: '12px 16px',
                  borderRadius: '8px'
                }}
              >
                <div className="flex gap-4 items-center">
                  <span className="font-bold">Logo</span>
                  <span>Home</span>
                  <button
                    style={{
                      backgroundColor: colors.nav_button_color,
                      color: colors.nav_text_color,
                      padding: '6px 12px',
                      borderRadius: '4px',
                      border: 'none',
                      fontSize: '14px'
                    }}
                  >
                    Collections
                  </button>
                  <span>Profiles</span>
                </div>
              </div>
            </div>

            {/* Card Preview */}
            <div>
              <p className="text-sm font-medium mb-2">Content Card</p>
              <div
                style={{
                  backgroundColor: colors.cards_bg,
                  border: `2px solid ${colors.cards_border}`,
                  color: colors.cards_text,
                  padding: '16px',
                  borderRadius: '8px'
                }}
              >
                <h3 className="font-bold mb-2" style={{ color: colors.title_text }}>
                  Card Title
                </h3>
                <p className="text-sm mb-3">
                  This is sample card content showing how text appears.
                </p>
                <div className="flex gap-2">
                  <button
                    style={{
                      backgroundColor: colors.ch_actions_bg,
                      border: `1px solid ${colors.ch_actions_border}`,
                      color: colors.ch_actions_text,
                      padding: '6px 12px',
                      borderRadius: '4px',
                      fontSize: '12px'
                    }}
                  >
                    🔗 Action
                  </button>
                </div>
              </div>
            </div>

            {/* Timeline Preview */}
            <div>
              <p className="text-sm font-medium mb-2">Lifeline Timeline</p>
              <div
                style={{
                  backgroundColor: colors.ll_display_bg,
                  padding: '16px',
                  borderRadius: '8px'
                }}
              >
                <h4
                  className="font-bold text-sm mb-3"
                  style={{ color: colors.ll_display_title_text }}
                >
                  Timeline Entry
                </h4>
                <div
                  className="mb-2"
                  style={{
                    backgroundColor: colors.ll_graph_bg,
                    padding: '8px',
                    borderRadius: '4px'
                  }}
                >
                  <div className="flex gap-1 items-center mb-1">
                    <div
                      style={{
                        backgroundColor: colors.ll_graph_positive,
                        height: '8px',
                        width: '60%',
                        borderRadius: '2px'
                      }}
                    />
                    <span className="text-xs">+60</span>
                  </div>
                  <div className="flex gap-1 items-center">
                    <div
                      style={{
                        backgroundColor: colors.ll_graph_negative,
                        height: '8px',
                        width: '40%',
                        borderRadius: '2px'
                      }}
                    />
                    <span className="text-xs">-40</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Award Preview */}
            <div>
              <p className="text-sm font-medium mb-2">Award Card</p>
              <div
                style={{
                  backgroundColor: colors.award_bg,
                  border: `2px solid ${colors.award_border}`,
                  padding: '16px',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}
              >
                <div className="text-2xl mb-2">🏆</div>
                <p className="font-bold text-sm">Best Character Development</p>
                <p className="text-xs opacity-80">Winner: Character Name</p>
              </div>
            </div>

            {/* Elections/Awards Page Preview (Tailwind Bridge) */}
            <div>
              <p className="text-sm font-medium mb-2">Elections/Awards Page</p>
              <p className="text-xs text-muted-foreground mb-2">
                Uses Tailwind utilities (bg-background, border-border, etc.)
              </p>
              <div
                style={{
                  backgroundColor: colors.cards_bg, // --background
                  border: `1px solid ${colors.cards_border}`, // --border
                  color: colors.cards_text, // --foreground
                  padding: '12px',
                  borderRadius: '8px'
                }}
              >
                <h4 className="font-bold text-sm mb-2" style={{ color: colors.cards_text }}>
                  Sterling Cooper Yearbook 1965
                </h4>
                <div className="flex gap-2 mb-2">
                  <button
                    style={{
                      backgroundColor: colors.nav_button_color, // --primary
                      color: colors.nav_text_color, // --primary-foreground
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      border: 'none',
                      fontWeight: '500'
                    }}
                  >
                    Vote Now
                  </button>
                  <button
                    style={{
                      backgroundColor: colors.ll_graph_positive, // --secondary
                      color: colors.cards_text, // --secondary-foreground
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      border: 'none'
                    }}
                  >
                    Results
                  </button>
                </div>
                <div
                  style={{
                    backgroundColor: colors.ll_graph_bg, // --muted
                    padding: '8px',
                    borderRadius: '4px',
                    fontSize: '11px'
                  }}
                >
                  <p className="text-xs">Voting ends in 5 days</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
