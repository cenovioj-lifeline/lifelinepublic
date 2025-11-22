import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { generateColorScheme, ColorInput, GeneratedColorScheme } from "@/lib/colorGeneration";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface SimpleColorSchemeEditorProps {
  initialColors?: Partial<ColorInput>;
  initialScheme?: any; // Full existing color scheme from database
  onChange?: (generatedScheme: GeneratedColorScheme, simpleMode: boolean, overrides: Record<string, string>) => void;
}

export function SimpleColorSchemeEditor({ initialColors, initialScheme, onChange }: SimpleColorSchemeEditorProps) {
  // Debug logging
  console.log('[SimpleColorSchemeEditor] Initializing with:', {
    initialScheme: initialScheme ? {
      nav_bg_color: initialScheme.nav_bg_color,
      nav_active_link_color: initialScheme.nav_active_link_color,
      nav_text_color: initialScheme.nav_text_color,
      collection_bg_color: initialScheme.collection_bg_color
    } : null,
    initialColors
  });

  const [simpleMode, setSimpleMode] = useState(true);

  // Initialize from existing scheme if provided, otherwise use defaults
  const [primaryColor, setPrimaryColor] = useState(
    initialScheme?.nav_bg_color || initialColors?.primary || "#D4B996"
  );
  const [secondaryColor, setSecondaryColor] = useState(
    initialScheme?.nav_active_link_color || initialColors?.secondary || "#C97456"
  );
  const [autoText, setAutoText] = useState(!initialColors?.text && !initialScheme?.nav_text_color);
  const [textColor, setTextColor] = useState(
    initialScheme?.nav_text_color || initialColors?.text || "#2C1810"
  );
  const [autoBackground, setAutoBackground] = useState(!initialColors?.background && !initialScheme?.collection_bg_color);
  const [backgroundColor, setBackgroundColor] = useState(
    initialScheme?.collection_bg_color || initialColors?.background || "#FAF8F5"
  );

  // Initialize overrides from existing scheme if provided
  const [overrides, setOverrides] = useState<Record<string, string>>(() => {
    if (!initialScheme) return {};

    // Extract all color fields from the existing scheme to use as overrides
    const existingColors: Record<string, string> = {};
    const colorFields = [
      'nav_bg_color', 'nav_text_color', 'nav_active_link_color',
      'lifeline_border_color', 'lifeline_bg_color', 'lifeline_text_color',
      'lifeline_entry_header_bg', 'lifeline_entry_header_text', 'lifeline_entry_date_color',
      'collection_bg_color', 'collection_text_color', 'collection_card_bg',
      'collection_card_text', 'collection_card_accent',
      'card_bg_color', 'card_border_color', 'card_text_color',
      'award_bg', 'award_border', 'award_text'
    ];

    colorFields.forEach(field => {
      if (initialScheme[field]) {
        existingColors[field] = initialScheme[field];
      }
    });

    return existingColors;
  });

  // Initialize generated scheme from existing scheme if provided
  const [generatedScheme, setGeneratedScheme] = useState<GeneratedColorScheme>(() => {
    // If we have an existing scheme, extract all its colors as overrides
    if (initialScheme) {
      const existingColors: Record<string, string> = {};
      const colorFields = [
        'nav_bg_color', 'nav_text_color', 'nav_active_link_color',
        'lifeline_border_color', 'lifeline_bg_color', 'lifeline_text_color',
        'lifeline_entry_header_bg', 'lifeline_entry_header_text', 'lifeline_entry_date_color',
        'collection_bg_color', 'collection_text_color', 'collection_card_bg',
        'collection_card_text', 'collection_card_accent',
        'card_bg_color', 'card_border_color', 'card_text_color',
        'award_bg', 'award_border', 'award_text'
      ];

      colorFields.forEach(field => {
        if (initialScheme[field]) {
          existingColors[field] = initialScheme[field];
        }
      });

      return existingColors as GeneratedColorScheme;
    }

    // Otherwise generate from the colors
    return generateColorScheme({
      primary: primaryColor,
      secondary: secondaryColor,
      text: autoText ? undefined : textColor,
      background: autoBackground ? undefined : backgroundColor,
    });
  });

  // Track if this is the initial mount (to avoid regenerating existing scheme)
  const [isInitialMount, setIsInitialMount] = useState(!!initialScheme);

  // Update colors when initialScheme changes (after database load)
  useEffect(() => {
    if (initialScheme) {
      console.log('[SimpleColorSchemeEditor] initialScheme changed, updating colors:', initialScheme.nav_bg_color);
      setPrimaryColor(initialScheme.nav_bg_color || "#D4B996");
      setSecondaryColor(initialScheme.nav_active_link_color || "#C97456");
      setTextColor(initialScheme.nav_text_color || "#2C1810");
      setBackgroundColor(initialScheme.collection_bg_color || "#FAF8F5");

      // Extract all colors as overrides
      const existingColors: Record<string, string> = {};
      const colorFields = [
        'nav_bg_color', 'nav_text_color', 'nav_active_link_color',
        'lifeline_border_color', 'lifeline_bg_color', 'lifeline_text_color',
        'lifeline_entry_header_bg', 'lifeline_entry_header_text', 'lifeline_entry_date_color',
        'collection_bg_color', 'collection_text_color', 'collection_card_bg',
        'collection_card_text', 'collection_card_accent',
        'card_bg_color', 'card_border_color', 'card_text_color',
        'award_bg', 'award_border', 'award_text'
      ];

      colorFields.forEach(field => {
        if (initialScheme[field]) {
          existingColors[field] = initialScheme[field];
        }
      });

      setOverrides(existingColors);
      setGeneratedScheme(existingColors as GeneratedColorScheme);
    }
  }, [initialScheme]);

  // Regenerate scheme when inputs change (but not on initial mount if we have existing scheme)
  useEffect(() => {
    // Skip regeneration on initial mount if we loaded an existing scheme
    if (isInitialMount) {
      setIsInitialMount(false);

      // Still trigger onChange with the existing colors
      if (onChange && initialScheme) {
        onChange(generatedScheme, simpleMode, overrides);
      }
      return;
    }

    const newScheme = generateColorScheme({
      primary: primaryColor,
      secondary: secondaryColor,
      text: autoText ? undefined : textColor,
      background: autoBackground ? undefined : backgroundColor,
    });

    // Apply any overrides (existing colors take precedence)
    const finalScheme = { ...newScheme, ...overrides };

    setGeneratedScheme(finalScheme as GeneratedColorScheme);

    if (onChange) {
      onChange(finalScheme as GeneratedColorScheme, simpleMode, overrides);
    }
  }, [primaryColor, secondaryColor, autoText, textColor, autoBackground, backgroundColor, overrides, simpleMode, onChange, isInitialMount, generatedScheme, initialScheme]);

  const handleOverride = (key: keyof GeneratedColorScheme, value: string) => {
    setOverrides(prev => ({ ...prev, [key]: value }));
  };

  const handleResetOverride = (key: keyof GeneratedColorScheme) => {
    setOverrides(prev => {
      const newOverrides = { ...prev };
      delete newOverrides[key];
      return newOverrides;
    });
  };

  const colorMappingInfo: Record<keyof GeneratedColorScheme, { label: string; usage: string }> = {
    nav_bg_color: { label: "Nav Background", usage: "Navigation bar background" },
    nav_text_color: { label: "Nav Text", usage: "Navigation text color" },
    nav_active_link_color: { label: "Nav Active Link", usage: "Active navigation links" },
    lifeline_border_color: { label: "Lifeline Border", usage: "Lifeline borders and emphasis" },
    lifeline_bg_color: { label: "Lifeline Background", usage: "Lifeline entry backgrounds" },
    lifeline_text_color: { label: "Lifeline Text", usage: "Lifeline text color" },
    lifeline_entry_header_bg: { label: "Entry Header BG", usage: "Lifeline entry headers" },
    lifeline_entry_header_text: { label: "Entry Header Text", usage: "Header text color" },
    lifeline_entry_date_color: { label: "Entry Date", usage: "Date timestamps" },
    collection_bg_color: { label: "Collection Background", usage: "Page background" },
    collection_text_color: { label: "Collection Text", usage: "Primary text color" },
    collection_card_bg: { label: "Collection Card BG", usage: "Section backgrounds" },
    collection_card_text: { label: "Collection Card Text", usage: "Card text color" },
    collection_card_accent: { label: "Collection Accent", usage: "Accent elements" },
    card_bg_color: { label: "Card Background", usage: "Content cards" },
    card_border_color: { label: "Card Border", usage: "Card borders and dividers" },
    card_text_color: { label: "Card Text", usage: "Card text color" },
    award_bg: { label: "Award Background", usage: "Award card backgrounds" },
    award_border: { label: "Award Border", usage: "Award card borders" },
    award_text: { label: "Award Text", usage: "Award text color" },
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* LEFT PANEL: Inputs */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Color Mode</CardTitle>
                <CardDescription>Choose your editing experience</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="simple-mode" className={!simpleMode ? "text-muted-foreground" : ""}>
                  Simple
                </Label>
                <Switch
                  id="simple-mode"
                  checked={!simpleMode}
                  onCheckedChange={(checked) => setSimpleMode(!checked)}
                />
                <Label htmlFor="simple-mode" className={simpleMode ? "text-muted-foreground" : ""}>
                  Advanced
                </Label>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Brand Colors</CardTitle>
            <CardDescription>Pick 2 colors and see instant results →</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Primary Brand Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-16 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 font-mono"
                  placeholder="#D4B996"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Used for navigation, headers, main accents
              </p>
            </div>

            <div className="space-y-2">
              <Label>Secondary Brand Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-16 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="flex-1 font-mono"
                  placeholder="#C97456"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Used for buttons, highlights, interactive elements
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Text Color</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    id="auto-text"
                    checked={autoText}
                    onCheckedChange={setAutoText}
                  />
                  <Label htmlFor="auto-text" className="text-xs">Auto</Label>
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-16 h-10 cursor-pointer"
                  disabled={autoText}
                />
                <Input
                  type="text"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="flex-1 font-mono"
                  placeholder="#2C1810"
                  disabled={autoText}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Background Color</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    id="auto-bg"
                    checked={autoBackground}
                    onCheckedChange={setAutoBackground}
                  />
                  <Label htmlFor="auto-bg" className="text-xs">Auto</Label>
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-16 h-10 cursor-pointer"
                  disabled={autoBackground}
                />
                <Input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="flex-1 font-mono"
                  placeholder="#FAF8F5"
                  disabled={autoBackground}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Mode: Show all 20 colors */}
        {!simpleMode && (
          <Card>
            <CardHeader>
              <CardTitle>All 20 Generated Colors</CardTitle>
              <CardDescription>
                Click "Override" to manually adjust any color
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="navigation">
                  <AccordionTrigger>Navigation Colors (3)</AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-4">
                    {(['nav_bg_color', 'nav_text_color', 'nav_active_link_color'] as const).map(key => {
                      const info = colorMappingInfo[key];
                      const isOverridden = key in overrides;
                      return (
                        <div key={key} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                          <div
                            className="w-10 h-10 rounded border-2"
                            style={{ backgroundColor: generatedScheme[key] }}
                          />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{info.label}</div>
                            <div className="text-xs text-muted-foreground font-mono">{generatedScheme[key]}</div>
                          </div>
                          {isOverridden ? (
                            <Button size="sm" variant="outline" onClick={() => handleResetOverride(key)}>
                              Reset
                            </Button>
                          ) : (
                            <Input
                              type="color"
                              value={generatedScheme[key]}
                              onChange={(e) => handleOverride(key, e.target.value)}
                              className="w-12 h-8 cursor-pointer"
                            />
                          )}
                        </div>
                      );
                    })}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="cards">
                  <AccordionTrigger>Card Colors (3)</AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-4">
                    {(['card_bg_color', 'card_border_color', 'card_text_color'] as const).map(key => {
                      const info = colorMappingInfo[key];
                      const isOverridden = key in overrides;
                      return (
                        <div key={key} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                          <div
                            className="w-10 h-10 rounded border-2"
                            style={{ backgroundColor: generatedScheme[key] }}
                          />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{info.label}</div>
                            <div className="text-xs text-muted-foreground font-mono">{generatedScheme[key]}</div>
                          </div>
                          {isOverridden ? (
                            <Button size="sm" variant="outline" onClick={() => handleResetOverride(key)}>
                              Reset
                            </Button>
                          ) : (
                            <Input
                              type="color"
                              value={generatedScheme[key]}
                              onChange={(e) => handleOverride(key, e.target.value)}
                              className="w-12 h-8 cursor-pointer"
                            />
                          )}
                        </div>
                      );
                    })}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="awards">
                  <AccordionTrigger>Award Colors (3)</AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-4">
                    {(['award_bg', 'award_border', 'award_text'] as const).map(key => {
                      const info = colorMappingInfo[key];
                      const isOverridden = key in overrides;
                      return (
                        <div key={key} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                          <div
                            className="w-10 h-10 rounded border-2"
                            style={{ backgroundColor: generatedScheme[key] }}
                          />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{info.label}</div>
                            <div className="text-xs text-muted-foreground font-mono">{generatedScheme[key]}</div>
                          </div>
                          {isOverridden ? (
                            <Button size="sm" variant="outline" onClick={() => handleResetOverride(key)}>
                              Reset
                            </Button>
                          ) : (
                            <Input
                              type="color"
                              value={generatedScheme[key]}
                              onChange={(e) => handleOverride(key, e.target.value)}
                              className="w-12 h-8 cursor-pointer"
                            />
                          )}
                        </div>
                      );
                    })}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              <p className="text-xs text-muted-foreground mt-4">
                + 11 more colors (collection, lifeline colors)
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* RIGHT PANEL: Live Preview */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
              <CardTitle>Live Preview</CardTitle>
            </div>
            <CardDescription>Updates instantly as you pick colors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Navigation Preview */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Navigation Bar</Label>
              <div
                className="rounded-lg p-4 flex items-center gap-4"
                style={{
                  backgroundColor: generatedScheme.nav_bg_color,
                  color: generatedScheme.nav_text_color,
                }}
              >
                <span className="font-semibold">Logo</span>
                <span className="opacity-70">Home</span>
                <span
                  className="px-3 py-1 rounded"
                  style={{
                    backgroundColor: generatedScheme.nav_active_link_color,
                    color: generatedScheme.nav_text_color,
                  }}
                >
                  Collections
                </span>
                <span className="opacity-70">Profiles</span>
              </div>
            </div>

            {/* Award Card Preview */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Award Card</Label>
              <div
                className="rounded-lg p-4 border-2"
                style={{
                  backgroundColor: generatedScheme.award_bg,
                  borderColor: generatedScheme.award_border,
                  color: generatedScheme.award_text,
                }}
              >
                <div className="font-semibold mb-2">Best Character Development</div>
                <div className="text-sm opacity-80">Winner: Don Draper</div>
              </div>
            </div>

            {/* Content Cards Preview */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Content Cards</Label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  className="rounded-lg p-3 border"
                  style={{
                    backgroundColor: generatedScheme.card_bg_color,
                    borderColor: generatedScheme.card_border_color,
                    color: generatedScheme.card_text_color,
                  }}
                >
                  <div className="font-medium text-sm mb-2">Profile Card</div>
                  <div className="flex gap-1">
                    <Badge
                      variant="secondary"
                      style={{
                        backgroundColor: generatedScheme.collection_card_bg,
                        borderColor: generatedScheme.card_border_color,
                      }}
                    >
                      Character
                    </Badge>
                  </div>
                </div>
                <div
                  className="rounded-lg p-3 border"
                  style={{
                    backgroundColor: generatedScheme.card_bg_color,
                    borderColor: generatedScheme.card_border_color,
                    color: generatedScheme.card_text_color,
                  }}
                >
                  <div className="font-medium text-sm mb-2">Lifeline Card</div>
                  <Badge
                    variant="secondary"
                    style={{
                      backgroundColor: generatedScheme.collection_card_bg,
                      borderColor: generatedScheme.card_border_color,
                    }}
                  >
                    Timeline
                  </Badge>
                </div>
              </div>
            </div>

            {/* Buttons Preview */}
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Buttons</Label>
              <div className="flex gap-2">
                <Button
                  style={{
                    backgroundColor: generatedScheme.nav_active_link_color,
                    color: generatedScheme.nav_text_color,
                  }}
                >
                  Primary Action
                </Button>
                <Button
                  variant="outline"
                  style={{
                    borderColor: generatedScheme.card_border_color,
                    color: generatedScheme.card_text_color,
                  }}
                >
                  Secondary
                </Button>
              </div>
            </div>

            {/* Comparison Box */}
            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <div className="font-semibold text-red-600">❌ OLD</div>
                  <div className="text-muted-foreground">20 fields</div>
                  <div className="text-muted-foreground">~15 minutes</div>
                  <div className="text-muted-foreground">Manual guessing</div>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-green-600">✅ NEW</div>
                  <div className="text-muted-foreground">2 colors</div>
                  <div className="text-muted-foreground">~2 minutes</div>
                  <div className="text-muted-foreground">Auto harmony</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
