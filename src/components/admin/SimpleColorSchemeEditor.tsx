import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { generateColorScheme, type GeneratedColorScheme } from "@/lib/colorGeneration";
import type { ColorScheme } from "./ColorSchemeEditorFull";

type SimpleColorSchemeEditorProps = {
  initialColors?: { primary?: string; secondary?: string; text?: string; background?: string };
  initialScheme?: Partial<ColorScheme>;
  onChange: (scheme: ColorScheme) => void;
};

export function SimpleColorSchemeEditor({ initialColors, initialScheme, onChange }: SimpleColorSchemeEditorProps) {
  const [simpleMode, setSimpleMode] = useState(true);

  // Initialize from existing scheme if provided, otherwise use defaults
  const [primaryColor, setPrimaryColor] = useState(
    initialScheme?.nav_bg_color || initialColors?.primary || "#D4B996"
  );
  const [secondaryColor, setSecondaryColor] = useState(
    initialScheme?.nav_button_color || initialColors?.secondary || "#C97456"
  );
  const [autoText, setAutoText] = useState(!initialColors?.text && !initialScheme?.nav_text_color);
  const [textColor, setTextColor] = useState(
    initialScheme?.nav_text_color || initialColors?.text || "#2C1810"
  );
  const [autoBackground, setAutoBackground] = useState(!initialColors?.background && !initialScheme?.cards_bg);
  const [backgroundColor, setBackgroundColor] = useState(
    initialScheme?.cards_bg || initialColors?.background || "#FAF8F5"
  );

  // Generate full scheme when colors change
  useEffect(() => {
    const input = {
      primary: primaryColor,
      secondary: secondaryColor,
      text: autoText ? undefined : textColor,
      background: autoBackground ? undefined : backgroundColor,
    };

    const generated = generateColorScheme(input);
    
    // Map GeneratedColorScheme to ColorScheme (removing the extra fields)
    const fullScheme: ColorScheme = {
      nav_bg_color: generated.nav_bg_color,
      nav_text_color: generated.nav_text_color,
      nav_button_color: generated.nav_active_link_color,
      ll_display_bg: generated.ll_display_bg,
      ll_display_title_text: generated.ll_display_title_text,
      ll_entry_title_text: generated.ll_entry_title_text,
      ll_entry_contributor_button: generated.ll_entry_contributor_button,
      ll_graph_bg: generated.ll_graph_bg,
      ll_graph_positive: generated.ll_graph_positive,
      ll_graph_negative: generated.ll_graph_negative,
      cards_bg: generated.cards_bg,
      cards_border: generated.cards_border,
      cards_text: generated.cards_text,
      ch_actions_bg: generated.ch_actions_bg,
      ch_actions_border: generated.ch_actions_border,
      ch_actions_icon: generated.ch_actions_icon,
      ch_actions_text: generated.ch_actions_text,
      ch_banner_text: generated.ch_banner_text,
      award_bg: generated.award_bg,
      award_border: generated.award_border,
      title_text: generated.title_text,
    };

    onChange(fullScheme);
  }, [primaryColor, secondaryColor, textColor, backgroundColor, autoText, autoBackground, onChange]);

  const ColorInput = ({ label, value, onChange: onColorChange, description }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    description?: string;
  }) => (
    <div className="space-y-2">
      <Label htmlFor={label} className="text-sm font-medium">
        {label}
      </Label>
      <div className="flex gap-2 items-center">
        <Input
          id={label}
          type="color"
          value={value}
          onChange={(e) => onColorChange(e.target.value)}
          className="w-16 h-10 p-1 cursor-pointer"
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onColorChange(e.target.value)}
          className="font-mono text-sm"
          placeholder="#000000"
        />
      </div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Simple Mode Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Color Mode</span>
            <div className="flex items-center gap-2">
              <Label htmlFor="mode-toggle" className="text-sm font-normal">
                {simpleMode ? "Simple (2 Colors)" : "Advanced (4 Colors)"}
              </Label>
              <Switch
                id="mode-toggle"
                checked={!simpleMode}
                onCheckedChange={(checked) => setSimpleMode(!checked)}
              />
            </div>
          </CardTitle>
          <CardDescription>
            {simpleMode
              ? "Generate a full color scheme from just 2 colors"
              : "Fine-tune text and background colors"}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Color Inputs */}
      <Card>
        <CardHeader>
          <CardTitle>Base Colors</CardTitle>
          <CardDescription>
            Choose your primary and secondary colors - all other colors will be generated automatically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ColorInput
            label="Primary Color"
            value={primaryColor}
            onChange={setPrimaryColor}
            description="Main brand color (used for navigation background, card accents)"
          />
          
          <Separator />
          
          <ColorInput
            label="Secondary Color"
            value={secondaryColor}
            onChange={setSecondaryColor}
            description="Accent color (used for buttons, highlights, active states)"
          />

          {!simpleMode && (
            <>
              <Separator />
              
              {/* Text Color */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Text Color</Label>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="auto-text" className="text-xs text-muted-foreground">
                      Auto-generate
                    </Label>
                    <Switch
                      id="auto-text"
                      checked={autoText}
                      onCheckedChange={setAutoText}
                    />
                  </div>
                </div>
                {!autoText && (
                  <ColorInput
                    label=""
                    value={textColor}
                    onChange={setTextColor}
                    description="Main text color across the site"
                  />
                )}
                {autoText && (
                  <p className="text-xs text-muted-foreground">
                    Text color will be automatically chosen for optimal contrast
                  </p>
                )}
              </div>

              <Separator />

              {/* Background Color */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Background Color</Label>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="auto-bg" className="text-xs text-muted-foreground">
                      Auto-generate
                    </Label>
                    <Switch
                      id="auto-bg"
                      checked={autoBackground}
                      onCheckedChange={setAutoBackground}
                    />
                  </div>
                </div>
                {!autoBackground && (
                  <ColorInput
                    label=""
                    value={backgroundColor}
                    onChange={setBackgroundColor}
                    description="Main page background color"
                  />
                )}
                {autoBackground && (
                  <p className="text-xs text-muted-foreground">
                    Background will be automatically generated from your primary color
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Live Preview</CardTitle>
          <CardDescription>
            See how your colors will look across different components
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Navigation Preview */}
          <div>
            <p className="text-sm font-medium mb-2">Navigation Bar</p>
            <div
              style={{
                backgroundColor: primaryColor,
                padding: '12px 16px',
                borderRadius: '8px',
                display: 'flex',
                gap: '16px',
                alignItems: 'center'
              }}
            >
              <span style={{ color: autoText ? '#fff' : textColor, fontWeight: 'bold' }}>Logo</span>
              <span style={{ color: autoText ? '#fff' : textColor }}>Home</span>
              <button
                style={{
                  backgroundColor: secondaryColor,
                  color: autoText ? '#fff' : textColor,
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: '14px'
                }}
              >
                Collections
              </button>
              <span style={{ color: autoText ? '#fff' : textColor }}>Profiles</span>
            </div>
          </div>

          {/* Card Preview */}
          <div>
            <p className="text-sm font-medium mb-2">Content Card</p>
            <div
              style={{
                backgroundColor: autoBackground ? '#FAF8F5' : backgroundColor,
                border: `2px solid ${primaryColor}`,
                padding: '16px',
                borderRadius: '8px'
              }}
            >
              <h3 style={{ 
                fontWeight: 'bold', 
                marginBottom: '8px',
                color: autoText ? '#2C1810' : textColor
              }}>
                Card Title
              </h3>
              <p style={{ 
                fontSize: '14px',
                marginBottom: '12px',
                color: autoText ? '#2C1810' : textColor
              }}>
                This is sample card content showing how text appears.
              </p>
              <button
                style={{
                  backgroundColor: secondaryColor,
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: '12px'
                }}
              >
                🔗 Action
              </button>
            </div>
          </div>

          {/* Timeline Entry Preview */}
          <div>
            <p className="text-sm font-medium mb-2">Lifeline Timeline</p>
            <div
              style={{
                backgroundColor: autoBackground ? '#FAF8F5' : backgroundColor,
                padding: '16px',
                borderRadius: '8px',
                border: `1px solid ${primaryColor}`
              }}
            >
              <h4
                style={{
                  fontWeight: 'bold',
                  fontSize: '14px',
                  marginBottom: '12px',
                  color: autoText ? '#2C1810' : textColor
                }}
              >
                Timeline Entry
              </h4>
              <div
                style={{
                  backgroundColor: '#ffffff',
                  padding: '8px',
                  borderRadius: '4px'
                }}
              >
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginBottom: '4px' }}>
                  <div
                    style={{
                      backgroundColor: secondaryColor,
                      height: '8px',
                      width: '60%',
                      borderRadius: '2px'
                    }}
                  />
                  <span style={{ fontSize: '12px' }}>+60</span>
                </div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <div
                    style={{
                      backgroundColor: '#982534',
                      height: '8px',
                      width: '40%',
                      borderRadius: '2px'
                    }}
                  />
                  <span style={{ fontSize: '12px' }}>-40</span>
                </div>
              </div>
            </div>
          </div>

          {/* Award Preview */}
          <div>
            <p className="text-sm font-medium mb-2">Award Card</p>
            <div
              style={{
                backgroundColor: secondaryColor,
                padding: '16px',
                borderRadius: '8px',
                textAlign: 'center',
                border: `2px solid ${primaryColor}`
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏆</div>
              <p style={{ fontWeight: 'bold', fontSize: '14px', color: '#fff' }}>
                Best Character Development
              </p>
              <p style={{ fontSize: '12px', opacity: 0.8, color: '#fff' }}>
                Winner: Character Name
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generated Colors Info */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
          <CardDescription>
            Your color scheme generates 20+ coordinated colors automatically
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>✨ <strong>Navigation colors</strong> - Based on your primary color</p>
            <p>🎨 <strong>Card & content colors</strong> - Harmonious neutrals from primary</p>
            <p>📊 <strong>Timeline & graph colors</strong> - Secondary color for highlights</p>
            <p>🏆 <strong>Award & accent colors</strong> - Secondary color variations</p>
            <p className="text-muted-foreground mt-4">
              All colors are mathematically generated to ensure good contrast, accessibility, and visual harmony.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
