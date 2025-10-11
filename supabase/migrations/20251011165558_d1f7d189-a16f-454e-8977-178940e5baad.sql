-- Seed data for Lifeline Public Admin Console
-- This creates sample data to demonstrate the system

-- Note: User creation handled separately via auth

-- Sample tags
INSERT INTO tags (name, slug, category, description) VALUES
  ('Drama', 'drama', 'genre', 'Dramatic storytelling'),
  ('1960s', '1960s', 'era', 'The sixties era'),
  ('Advertising', 'advertising', 'industry', 'Advertising industry'),
  ('Protagonist', 'protagonist', 'role', 'Main character'),
  ('Complex Character', 'complex-character', 'character', 'Multi-dimensional character');

-- Sample collection: Mad Men
INSERT INTO collections (title, slug, description, category, primary_color, secondary_color, status) VALUES
  (
    'Mad Men: The Complete Series',
    'mad-men-complete',
    'Explore the lives, struggles, and triumphs of the characters from the critically acclaimed series Mad Men. From the enigmatic Don Draper to the groundbreaking Peggy Olson.',
    'Television',
    '#8B4513',
    '#D4AF37',
    'published'
  );

-- Get the collection ID for reference
DO $$
DECLARE
  mad_men_collection_id UUID;
  don_draper_profile_id UUID;
  don_draper_lifeline_id UUID;
BEGIN
  -- Get the collection ID
  SELECT id INTO mad_men_collection_id FROM collections WHERE slug = 'mad-men-complete';

  -- Sample profile: Don Draper
  INSERT INTO profiles (display_name, slug, type, summary, occupation, status)
  VALUES (
    'Don Draper',
    'don-draper',
    'person_fictional',
    'Don Draper is the creative director at Sterling Cooper advertising agency. Born as Dick Whitman, he assumed the identity of his deceased commanding officer during the Korean War. A talented but troubled ad man, Don struggles with his past, identity, and relationships while creating some of the most memorable advertising campaigns of the 1960s.',
    'Creative Director',
    'published'
  )
  RETURNING id INTO don_draper_profile_id;

  -- Link profile to collection
  INSERT INTO profile_collections (profile_id, collection_id, role_in_collection)
  VALUES (don_draper_profile_id, mad_men_collection_id, 'Protagonist');

  -- Sample lifeline: Don Draper's Journey
  INSERT INTO lifelines (
    title,
    slug,
    subtitle,
    intro,
    conclusion,
    lifeline_type,
    subject_name,
    profile_id,
    collection_id,
    status
  )
  VALUES (
    'Don Draper: The Man Who Wasn''t There',
    'don-draper-journey',
    'A journey through identity, success, and reinvention',
    'Don Draper''s story is one of constant reinvention. From Dick Whitman to Don Draper, from copywriter to creative director, his journey through 1960s Madison Avenue is marked by brilliant highs and devastating lows.',
    'Despite his professional success, Don''s personal struggles with identity and authenticity remain unresolved, leaving him perpetually searching for meaning in a life built on lies.',
    'profile',
    'Don Draper',
    don_draper_profile_id,
    mad_men_collection_id,
    'published'
  )
  RETURNING id INTO don_draper_lifeline_id;

  -- Link lifeline to profile
  INSERT INTO profile_lifelines (profile_id, lifeline_id, relationship_type)
  VALUES (don_draper_profile_id, don_draper_lifeline_id, 'subject');

  -- Sample entries for Don Draper's lifeline
  INSERT INTO entries (lifeline_id, title, score, summary, details, sentiment, order_index)
  VALUES
    (
      don_draper_lifeline_id,
      'Assumes Don Draper Identity',
      -8,
      'Dick Whitman assumes the identity of his deceased commanding officer, Lt. Don Draper, during the Korean War',
      'This pivotal moment sets the stage for Dick Whitman''s entire future. After an accident kills the real Don Draper, Dick switches dog tags and identities, escaping his troubled past but creating a foundation of deception.',
      'mixed',
      0
    ),
    (
      don_draper_lifeline_id,
      'Hired at Sterling Cooper',
      7,
      'Joins Sterling Cooper advertising agency as a talented copywriter',
      'Don''s creative genius quickly becomes apparent at Sterling Cooper. His ability to understand what makes people tick and translate that into compelling advertising campaigns sets him apart.',
      'positive',
      1
    ),
    (
      don_draper_lifeline_id,
      'Creates the Carousel Pitch',
      9,
      'Delivers the legendary "Carousel" pitch for Kodak, one of the greatest ad presentations ever',
      'Don''s nostalgic and emotionally resonant pitch for the Kodak Carousel projector showcases his genius. The presentation is both a triumph of his career and a painful reminder of what he''s losing in his personal life.',
      'mixed',
      2
    ),
    (
      don_draper_lifeline_id,
      'Divorce from Betty',
      -7,
      'Marriage to Betty Draper falls apart after she discovers his true identity',
      'The dissolution of Don''s first marriage is both a personal failure and a consequence of his inability to be honest about who he really is. Betty''s discovery of his past shatters their family.',
      'negative',
      3
    ),
    (
      don_draper_lifeline_id,
      'Founds Sterling Cooper Draper Pryce',
      8,
      'Starts his own agency with partners, becoming a name partner',
      'In a bold move, Don and several colleagues break away to form their own agency. This represents both professional success and a chance at a fresh start.',
      'positive',
      4
    ),
    (
      don_draper_lifeline_id,
      'Final Pitch - Coca-Cola',
      10,
      'Creates the iconic "Buy the World a Coke" campaign after a spiritual journey',
      'After hitting rock bottom and experiencing a breakthrough at a California retreat, Don channels his revelation into perhaps the most famous advertisement of all time. It''s unclear whether this represents genuine growth or just another brilliant reinvention.',
      'positive',
      5
    );

  -- Sample mock election for Mad Men
  INSERT INTO mock_elections (title, slug, description, collection_id, status)
  VALUES (
    'Sterling Cooper High School - Class of 1965',
    'sterling-cooper-yearbook-1965',
    'Yearbook superlatives for the Sterling Cooper crew',
    mad_men_collection_id,
    'published'
  );
END $$;