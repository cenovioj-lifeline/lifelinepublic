-- Add comprehensive theme color fields to collections table
-- Organized by page sections for better theme management

-- Navigation colors (additional)
ALTER TABLE collections ADD COLUMN IF NOT EXISTS nav_button_color TEXT;

-- Home page banner
ALTER TABLE collections ADD COLUMN IF NOT EXISTS banner_text_color TEXT;

-- Home page actions section
ALTER TABLE collections ADD COLUMN IF NOT EXISTS actions_bg_color TEXT;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS actions_border_color TEXT;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS actions_icon_color TEXT;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS actions_text_color TEXT;

-- Card colors (additional)
ALTER TABLE collections ADD COLUMN IF NOT EXISTS card_text_color TEXT;

-- Lifeline display colors
ALTER TABLE collections ADD COLUMN IF NOT EXISTS lifeline_display_border TEXT;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS lifeline_display_bg TEXT;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS lifeline_display_title_text TEXT;

-- Lifeline graph colors (additional to primary/secondary)
ALTER TABLE collections ADD COLUMN IF NOT EXISTS graph_bg_color TEXT;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS graph_line_color TEXT;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS graph_highlight_color TEXT;

-- Lifeline entry detail colors
ALTER TABLE collections ADD COLUMN IF NOT EXISTS entry_header_bg TEXT;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS entry_header_text TEXT;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS entry_button_color TEXT;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS entry_title_text TEXT;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS entry_contributor_button TEXT;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS entry_bg_color TEXT;

-- Awards/Elections colors
ALTER TABLE collections ADD COLUMN IF NOT EXISTS award_heading_text TEXT;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS award_heading_icon TEXT;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS award_heading_tag TEXT;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS award_icon_color TEXT;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS award_title_text TEXT;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS award_bg_color TEXT;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS award_border_color TEXT;

-- Profile page colors
ALTER TABLE collections ADD COLUMN IF NOT EXISTS profile_header_bg TEXT;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS profile_header_text TEXT;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS profile_card_bg TEXT;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS profile_card_border TEXT;

-- General/Default colors
ALTER TABLE collections ADD COLUMN IF NOT EXISTS default_color TEXT;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS link_color TEXT;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS link_hover_color TEXT;

-- Add comments for clarity
COMMENT ON COLUMN collections.nav_button_color IS 'Navigation bar button/icon color';
COMMENT ON COLUMN collections.banner_text_color IS 'Collection home page banner text overlay color';
COMMENT ON COLUMN collections.actions_bg_color IS 'Home page action cards background color';
COMMENT ON COLUMN collections.actions_border_color IS 'Home page action cards border color';
COMMENT ON COLUMN collections.actions_icon_color IS 'Home page action cards icon color';
COMMENT ON COLUMN collections.actions_text_color IS 'Home page action cards text color';
COMMENT ON COLUMN collections.card_text_color IS 'Card text color throughout collection';
COMMENT ON COLUMN collections.lifeline_display_border IS 'Lifeline viewer display border color';
COMMENT ON COLUMN collections.lifeline_display_bg IS 'Lifeline viewer display background color';
COMMENT ON COLUMN collections.lifeline_display_title_text IS 'Lifeline viewer title text color';
COMMENT ON COLUMN collections.graph_bg_color IS 'Lifeline graph background color';
COMMENT ON COLUMN collections.graph_line_color IS 'Lifeline graph centerline and UI elements';
COMMENT ON COLUMN collections.graph_highlight_color IS 'Lifeline graph selection highlight color';
COMMENT ON COLUMN collections.entry_header_bg IS 'Lifeline entry detail header background';
COMMENT ON COLUMN collections.entry_header_text IS 'Lifeline entry detail header text';
COMMENT ON COLUMN collections.entry_button_color IS 'Lifeline entry navigation button color';
COMMENT ON COLUMN collections.entry_title_text IS 'Lifeline entry title text color';
COMMENT ON COLUMN collections.entry_contributor_button IS 'Lifeline contributor menu button color';
COMMENT ON COLUMN collections.entry_bg_color IS 'Lifeline entry detail background color';
COMMENT ON COLUMN collections.award_heading_text IS 'Award/Election page heading text';
COMMENT ON COLUMN collections.award_heading_icon IS 'Award/Election heading icon color';
COMMENT ON COLUMN collections.award_heading_tag IS 'Award/Election heading tag/badge color';
COMMENT ON COLUMN collections.award_icon_color IS 'Award item icon/avatar color';
COMMENT ON COLUMN collections.award_title_text IS 'Award item title text color';
COMMENT ON COLUMN collections.award_bg_color IS 'Award item background color';
COMMENT ON COLUMN collections.award_border_color IS 'Award item border color';
COMMENT ON COLUMN collections.profile_header_bg IS 'Profile page header background';
COMMENT ON COLUMN collections.profile_header_text IS 'Profile page header text';
COMMENT ON COLUMN collections.profile_card_bg IS 'Profile card background';
COMMENT ON COLUMN collections.profile_card_border IS 'Profile card border';
COMMENT ON COLUMN collections.default_color IS 'Default color for undefined elements';
COMMENT ON COLUMN collections.link_color IS 'Link text color';
COMMENT ON COLUMN collections.link_hover_color IS 'Link hover color';
