import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, ChevronRight, Wand2, AlertTriangle, Check, RefreshCw } from "lucide-react";
import { type ColorScheme } from "./ColorSchemeEditorFull";
import { type BasePalette, generateShades, checkContrast, type ShadeScale } from "@/lib/color-utils";
import { derivePalette, validateContrast, reverseEngineerPalette, type FullColorScheme, type ContrastIssue } from "@/lib/color-derivation";

interface SmartPaletteEditorProps {
  colors: ColorScheme;
  onChange: (colors: ColorScheme) => void;
}

// The 4 required + 2 optional base color inputs
const BASE_COLOR_CONFIG = [
  { key: "primary" as const, label: "Primary", description: "Brand identity — nav bar, headings, borders", icon: "🎯" },
  { key: "accent" as const, label: "Accent", description: "Buttons, highlights, awards, CTAs", icon: "✨" },
  { key: "surface" as const, label: "Surface", description: "Card and content area backgrounds", icon: "📄" },
  { key: "text" as const, label: "Text", description: "Primary readable body text color", icon: "📝" },
  { key: "positive" as const, label: "Positive (optional)", description: "Success/positive graph bars — auto-generated if blank", icon: "📈" },
  { key: "negative" as const, label: "Negative (optional)", description: "Error/negative graph bars — auto-generated if blank", icon: "📉" },
];

// Group the 30 fields for the override panel
const FIELD_GROUPS = [
  { label: "Navigation", fields: ["nav_bg_color", "nav_text_color", "nav_button_color"] },
  { label: "Lifeline Display", fields: ["ll_display_bg", "ll_display_title_text", "ll_entry_title_text", "ll_entry_contributor_button", "ll_graph_bg", "ll_graph_positive", "ll_graph_negative"] },
  { label: "Cards & Actions", fields: ["cards_bg", "cards_border", "cards_text", "ch_actions_bg", "ch_actions_border", "ch_actions_icon", "ch_actions_text", "ch_banner_text"] },
  { label: "Awards", fields: ["award_bg", "award_border", "award_category_bg", "award_item_bg", "award_text"] },
  { label: "Page & Profile", fields: ["title_text", "page_bg", "profile_text", "profile_label_text", "filter_controls_text"] },
  { label: "Contrast Text", fields: ["light_text_color", "dark_text_color"] },
  { label: "Person Name", fields: ["person_name_accent"] },
];

// Human-readable field labels
const FIELD_LABELS: Record<string, string> = {
  nav_bg_color: "Nav Background", nav_text_color: "Nav Text", nav_button_color: "Nav Button",
  ll_display_bg: "Timeline Background", ll_display_title_text: "Timeline Title", ll_entry_title_text: "Entry Title",
  ll_entry_contributor_button: "Contributor Button", ll_graph_bg: "Graph Background",
  ll_graph_positive: "Graph Positive", ll_graph_negative: "Graph Negative",
  cards_bg: "Card Background", cards_border: "Card Border", cards_text: "Card Text",
  ch_actions_bg: "Actions Background", ch_actions_border: "Actions Border",
  ch_actions_icon: "Actions Icon", ch_actions_text: "Actions Text", ch_banner_text: "Banner Text",
  award_bg: "Award Header", award_border: "Award Border", award_category_bg: "Category Header",
  award_item_bg: "Award Item", award_text: "Award Text",
  title_text: "Page Title", page_bg: "Page Background", profile_text: "Profile Headings",
  profile_label_text: "Profile Labels", filter_controls_text: "Filter Controls",
  light_text_color: "Light Text", dark_text_color: "Dark Text", person_name_accent: "Person Name Accent",
};

function ShadeSwatches({ shades }: { shades: ShadeScale }) {
  return (
    <div className="flex gap-1 mt-2">
      {(["darkest", "dark", "base", "light", "lightest"] as const).map((shade) => (
        <div
          key={shade}
          className="flex-1 h-8 rounded-md border border-gray-200"
          style={{ backgroundColor: shades[shade] }}
          title={`${shade}: ${shades[shade]}`}
        />
      ))}
    </div>
  );
}

function ContrastBadge({ fg, bg }: { fg: string; bg: string }) {
  const result = checkContrast(fg, bg);
  if (result.level === "fail") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-mono px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">
        <AlertTriangle className="h-3 w-3" /> {result.ratio}:1
      </span>
    );
  }
  if (result.level === "AA-large") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-mono px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 border border-yellow-200">
        {result.ratio}:1
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-mono px-1.5 py-0.5 rounded bg-green-100 text-green-700 border border-green-200">
      <Check className="h-3 w-3" /> {result.ratio}:1
    </span>
  );
}

export function SmartPaletteEditor({ colors, onChange }: SmartPaletteEditorProps) {
  // Extract base palette from current colors (for editing existing schemes)
  const initialBase = useMemo(() => reverseEngineerPalette(colors as unknown as FullColorScheme), []);

  const [basePalette, setBasePalette] = useState<BasePalette>(initialBase);
  const [overridesOpen, setOverridesOpen] = useState(false);
  const [overrides, setOverrides] = useState<Partial<ColorScheme>>({});
  const [hasGenerated, setHasGenerated] = useState(false);

  // Generate shade scales for display
  const shades = useMemo(() => ({
    primary: generateShades(basePalette.primary),
    accent: generateShades(basePalette.accent),
    surface: generateShades(basePalette.surface),
    text: generateShades(basePalette.text),
  }), [basePalette.primary, basePalette.accent, basePalette.surface, basePalette.text]);

  // Contrast issues in current scheme
  const contrastIssues = useMemo(
    () => validateContrast(colors as unknown as FullColorScheme),
    [colors]
  );

  const handleBaseChange = (key: keyof BasePalette, value: string) => {
    setBasePalette((prev) => ({ ...prev, [key]: value }));
  };

  const handleGenerate = () => {
    const derived = derivePalette(basePalette);
    // Apply overrides on top of derived values
    const merged = { ...derived, ...overrides } as unknown as ColorScheme;
    onChange(merged);
    setHasGenerated(true);
  };

  const handleOverrideChange = (field: keyof ColorScheme, value: string) => {
    setOverrides((prev) => ({ ...prev, [field]: value }));
    onChange({ ...colors, [field]: value });
  };

  const handleResetField = (field: keyof ColorScheme) => {
    const derived = derivePalette(basePalette);
    const derivedValue = (derived as unknown as Record<string, string>)[field];
    if (derivedValue) {
      setOverrides((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
      onChange({ ...colors, [field]: derivedValue });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column: Base Colors + Overrides */}
      <div className="space-y-6">
        {/* Base Palette */}
        <Card className="border-2 border-indigo-200 bg-indigo-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-indigo-600" />
              Smart Palette
            </CardTitle>
            <CardDescription>
              Pick 4 base colors. The system generates all 30 scheme fields with proper contrast.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {BASE_COLOR_CONFIG.map((config) => (
              <div key={config.key}>
                <Label className="text-sm font-medium flex items-center gap-2">
                  <span>{config.icon}</span> {config.label}
                </Label>
                <div className="flex gap-2 items-center mt-1.5">
                  <Input
                    type="color"
                    value={basePalette[config.key] || "#888888"}
                    onChange={(e) => handleBaseChange(config.key, e.target.value)}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={basePalette[config.key] || ""}
                    onChange={(e) => handleBaseChange(config.key, e.target.value)}
                    className="font-mono text-sm"
                    placeholder={config.key === "positive" || config.key === "negative" ? "Auto" : "#000000"}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
                {/* Shade swatches for the 4 required colors */}
                {config.key in shades && (
                  <ShadeSwatches shades={shades[config.key as keyof typeof shades]} />
                )}
              </div>
            ))}

            <Button onClick={handleGenerate} className="w-full" size="lg">
              <Wand2 className="mr-2 h-4 w-4" />
              Generate Palette
            </Button>
          </CardContent>
        </Card>

        {/* Contrast Validation */}
        {hasGenerated && (
          <Card className={contrastIssues.length > 0 ? "border-2 border-red-200" : "border-2 border-green-200"}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {contrastIssues.length === 0 ? (
                  <><Check className="h-4 w-4 text-green-600" /> All Contrast Checks Passed</>
                ) : (
                  <><AlertTriangle className="h-4 w-4 text-red-600" /> {contrastIssues.length} Contrast Issue{contrastIssues.length > 1 ? "s" : ""}</>
                )}
              </CardTitle>
            </CardHeader>
            {contrastIssues.length > 0 && (
              <CardContent className="space-y-2">
                {contrastIssues.map((issue, i) => (
                  <div key={i} className="flex items-center justify-between text-sm py-1.5 px-3 bg-red-50 rounded-md">
                    <span className="text-red-700">
                      {FIELD_LABELS[issue.foregroundField]} on {FIELD_LABELS[issue.backgroundField]}
                    </span>
                    <span className="font-mono text-red-600 text-xs">{issue.ratio}:1</span>
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        )}

        {/* Override Individual Fields */}
        <Card>
          <CardHeader
            className="cursor-pointer select-none"
            onClick={() => setOverridesOpen(!overridesOpen)}
          >
            <CardTitle className="flex items-center gap-2 text-base">
              {overridesOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              Override Individual Fields ({Object.keys(overrides).length} overridden)
            </CardTitle>
            <CardDescription>Fine-tune any of the 30 derived values</CardDescription>
          </CardHeader>
          {overridesOpen && (
            <CardContent className="space-y-6">
              {FIELD_GROUPS.map((group) => (
                <div key={group.label}>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3">{group.label}</h4>
                  <div className="space-y-3">
                    {group.fields.map((field) => {
                      const fieldKey = field as keyof ColorScheme;
                      const isOverridden = fieldKey in overrides;
                      return (
                        <div key={field} className="flex items-center gap-2">
                          <Input
                            type="color"
                            value={colors[fieldKey] || "#000000"}
                            onChange={(e) => handleOverrideChange(fieldKey, e.target.value)}
                            className="w-10 h-8 p-0.5 cursor-pointer flex-shrink-0"
                          />
                          <Input
                            type="text"
                            value={colors[fieldKey] || ""}
                            onChange={(e) => handleOverrideChange(fieldKey, e.target.value)}
                            className={`font-mono text-xs flex-1 ${isOverridden ? "border-amber-300 bg-amber-50" : ""}`}
                          />
                          <span className="text-xs text-muted-foreground w-28 flex-shrink-0 truncate" title={FIELD_LABELS[field]}>
                            {FIELD_LABELS[field]}
                          </span>
                          {isOverridden && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 flex-shrink-0"
                              onClick={() => handleResetField(fieldKey)}
                              title="Reset to derived value"
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <Separator className="mt-4" />
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      </div>

      {/* Right Column: Live Preview */}
      <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
        {/* Full Page Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Live Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              style={{ backgroundColor: colors.page_bg, borderRadius: "8px", overflow: "hidden", border: "1px solid #ccc" }}
            >
              {/* Nav */}
              <div style={{ backgroundColor: colors.nav_bg_color, padding: "10px 16px" }}>
                <div className="flex gap-4 items-center">
                  <span style={{ color: colors.nav_text_color, fontWeight: 700, fontSize: "13px" }}>Lifeline</span>
                  <span style={{ color: colors.nav_text_color, fontSize: "11px", opacity: 0.8 }}>Browse</span>
                  <button style={{
                    backgroundColor: colors.nav_button_color, color: colors.light_text_color || "#fff",
                    padding: "4px 10px", borderRadius: "4px", border: "none", fontSize: "11px"
                  }}>Collections</button>
                  <ContrastBadge fg={colors.nav_text_color} bg={colors.nav_bg_color} />
                </div>
              </div>

              {/* Profile Banner */}
              <div style={{ backgroundColor: colors.nav_bg_color, padding: "20px", textAlign: "center" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: colors.nav_button_color, margin: "0 auto 8px" }} />
                <p style={{ color: colors.ch_banner_text, fontWeight: 700, fontSize: "15px" }}>Character Name</p>
                <p style={{ color: colors.ch_banner_text, fontSize: "11px", opacity: 0.8 }}>Protagonist</p>
              </div>

              {/* Content */}
              <div style={{ padding: "12px" }}>
                {/* Person Name Card */}
                <div style={{
                  backgroundColor: colors.cards_bg, borderRadius: "6px", padding: "12px", marginBottom: "8px",
                  border: `1px solid ${colors.cards_border}`
                }}>
                  <p style={{
                    color: colors.person_name_accent, fontSize: "9px", fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "2px"
                  }}>PERSON NAME</p>
                  <p style={{ color: colors.cards_text, fontSize: "13px", fontWeight: 600 }}>The Journey Begins</p>
                  <p style={{ color: colors.cards_text, fontSize: "10px", opacity: 0.7, marginTop: "4px" }}>
                    Card text on card background
                  </p>
                  <ContrastBadge fg={colors.cards_text} bg={colors.cards_bg} />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mb-3">
                  <button style={{
                    backgroundColor: colors.ch_actions_bg, border: `1px solid ${colors.ch_actions_border}`,
                    color: colors.ch_actions_text, padding: "4px 8px", borderRadius: "4px", fontSize: "10px"
                  }}>Action</button>
                </div>

                {/* Timeline Mini */}
                <div style={{
                  backgroundColor: colors.ll_display_bg, padding: "10px", borderRadius: "6px",
                  border: `1px solid ${colors.cards_border}`, marginBottom: "8px"
                }}>
                  <p style={{ color: colors.ll_entry_title_text, fontSize: "11px", fontWeight: 600, marginBottom: "4px" }}>Timeline Entry</p>
                  <div className="flex gap-1 mb-1">
                    <div style={{ backgroundColor: colors.ll_graph_positive, height: "6px", width: "60%", borderRadius: "2px" }} />
                  </div>
                  <div className="flex gap-1">
                    <div style={{ backgroundColor: colors.ll_graph_negative, height: "6px", width: "30%", borderRadius: "2px" }} />
                  </div>
                </div>

                {/* Award Mini */}
                <div style={{ borderRadius: "6px", overflow: "hidden", border: `1px solid ${colors.award_border}` }}>
                  <div style={{ backgroundColor: colors.award_bg, padding: "8px 12px", textAlign: "center" }}>
                    <p style={{ color: colors.title_text, fontWeight: 700, fontSize: "11px" }}>Awards</p>
                    <ContrastBadge fg={colors.title_text} bg={colors.award_bg} />
                  </div>
                  <div style={{ backgroundColor: colors.award_category_bg, padding: "6px 12px" }}>
                    <p style={{ color: colors.award_text, fontWeight: 600, fontSize: "10px" }}>CATEGORY</p>
                  </div>
                  <div style={{ backgroundColor: colors.award_item_bg, padding: "8px 12px" }}>
                    <p style={{ color: colors.award_text, fontSize: "11px", fontWeight: 500 }}>Best Character Arc</p>
                    <p style={{ color: colors.award_text, fontSize: "9px", opacity: 0.7 }}>Winner: Character Name</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile & Filters Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile & Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ backgroundColor: colors.page_bg, padding: "12px", borderRadius: "8px", border: "1px solid #ccc" }}>
              <p style={{ color: colors.profile_text, fontWeight: 700, fontSize: "13px", marginBottom: "8px" }}>
                Section Heading <ContrastBadge fg={colors.profile_text} bg={colors.page_bg} />
              </p>
              <div style={{
                backgroundColor: colors.cards_bg, padding: "10px", borderRadius: "6px",
                border: `1px solid ${colors.cards_border}`, marginBottom: "8px"
              }}>
                <p style={{ color: colors.profile_label_text, fontSize: "12px", fontWeight: 600 }}>Card Label Text</p>
                <p style={{ color: colors.profile_label_text, fontSize: "10px", opacity: 0.7 }}>Description inside card</p>
              </div>
              <div style={{
                backgroundColor: "#ffffff", border: `1px solid ${colors.cards_border}`,
                borderRadius: "6px", padding: "6px 10px", marginBottom: "6px"
              }}>
                <span style={{ color: colors.filter_controls_text, fontSize: "11px" }}>Search profiles...</span>
              </div>
              <div className="flex gap-2">
                <div style={{
                  backgroundColor: "#ffffff", border: `1px solid ${colors.cards_border}`,
                  borderRadius: "4px", padding: "4px 8px", fontSize: "10px", color: colors.filter_controls_text
                }}>All Types</div>
                <div style={{
                  backgroundColor: "#ffffff", border: `1px solid ${colors.cards_border}`,
                  borderRadius: "4px", padding: "4px 8px", fontSize: "10px", color: colors.filter_controls_text
                }}>Sort: A-Z</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
