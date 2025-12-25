import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

// Type for the full color scheme
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

  // Awards (5)
  award_bg: string;
  award_border: string;
  award_category_bg: string;
  award_item_bg: string;
  award_text: string;

  // Global Text (1)
  title_text: string;

  // Page & Background (1)
  page_bg: string;

  // Profile Pages (2)
  profile_text: string;
  profile_label_text: string;

  // Filter Controls (1)
  filter_controls_text: string;
};

export type ColorSchemeEditorFullProps = {
  colors: ColorScheme;
  onChange: (colors: ColorScheme) => void;
};

// Default color scheme values
export const DEFAULT_COLORS: ColorScheme = {
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
  award_category_bg: "#f4e7d7",
  award_item_bg: "#ffffff",
  award_text: "#352d28",

  title_text: "#352d28",

  page_bg: "#f4e7d7",
  profile_text: "#352d28",
  profile_label_text: "#352d28",
  filter_controls_text: "#1f2937",
};

// Helper to extract only color fields from an object
export const extractColorFields = (obj: Record<string, unknown>): Partial<ColorScheme> => {
  const colorKeys = Object.keys(DEFAULT_COLORS) as (keyof ColorScheme)[];
  const result: Partial<ColorScheme> = {};
  for (const key of colorKeys) {
    if (key in obj && typeof obj[key] === "string") {
      result[key] = obj[key] as string;
    }
  }
  return result;
};

export function ColorSchemeEditorFull({ colors, onChange }: ColorSchemeEditorFullProps) {
  const handleColorChange = (field: keyof ColorScheme, value: string) => {
    onChange({ ...colors, [field]: value });
  };

  const ColorInput = ({
    label,
    field,
    description,
  }: {
    label: string;
    field: keyof ColorScheme;
    description?: string;
  }) => (
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
        {/* Page & Background - NEW */}
        <Card className="border-2 border-blue-200 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">📄</span>
              Page Background
              <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">NEW</span>
            </CardTitle>
            <CardDescription>Main page background behind all content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ColorInput
              label="Page Background"
              field="page_bg"
              description="The main background color for all pages"
            />
            {/* Mini preview */}
            <div className="mt-4">
              <p className="text-xs font-medium mb-2 text-muted-foreground">Preview:</p>
              <div
                style={{ backgroundColor: colors.page_bg, padding: '16px', borderRadius: '8px', border: '1px solid #ccc' }}
              >
                <div
                  style={{ backgroundColor: colors.cards_bg, padding: '12px', borderRadius: '6px', border: `1px solid ${colors.cards_border}` }}
                >
                  <p style={{ color: colors.cards_text, fontSize: '12px' }}>Content sits on cards above the page background</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

{/* Profile Text */}
        <Card className="border-2 border-blue-200 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">👤</span>
              Profile Text
            </CardTitle>
            <CardDescription>Text colors for profile pages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ColorInput
              label="Profile Text (Page Headings)"
              field="profile_text"
              description="Section headings on the page background (My Lifeline, Awards, Quotes, etc.)"
            />
            <ColorInput
              label="Profile Label Text (Card Content)"
              field="profile_label_text"
              description="Text inside nested cards (lifeline titles, award text, quote text)"
            />
            {/* Mini preview */}
            <div className="mt-4">
              <p className="text-xs font-medium mb-2 text-muted-foreground">Preview:</p>
              <div style={{ backgroundColor: colors.page_bg, borderRadius: '8px', padding: '16px', border: '1px solid #ccc' }}>
                <p style={{ color: colors.profile_text, fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>Section Heading (profile_text)</p>
                <div
                  style={{ backgroundColor: colors.cards_bg, padding: '12px', borderRadius: '6px', border: `1px solid ${colors.cards_border}` }}
                >
                  <p style={{ color: colors.profile_label_text, fontSize: '12px', fontWeight: 600 }}>Card Title (profile_label_text)</p>
                  <p style={{ color: colors.profile_label_text, fontSize: '11px', opacity: 0.7 }}>Card description text with muted opacity</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
              description="Background for award header bar"
            />
            <ColorInput
              label="Award Border"
              field="award_border"
              description="Border around award cards"
            />
            <ColorInput
              label="Award Category Header"
              field="award_category_bg"
              description="Background for category headers (e.g., 'FAMILY AWARDS' row)"
            />
            <ColorInput
              label="Award Item Background"
              field="award_item_bg"
              description="Background for individual award entries"
            />
            <ColorInput
              label="Award Text"
              field="award_text"
              description="Text color for award titles, winners, and descriptions"
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

        {/* Filters & Controls - NEW */}
        <Card className="border-2 border-blue-200 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">🔍</span>
              Filters & Controls
              <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">NEW</span>
            </CardTitle>
            <CardDescription>Text color for search inputs, dropdowns, and pagination</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ColorInput
              label="Filter Controls Text"
              field="filter_controls_text"
              description="Text color for search inputs, dropdowns, and pagination buttons"
            />
            {/* Mini preview */}
            <div className="mt-4">
              <p className="text-xs font-medium mb-2 text-muted-foreground">Preview:</p>
              <div
                style={{ backgroundColor: colors.page_bg, padding: '12px', borderRadius: '8px', border: '1px solid #ccc' }}
              >
                {/* Search input mock */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: `1px solid ${colors.cards_border}`,
                    borderRadius: '6px',
                    padding: '8px 12px',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span style={{ color: colors.filter_controls_text, opacity: 0.5, fontSize: '12px' }}>🔍</span>
                  <span style={{ color: colors.filter_controls_text, fontSize: '12px' }}>Search profiles...</span>
                </div>
                {/* Dropdown mock */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <div
                    style={{
                      backgroundColor: '#ffffff',
                      border: `1px solid ${colors.cards_border}`,
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '11px',
                      color: colors.filter_controls_text,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    All Categories ▼
                  </div>
                  <div
                    style={{
                      backgroundColor: '#ffffff',
                      border: `1px solid ${colors.cards_border}`,
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '11px',
                      color: colors.filter_controls_text,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    Sort: A-Z ▼
                  </div>
                </div>
                {/* Pagination mock */}
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span style={{ color: colors.filter_controls_text, fontSize: '11px', padding: '4px 8px', border: `1px solid ${colors.cards_border}`, borderRadius: '4px', backgroundColor: '#ffffff' }}>←</span>
                  <span style={{ color: colors.filter_controls_text, fontSize: '11px', padding: '4px 8px', border: `1px solid ${colors.cards_border}`, borderRadius: '4px', backgroundColor: '#ffffff' }}>1</span>
                  <span style={{ color: '#ffffff', fontSize: '11px', padding: '4px 8px', border: `1px solid ${colors.nav_button_color}`, borderRadius: '4px', backgroundColor: colors.nav_button_color }}>2</span>
                  <span style={{ color: colors.filter_controls_text, fontSize: '11px', padding: '4px 8px', border: `1px solid ${colors.cards_border}`, borderRadius: '4px', backgroundColor: '#ffffff' }}>3</span>
                  <span style={{ color: colors.filter_controls_text, fontSize: '11px', padding: '4px 8px', border: `1px solid ${colors.cards_border}`, borderRadius: '4px', backgroundColor: '#ffffff' }}>→</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Live Preview */}
      <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
        {/* Full Page Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">📱</span>
              Full Page Preview
            </CardTitle>
            <CardDescription>See how all colors work together</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              style={{
                backgroundColor: colors.page_bg,
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid #ccc'
              }}
            >
              {/* Nav Bar */}
              <div
                style={{
                  backgroundColor: colors.nav_bg_color,
                  color: colors.nav_text_color,
                  padding: '10px 16px',
                }}
              >
                <div className="flex gap-4 items-center">
                  <span className="font-bold text-sm">Logo</span>
                  <span className="text-xs">Home</span>
                  <button
                    style={{
                      backgroundColor: colors.nav_button_color,
                      color: colors.nav_text_color,
                      padding: '4px 10px',
                      borderRadius: '4px',
                      border: 'none',
                      fontSize: '11px'
                    }}
                  >
                    Collections
                  </button>
                </div>
              </div>

{/* Profile Section */}
              <div
                style={{
                  backgroundColor: colors.nav_bg_color,
                  padding: '20px',
                  textAlign: 'center'
                }}
              >
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: colors.nav_button_color, margin: '0 auto 10px' }} />
                <p style={{ color: colors.ch_banner_text, fontWeight: 'bold', fontSize: '16px' }}>Character Name</p>
                <p style={{ color: colors.ch_banner_text, opacity: 0.8, fontSize: '12px' }}>Protagonist • Lead Role</p>
              </div>

              {/* Content Area */}
              <div style={{ padding: '16px' }}>
                {/* Profile Section showing profile_text */}
                <div
                  style={{
                    backgroundColor: colors.cards_bg,
                    borderRadius: '6px',
                    padding: '12px',
                    marginBottom: '12px',
                    border: `1px solid ${colors.cards_border}`
                  }}
                >
                  <p style={{ color: colors.title_text, fontWeight: 'bold', fontSize: '13px', marginBottom: '6px' }}>Biography</p>
                  <p style={{ color: colors.profile_text, fontSize: '11px' }}>
                    This is profile text content - controlled by the Profile Text color.
                  </p>
                </div>

                {/* Content Card */}
                <div
                  style={{
                    backgroundColor: colors.cards_bg,
                    border: `1px solid ${colors.cards_border}`,
                    padding: '12px',
                    borderRadius: '6px'
                  }}
                >
                  <p style={{ color: colors.title_text, fontWeight: 'bold', fontSize: '12px', marginBottom: '6px' }}>Related Content</p>
                  <p style={{ color: colors.cards_text, fontSize: '10px' }}>Card content text here.</p>
                  <div className="flex gap-2 mt-2">
                    <button
                      style={{
                        backgroundColor: colors.ch_actions_bg,
                        border: `1px solid ${colors.ch_actions_border}`,
                        color: colors.ch_actions_text,
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '10px'
                      }}
                    >
                      Action
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">📊</span>
              Timeline Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              style={{
                backgroundColor: colors.ll_display_bg,
                padding: '16px',
                borderRadius: '8px',
                border: `2px solid ${colors.nav_bg_color}`
              }}
            >
              <h4
                className="font-bold text-sm mb-3"
                style={{ color: colors.ll_display_title_text }}
              >
                Character: The Journey
              </h4>
              <div
                className="mb-2"
                style={{
                  backgroundColor: colors.ll_graph_bg,
                  padding: '8px',
                  borderRadius: '4px'
                }}
              >
                <p style={{ color: colors.ll_entry_title_text, fontSize: '11px', fontWeight: '500', marginBottom: '4px' }}>Major Achievement</p>
                <div className="flex gap-1 items-center mb-1">
                  <div
                    style={{
                      backgroundColor: colors.ll_graph_positive,
                      height: '8px',
                      width: '70%',
                      borderRadius: '2px'
                    }}
                  />
                  <span className="text-xs">+7</span>
                </div>
              </div>
              <div
                style={{
                  backgroundColor: colors.ll_graph_bg,
                  padding: '8px',
                  borderRadius: '4px'
                }}
              >
                <p style={{ color: colors.ll_entry_title_text, fontSize: '11px', fontWeight: '500', marginBottom: '4px' }}>Setback Event</p>
                <div className="flex gap-1 items-center">
                  <div
                    style={{
                      backgroundColor: colors.ll_graph_negative,
                      height: '8px',
                      width: '40%',
                      borderRadius: '2px'
                    }}
                  />
                  <span className="text-xs">-4</span>
                </div>
              </div>
              <button
                className="mt-3"
                style={{
                  backgroundColor: colors.ll_entry_contributor_button,
                  color: colors.nav_text_color,
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  border: 'none'
                }}
              >
                + Contribute
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Award Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">🏆</span>
              Award Preview
            </CardTitle>
            <CardDescription>Shows category header vs item backgrounds</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Award header bar */}
            <div
              style={{
                backgroundColor: colors.award_bg,
                border: `2px solid ${colors.award_border}`,
                padding: '12px 16px',
                borderTopLeftRadius: '8px',
                borderTopRightRadius: '8px',
                textAlign: 'center'
              }}
            >
              <p className="font-bold text-sm" style={{ color: colors.title_text }}>🏆 Election Results</p>
            </div>
            {/* Category header */}
            <div
              style={{
                backgroundColor: colors.award_category_bg,
                border: `1px solid ${colors.award_border}`,
                borderTop: 'none',
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🏆</span>
                <span className="font-semibold text-sm" style={{ color: colors.award_text }}>FAMILY AWARDS</span>
                <span
                  style={{
                    backgroundColor: colors.nav_button_color,
                    color: colors.nav_text_color,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    fontSize: '10px'
                  }}
                >
                  5 awards
                </span>
              </div>
              <span style={{ color: colors.award_text, opacity: 0.5 }}>▼</span>
            </div>
            {/* Award items */}
            <div
              style={{
                backgroundColor: colors.award_item_bg,
                border: `1px solid ${colors.award_border}`,
                borderTop: 'none',
                padding: '12px 16px'
              }}
            >
              <p className="font-semibold text-sm mb-1" style={{ color: colors.award_text }}>Most Complicated Family Tree</p>
              <p className="text-xs" style={{ color: colors.award_text, opacity: 0.8 }}>Winner: Don Draper</p>
            </div>
            <div
              style={{
                backgroundColor: colors.award_item_bg,
                border: `1px solid ${colors.award_border}`,
                borderTop: 'none',
                padding: '12px 16px',
                borderBottomLeftRadius: '8px',
                borderBottomRightRadius: '8px'
              }}
            >
              <p className="font-semibold text-sm mb-1" style={{ color: colors.award_text }}>Best Parent</p>
              <p className="text-xs" style={{ color: colors.award_text, opacity: 0.8 }}>Winner: Trudy Campbell</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
