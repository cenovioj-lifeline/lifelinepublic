-- Create the News lifeline
INSERT INTO lifelines (title, slug, lifeline_type, visibility, status, collection_id, intro, subtitle)
VALUES (
  'News',
  'news',
  'person',
  'public',
  'published',
  NULL,
  'Major world events and news stories as they unfold',
  'Fictional news timeline for feed testing'
);

-- Insert 21 fictional news entries (Nov 9-29, 2025)
INSERT INTO entries (lifeline_id, title, occurred_on, score, sentiment, summary, details, order_index) VALUES
(
  (SELECT id FROM lifelines WHERE slug = 'news'),
  'Black Friday Shopping Breaks Online Records',
  '2025-11-29',
  4,
  'positive',
  'Online retailers report strongest Black Friday in history with record-breaking sales.',
  'E-commerce platforms saw a 25% increase in sales compared to last year, driven by aggressive discounting and improved supply chains. Major retailers reported their busiest online shopping day ever.',
  0
),
(
  (SELECT id FROM lifelines WHERE slug = 'news'),
  'Millions Gather for Thanksgiving Celebrations',
  '2025-11-28',
  6,
  'positive',
  'Families across the nation come together for traditional Thanksgiving festivities.',
  'An estimated 50 million Americans traveled for the holiday, marking a return to pre-pandemic celebration levels. Communities held parades and charitable events throughout the day.',
  0
),
(
  (SELECT id FROM lifelines WHERE slug = 'news'),
  'Winter Storm Cancels 2,000 Flights',
  '2025-11-27',
  -5,
  'negative',
  'Major winter storm disrupts holiday travel across the Midwest and Northeast.',
  'Airlines canceled over 2,000 flights as a powerful winter storm brought heavy snow and ice to major transportation hubs. Thousands of passengers were stranded at airports during the busy travel period.',
  0
),
(
  (SELECT id FROM lifelines WHERE slug = 'news'),
  'Scientists Discover New Deep-Sea Species',
  '2025-11-26',
  7,
  'positive',
  'Marine biologists identify 12 previously unknown species in ocean trench exploration.',
  'An international research team using advanced submersibles discovered diverse life forms at depths previously thought uninhabitable. The findings reshape understanding of deep-sea ecosystems.',
  0
),
(
  (SELECT id FROM lifelines WHERE slug = 'news'),
  'Tech Giant Announces Major Layoffs',
  '2025-11-25',
  -6,
  'negative',
  'Leading technology company cuts 8,000 jobs amid restructuring efforts.',
  'The company cited changing market conditions and the need to streamline operations. Affected employees will receive severance packages and job placement assistance.',
  0
),
(
  (SELECT id FROM lifelines WHERE slug = 'news'),
  'Historic Peace Agreement Signed',
  '2025-11-24',
  9,
  'positive',
  'Two nations end decades-long conflict with landmark peace treaty.',
  'After months of intensive negotiations, leaders signed a comprehensive agreement addressing territorial disputes and establishing economic cooperation frameworks. International observers praised the diplomatic breakthrough.',
  0
),
(
  (SELECT id FROM lifelines WHERE slug = 'news'),
  'Earthquake Strikes Remote Region',
  '2025-11-23',
  -7,
  'negative',
  '6.8 magnitude earthquake damages infrastructure in mountainous area.',
  'The powerful quake struck a sparsely populated region, causing landslides and damaging roads. Emergency teams are working to reach affected communities and assess the full extent of damage.',
  0
),
(
  (SELECT id FROM lifelines WHERE slug = 'news'),
  'Breakthrough in Renewable Energy Storage',
  '2025-11-22',
  8,
  'positive',
  'New battery technology promises to revolutionize solar and wind power storage.',
  'Researchers unveiled a novel energy storage system that is 40% more efficient than current technology and uses abundant, non-toxic materials. The breakthrough could accelerate the transition to renewable energy.',
  0
),
(
  (SELECT id FROM lifelines WHERE slug = 'news'),
  'Political Scandal Rocks Capitol',
  '2025-11-21',
  -5,
  'negative',
  'Senior official resigns amid ethics investigation and corruption allegations.',
  'The unexpected resignation followed revelations of undisclosed financial ties to industry lobbyists. Multiple committees have announced investigations into potential conflicts of interest.',
  0
),
(
  (SELECT id FROM lifelines WHERE slug = 'news'),
  'Mars Rover Discovers Water Evidence',
  '2025-11-20',
  10,
  'positive',
  'Space agency confirms finding of subsurface water ice on Mars.',
  'The latest rover mission detected strong signals indicating substantial water ice deposits beneath the Martian surface. The discovery has major implications for future human exploration and potential colonization.',
  0
),
(
  (SELECT id FROM lifelines WHERE slug = 'news'),
  'Supply Chain Disruptions Continue',
  '2025-11-19',
  -4,
  'negative',
  'Port congestion and shipping delays impact holiday retail inventory.',
  'Major retailers warn of potential shortages as container ships face delays at busy ports. Industry experts attribute the ongoing issues to labor shortages and increased consumer demand.',
  0
),
(
  (SELECT id FROM lifelines WHERE slug = 'news'),
  'World Cup Qualifying Match Ends in Upset',
  '2025-11-18',
  3,
  'positive',
  'Underdog team defeats tournament favorite in stunning qualifier victory.',
  'The surprising result reshuffles World Cup predictions as the underdog secured their spot with a last-minute goal. Fans celebrated in the streets as their team advanced to the tournament for the first time in 12 years.',
  0
),
(
  (SELECT id FROM lifelines WHERE slug = 'news'),
  'Cyber Attack Hits Financial Institutions',
  '2025-11-17',
  -8,
  'negative',
  'Coordinated hacking campaign targets multiple banks and payment processors.',
  'Security experts are investigating a sophisticated attack that temporarily disrupted online banking services for millions of customers. No customer data was reported stolen, but the incident raises concerns about financial infrastructure security.',
  0
),
(
  (SELECT id FROM lifelines WHERE slug = 'news'),
  'New Medical Treatment Approved',
  '2025-11-16',
  7,
  'positive',
  'Regulatory agency approves groundbreaking therapy for autoimmune disease.',
  'The innovative treatment uses gene editing technology to provide long-term relief for patients with a debilitating condition. Clinical trials showed remarkable success rates with minimal side effects.',
  0
),
(
  (SELECT id FROM lifelines WHERE slug = 'news'),
  'Housing Market Shows Signs of Cooling',
  '2025-11-15',
  -3,
  'negative',
  'Home sales decline as mortgage rates reach multi-year highs.',
  'Real estate data reveals a slowdown in the housing market with fewer transactions and longer listing times. Economists debate whether this signals a healthy correction or the start of a broader downturn.',
  0
),
(
  (SELECT id FROM lifelines WHERE slug = 'news'),
  'International Climate Summit Begins',
  '2025-11-14',
  5,
  'positive',
  'World leaders convene to discuss accelerated climate action plans.',
  'The summit brings together representatives from 150 nations to negotiate new emissions targets and climate financing mechanisms. Early discussions show promising consensus on key issues.',
  0
),
(
  (SELECT id FROM lifelines WHERE slug = 'news'),
  'Trade War Tensions Escalate',
  '2025-11-13',
  -6,
  'negative',
  'New tariffs announced in response to trade policy disputes.',
  'Economic analysts warn of potential global impacts as major trading partners impose retaliatory measures. Stock markets reacted negatively to the escalating trade tensions.',
  0
),
(
  (SELECT id FROM lifelines WHERE slug = 'news'),
  'Artistic Masterpiece Discovered in Attic',
  '2025-11-12',
  6,
  'positive',
  'Lost painting by Renaissance master found during estate cleaning.',
  'Art historians authenticated a painting worth an estimated $50 million that had been missing for over a century. The discovery was made by chance during a routine property evaluation.',
  0
),
(
  (SELECT id FROM lifelines WHERE slug = 'news'),
  'Veterans Day Ceremonies Honor Service Members',
  '2025-11-11',
  8,
  'positive',
  'Nation pays tribute to military veterans with ceremonies and parades.',
  'Communities across the country held events honoring past and present service members. The observances included wreath-laying ceremonies, military flyovers, and speeches by veteran advocates.',
  0
),
(
  (SELECT id FROM lifelines WHERE slug = 'news'),
  'Factory Fire Causes Evacuations',
  '2025-11-10',
  -4,
  'negative',
  'Industrial facility fire prompts temporary evacuations in surrounding area.',
  'Firefighters battled a three-alarm blaze at a chemical plant, leading authorities to evacuate nearby neighborhoods as a precaution. No injuries were reported, but environmental cleanup will take several weeks.',
  0
),
(
  (SELECT id FROM lifelines WHERE slug = 'news'),
  'Charity Telethon Raises Record Amount',
  '2025-11-09',
  5,
  'positive',
  'Annual fundraising event surpasses goal with $120 million in donations.',
  'The televised charity event featured celebrity performances and heartwarming stories of people helped by the organization. Organizers credited strong public support and corporate matching donations for the record-breaking total.',
  0
);