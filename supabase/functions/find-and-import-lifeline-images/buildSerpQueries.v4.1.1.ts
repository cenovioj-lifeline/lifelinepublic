// buildSerpQueries.v4.1.1.ts — collection-aware query builder for SerpAPI (Google Images)
// Patches over v4.1:
// 1) Pronoun/determiner scrub  2) Possessive handling  3) Preserve title order (no weird "Shine Born")
// 4) Context variant enforces >=2 anchors, prefer place/object + person
// 5) Guard 'death' cues (only on explicit tokens)  6) Musical soft-cues for certain titles
// 7) Final dedupe across tokens

export type Inputs = {
  characterName: string;
  collectionTitle: string;   // e.g., "Wicked: Defying Gravity"
  eventTitle: string;
  eventDetails: string;
  actorName?: string;
  type: "Person" | string;
};

const STOPWORDS = new Set([
  "born","the","a","an","we","when","everything","giving"
]);

// NEW: pronouns/determiners get scrubbed from tokens
const PRONOUNS = new Set([
  "she","he","they","them","her","his","hers","its","it's","it","their","theirs","you","your","yours","i","me","my","mine","our","ours"
]);

const DENY = new Set(["romance","lover","intimate moment"]);

// ---------- DEFAULT (fallback) ANCHORS & THEMES ----------
const DEFAULT_ENTITY_ANCHORS = [
  "council","throne room","castle","tournament","arena","champion",
  "vision","prophecy","ritual","forest","ravens","dagger","sword"
];

const DEFAULT_THEME_MAP: Record<string, string[]> = {
  combat:   ["trial by combat","duel","arena","battle scene","weapon"],
  death:    ["death scene","falling","final moments"],
  magic:    ["visions","magic","transformation","ritual","prophecy"],
  politics: ["council","throne room","court","coronation"],
  allies:   ["companions","journey","group","reunion"],
  travel:   ["journey","traveling","exploration","landscape"],
  religion: ["ritual","vision","temple","prophecy"],
  betrayal: ["betrayal","revenge scene"]
};

const DEFAULT_BIASED_DOMAINS = ["imdb.com","fandom.com"];

// ---------- COLLECTION PROFILES ----------
type Profile = {
  match: (collectionTitle: string) => boolean;
  domains: string[];
  anchors: string[];
  themeMap?: Partial<Record<keyof typeof DEFAULT_THEME_MAP, string[]>>;
  extraStop?: string[];
  // classify anchors to help pick place/object + person for context variant
  anchorKinds?: Record<"place"|"person"|"object", string[]>;
};

// Game of Thrones
const PROFILE_GOT: Profile = {
  match: t => /game\s*of\s*thrones|westeros|asoiaf/i.test(t),
  domains: ["hbo.com","imdb.com","fandom.com"],
  anchors: [
    "Winterfell","godswood","Dragonpit","Tower of Joy","Craster's Keep","weirwood","cave",
    "Hodor","Jojen Reed","Meera Reed","Three-Eyed Raven","Night King","Arya Stark","Jon Snow","Tyrion","Cersei","Jaime",
    "Valyrian steel dagger","ravens","dragons","The Wall","King's Landing"
  ],
  themeMap: {
    magic: ["visions","magic","weirwood","raven","warging","godswood"]
  },
  anchorKinds: {
    place: ["Winterfell","godswood","Dragonpit","Tower of Joy","Craster's Keep","The Wall","King's Landing","weirwood","cave"],
    person:["Hodor","Jojen Reed","Meera Reed","Three-Eyed Raven","Night King","Arya Stark","Jon Snow","Tyrion","Cersei","Jaime"],
    object:["Valyrian steel dagger","ravens","dragons"]
  }
};

// Wicked (Oz / Musical)
const PROFILE_WICKED: Profile = {
  match: t => /wicked|oz|emerald\s*city/i.test(t),
  domains: ["wickedthemusical.com","broadway.com","playbill.com","imdb.com","fandom.com","universalpictures.com"],
  anchors: [
    "Emerald City","Shiz University","Ozdust Ballroom","Munchkinland","Yellow Brick Road","Glinda's Bubble",
    "Glinda","Elphaba","Fiyero","Nessarose","Madame Morrible","The Wizard of Oz",
    "wand","broom","spellbook","throne","bubble","stage","duet","song","spotlight"
  ],
  themeMap: {
    magic:     ["spell","wand","broom","bubble","stage effect","transformation"],
    politics:  ["council","public address","leadership","throne","Emerald City"],
    allies:    ["companions","duet","friendship","reunion"],
    travel:    ["journey","Yellow Brick Road","arrival","Emerald City"],
  },
  extraStop: [":"],
  anchorKinds: {
    place: ["Emerald City","Shiz University","Ozdust Ballroom","Munchkinland","Yellow Brick Road"],
    person:["Glinda","Elphaba","Fiyero","Nessarose","Madame Morrible","The Wizard of Oz"],
    object:["wand","broom","spellbook","throne","bubble","stage","duet","song","spotlight"]
  }
};

const PROFILES: Profile[] = [PROFILE_GOT, PROFILE_WICKED];

// ---------- HELPERS ----------
function findProfile(collectionTitle: string): Profile | undefined {
  return PROFILES.find(p => p.match(collectionTitle));
}

// Possessive handling: "Fiyero's Arrival" -> "Fiyero Arrival"
function stripPossessives(s: string): string {
  return s.replace(/(\p{L}+)'s\b/gu, "$1").replace(/(\p{L}+)’s\b/gu, "$1");
}

function tokenize(text: string): string[] {
  return text
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function sanitizeTokens(tokens: string[], extraStop: string[] = []): string[] {
  const EX = new Set(extraStop.map(s => s.toLowerCase()));
  return tokens
    .map(t => t.trim())
    // lowercase check for scrubs
    .filter(t => !STOPWORDS.has(t.toLowerCase()))
    .filter(t => !PRONOUNS.has(t.toLowerCase()))
    .filter(t => !EX.has(t.toLowerCase()));
}

const TRIGGERS: Record<string, RegExp> = {
  combat:   /\b(trial|combat|fight|duel|battle|skirmish|attack)\b/i,
  // PATCH 5: make death stricter (explicit words only)
  death:    /\b(die[sd]?|death|killed|slain|funeral|corpse|grave)\b/i,
  magic:    /\b(vision|spell|magic|enchanted|warg|greenseer|dream|power|raven|weirwood|godswood|broom|wand|bubble)\b/i,
  politics: /\b(king|queen|council|throne|ruler|elect|election|coronation|dragonpit|mayor|leadership|address)\b/i,
  allies:   /\b(meeting|friend|ally|companion|protect|reunion|group|companions?|duet)\b/i,
  travel:   /\b(journey|travel|beyond|arriv|explor|road)\b/i,
  religion: /\b(god|faith|ritual|temple|prophec|vision|church)\b/i,
  betrayal: /\b(betray|revenge|vengeance|frame|accuse)\b/i
};

function findThemes(text: string): string[] {
  return Object.keys(TRIGGERS).filter(k => TRIGGERS[k].test(text));
}

function pickThemeCues(themes: string[], themeMap: Record<string, string[]>): string[] {
  const list: string[] = [];
  for (const th of themes) {
    for (const c of themeMap[th] || []) {
      if (!list.includes(c)) list.push(c);
    }
  }
  return list.slice(0, 6);
}

function harvestEntityAnchors(text: string, anchors: string[]): string[] {
  const found: string[] = [];
  for (const a of anchors) {
    const rx = new RegExp(`\\b${a.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}\\b`, "i");
    if (rx.test(text) && !found.includes(a)) found.push(a);
  }
  return found;
}

function enforceMinimumAnchors(anchors: string[], extraText: string, min = 2): string[] {
  if (anchors.length >= min) return anchors;
  // fallback: pull capitalized phrases
  const caps = (extraText.match(/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\b/g) || []);
  for (const c of caps) {
    if (!anchors.includes(c)) anchors.push(c);
    if (anchors.length >= min) break;
  }
  return anchors;
}

function removeDenied(texts: string[]): string[] {
  return texts.filter(t => !DENY.has(t.toLowerCase()));
}

function normalizeSpaces(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function dedupeWordsPreserveOrder(words: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of words) {
    if (!seen.has(w)) { seen.add(w); out.push(w); }
  }
  return out;
}

// PATCH 6: soft musical cues for certain title keywords
const TITLE_SOFT_CUES: { rx: RegExp; cues: string[] }[] = [
  { rx: /\b(popular|born to shine|for good|defy|defying|dance|dancing|song|duet)\b/i, cues: ["stage","duet","song","spotlight"] },
  { rx: /\b(invitation|address|speech)\b/i, cues: ["public address","stage"] },
];

function maybeAddTitleSoftCues(title: string, cues: string[]): string[] {
  const out = cues.slice();
  for (const rule of TITLE_SOFT_CUES) {
    if (rule.rx.test(title)) {
      for (const c of rule.cues) if (!out.includes(c)) out.push(c);
    }
  }
  return out;
}

// pick 2 "strongest" anchors, prefer place/object + person
function pickStrongAnchors(anchors: string[], kinds?: Profile["anchorKinds"]): string[] {
  if (!anchors.length) return [];
  if (!kinds) return anchors.slice(0, 2);

  const place = anchors.find(a => kinds.place?.includes(a));
  const obj   = anchors.find(a => kinds.object?.includes(a));
  const person= anchors.find(a => kinds.person?.includes(a));
  const result: string[] = [];

  if (place && person) return [place, person];
  if (obj && person)   return [obj, person];

  // otherwise, just take first two available
  return anchors.slice(0, 2);
}

// ---------- PUBLIC API ----------
export function buildSerpQueries(input: Inputs) {
  const { characterName, collectionTitle, eventTitle, eventDetails, actorName, type } = input;
  if (type !== "Person") throw new Error("buildSerpQueries only supports type=Person");

  const profile = findProfile(collectionTitle);
  const extraStops = profile?.extraStop ?? [];

  // Subject string: colon -> space, strip possessives from subject parts too
  const cleanCollection = stripPossessives(collectionTitle.replace(/[:]/g, " "));
  const cleanCharacter  = stripPossessives(characterName);
  const subject = [cleanCharacter, cleanCollection, actorName ? stripPossessives(actorName) : ""]
    .filter(Boolean)
    .join(" ");

  // Title: strip possessives, keep ORIGINAL ORDER, then sanitize by removing stopwords/pronouns only
  const titleClean = stripPossessives(eventTitle);
  const titleTokensOrdered = tokenize(titleClean);
  const titleTokens = sanitizeTokens(titleTokensOrdered, extraStops)
    .filter(t => t.length > 1 && /^[a-zA-Z'-]+$/.test(t)); // keep readable words only

  const baseText = `${eventTitle} ${eventDetails}`;

  // Theme cues (collection-aware overrides)
  const effectiveThemeMap = { ...DEFAULT_THEME_MAP, ...(profile?.themeMap ?? {}) } as Record<string, string[]>;
  const themes = findThemes(baseText);
  let cueWords = pickThemeCues(themes, effectiveThemeMap);
  cueWords = removeDenied(cueWords);
  // soft musical cues from title keywords
  cueWords = maybeAddTitleSoftCues(eventTitle, cueWords);

  // Anchors from event text (profile + default fallback)
  const anchorUniverse = [...(profile?.anchors ?? []), ...DEFAULT_ENTITY_ANCHORS];
  let anchors = harvestEntityAnchors(baseText, anchorUniverse);
  anchors = enforceMinimumAnchors(anchors, baseText, 2);

  const genericTail = "scene still screenshot";

  // 1) Broad — preserve order: [subject] + [titleTokens] + [cues] + [anchors] + tail
  const broadParts = [
    subject,
    ...titleTokens,
    ...cueWords,
    ...anchors,
    genericTail
  ];
  const broad = normalizeSpaces(dedupeWordsPreserveOrder(broadParts.join(" ").split(/\s+/)).join(" "));

  // 2) Context — enforce >=2 anchors, prefer place/object + person
  const strongPair = pickStrongAnchors(anchors, profile?.anchorKinds);
  let contextAnchors = strongPair.length >= 2 ? strongPair : enforceMinimumAnchors(strongPair, baseText, 2);
  const contextParts = [subject, ...contextAnchors, "scene", "still"];
  const context = normalizeSpaces(dedupeWordsPreserveOrder(contextParts).join(" "));

  // 3) Domain-biased — profile-specific domains
  const domains = (profile?.domains ?? DEFAULT_BIASED_DOMAINS);
  const domainExpr = `site:${domains.join(" OR site:")}`;
  const domainBiased = normalizeSpaces(`${subject} ${contextAnchors.slice(0,2).join(" ")} ${domainExpr}`);

  return [broad, context, domainBiased];
}

export function serpParams(q: string) {
  return {
    engine: "google_images",
    q,
    hl: "en",
    gl: "us",
    tbs: "itp:photos,isz:l"
  };
}
