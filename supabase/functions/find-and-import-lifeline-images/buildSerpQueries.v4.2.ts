// buildSerpQueries.v4.2.ts — Universal, franchise-agnostic query builder for SerpAPI (Google Images)
// API stays the same: buildSerpQueries(input) -> [broad, context, domainBiased]; serpParams(q) -> params.

export type Inputs = {
  characterName: string;       // lifeline title or subject
  collectionTitle: string;     // may be a show/book/event or empty
  eventTitle: string;
  eventDetails: string;        // can include summary or details
  actorName?: string;          // optional
  type: "Person" | string;     // only "Person" supported
  collectionDomains?: string[];// optional override: ["nytimes.com","gettyimages.com", ...]
};

const STOPWORDS = new Set(["born","the","a","an","we","when","everything","giving","of","in","on","at"]);
const PRONOUNS  = new Set(["she","he","they","them","her","his","hers","its","it's","it",
                           "their","theirs","you","your","yours","i","me","my","mine","our","ours"]);
const DENY = new Set(["romance","lover","intimate moment"]);

// Safer, explicit triggers only (no vague sadness)
const TRIGGERS: Record<string, RegExp> = {
  combat:   /\b(trial|combat|fight|duel|battle|attack|skirmish)\b/i,
  death:    /\b(die[sd]?|death|killed|slain|murdered|funeral|corpse|grave|obituary)\b/i,
  politics: /\b(election|council|parliament|senate|congress|vote|throne|mayor|governor|president|prime minister)\b/i,
  career:   /\b(hired|joined|promoted|tenure|debut|contract|signed|acquired|opened|launched|IPO|merger)\b/i,
  award:    /\b(award|oscar|emmy|grammy|tony|nobel|pulitzer|ballon d'or|mvp|finalist|nominee)\b/i,
  sports:   /\b(match|final|tournament|league|championship|season|playoffs|cup)\b/i,
  stage:    /\b(concert|tour|performance|stage|theater|broadway|premiere|festival|setlist|duet|song)\b/i,
  travel:   /\b(arrival|departure|visit|tour|journey|roadshow|itinerary)\b/i,
  legal:    /\b(arrested|indicted|lawsuit|trial|verdict|settlement|pleaded)\b/i,
  tech:     /\b(product|launch|update|version|release|feature|beta|AI|model|GPU|API)\b/i,
};

const THEME_CUES: Record<string,string[]> = {
  combat:   ["battle scene","weapon"],
  death:    ["final moments","death scene"],
  politics: ["council","vote","press conference"],
  career:   ["promotion","announcement"],
  award:    ["award ceremony","red carpet"],
  sports:   ["final","trophy celebration"],
  stage:    ["stage","duet","song","spotlight"],
  travel:   ["arrival","public appearance"],
  legal:    ["court","trial"],
  tech:     ["product launch","demo"]
};

// Domains for domain-biased variant (auto-detect)
const DOMAINS_REAL = ["wikipedia.org","britannica.com","nytimes.com","gettyimages.com","reuters.com"];
const DOMAINS_MEDIA = ["imdb.com","fandom.com","variety.com","hollywoodreporter.com","rottentomatoes.com"];

// "Bad" domains to avoid in ranking (kept here if you later use ranker)
const BAD_DOMAINS = ["pinterest.com","shutterstock.com","aliexpress.com"];

function stripPossessives(s: string): string {
  return s.replace(/(\p{L}+)['']s\b/gu, "$1");
}

function tokenize(text: string): string[] {
  return text.replace(/[^\p{L}\p{N}\s'-]/gu, " ").split(/\s+/).filter(Boolean);
}

function cleanTokensKeepOrder(tokens: string[], extraStop: string[] = []): string[] {
  const ex = new Set(extraStop.map(x => x.toLowerCase()));
  return tokens
    .filter(t => !STOPWORDS.has(t.toLowerCase()))
    .filter(t => !PRONOUNS.has(t.toLowerCase()))
    .filter(t => !ex.has(t.toLowerCase()))
    .filter(t => /^[\p{L}\p{N}'-]{2,}$/u.test(t));
}

// Extract Proper Noun phrases (NER-ish): sequences of Capitalized Words or ALLCAPS/acronyms
function extractProperNouns(text: string): string[] {
  const phrases = new Set<string>();
  const pn = text.match(/\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\b/g) || [];
  for (const p of pn) phrases.add(p.trim());
  const acr = text.match(/\b([A-Z]{2,}(?:\s[A-Z]{2,})*)\b/g) || [];
  for (const a of acr) phrases.add(a.trim());
  return Array.from(phrases);
}

// Rank anchors by specificity & frequency (multi-word > single > acronym; more occurrences = higher)
function scoreAnchors(cands: string[], text: string): string[] {
  const lower = text.toLowerCase();
  const scored = cands.map(c => {
    const mw = c.trim().split(/\s+/).length;
    const freq = (lower.match(new RegExp(c.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"), "gi")) || []).length;
    const isAcr = /^[A-Z]{2,}(\s[A-Z]{2,})*$/.test(c);
    const spec = isAcr ? 1 : (mw >= 2 ? 3 : 2);
    return { c, s: spec*2 + Math.min(freq, 3) };
  });
  scored.sort((a,b) => b.s - a.s);
  return scored.map(x => x.c);
}

// Ensure at least N anchors; backfill from proper nouns
function ensureAnchors(anchors: string[], text: string, n = 2): string[] {
  if (anchors.length >= n) return anchors;
  const backfill = extractProperNouns(text).filter(p => !anchors.includes(p));
  return [...anchors, ...backfill].slice(0, Math.max(n, anchors.length));
}

// Detect "media/fiction" vs "real person" for domain bias
function isMediaContext(s: string): boolean {
  const t = s.toLowerCase();
  return /\b(season|episode|series|novel|film|movie|character|show|chapter|saga|franchise)\b/.test(t);
}

// Pick two different kinds of anchors if possible (person vs place/org/object) using crude heuristics
function anchorKindsLabel(a: string): "person"|"place"|"org"|"object"|"unknown" {
  if (/\b(inc|llc|ltd|corp|university|college|foundation|committee|party|government|department|ministry)\b/i.test(a)) return "org";
  if (/\b(city|university|college|park|hall|arena|stadium|center|centre|court|street|road|tower|bridge)\b/i.test(a)) return "place";
  if (/\b(award|trophy|statue|album|book|song|guitar|camera|microphone|throne|dagger)\b/i.test(a)) return "object";
  // "Likely person" if two capitalized words and not org/place-ish
  if (/^[A-Z][a-z]+(?:\s[A-Z][a-z]+)+$/.test(a)) return "person";
  return "unknown";
}

function pickDiversePair(anchors: string[]): string[] {
  if (anchors.length <= 1) return anchors;
  const labeled = anchors.map(a => ({ a, k: anchorKindsLabel(a) }));
  const person = labeled.find(x => x.k === "person");
  const place  = labeled.find(x => x.k === "place");
  const org    = labeled.find(x => x.k === "org");
  const object = labeled.find(x => x.k === "object");
  if (person && (place || org || object)) return [ (place||org||object)!.a, person.a ];
  // fallback: first two unique
  return [labeled[0].a, labeled[1].a];
}

function dedupeWordsPreserveOrder(words: string[]): string[] {
  const seen = new Set<string>(); const out: string[] = [];
  for (const w of words) if (!seen.has(w)) { seen.add(w); out.push(w); }
  return out;
}

function maybeYearToken(text: string): string | undefined {
  const m = text.match(/\b(19|20)\d{2}\b/);
  return m ? m[0] : undefined;
}

function capTokens(tokens: string[], max = 32): string[] {
  return tokens.slice(0, max);
}

export function buildSerpQueries(input: Inputs) {
  const { characterName, collectionTitle, eventTitle, eventDetails, actorName, type, collectionDomains } = input;
  if (type !== "Person") throw new Error("Only type=Person supported");

  // Subject (strip possessives, colons -> space)
  const subj = [characterName, collectionTitle.replace(/[:]/g," "), actorName]
    .filter((x): x is string => Boolean(x))
    .map(stripPossessives)
    .join(" ")
    .replace(/\s+/g," ")
    .trim();

  // Title tokens: preserve order, scrub stopwords/pronouns only
  const titleClean = stripPossessives(eventTitle);
  const titleTokens = cleanTokensKeepOrder(tokenize(titleClean));

  // Theme cues from event text (title + details)
  const baseText = `${eventTitle} ${eventDetails || ""}`;
  const themes = Object.keys(TRIGGERS).filter(k => TRIGGERS[k].test(baseText));
  let cueWords: string[] = [];
  for (const th of themes) for (const cue of (THEME_CUES[th] || [])) if (!cueWords.includes(cue)) cueWords.push(cue);
  cueWords = cueWords.filter(c => !DENY.has(c.toLowerCase()));

  // Anchors: start from proper nouns; score & ensure at least two
  let anchors = extractProperNouns(baseText);
  anchors = scoreAnchors(anchors, baseText);
  anchors = ensureAnchors(anchors, baseText, 2);

  // Optionally add a single year token (broad only)
  const year = maybeYearToken(baseText);

  const tail = "scene still screenshot";

  // Broad: subject + titleTokens + cues + anchors + (year?) + tail
  let broadParts = [subj, ...titleTokens, ...cueWords, ...anchors];
  if (year && !broadParts.includes(year)) broadParts.push(year);
  broadParts.push(tail);
  let broad = dedupeWordsPreserveOrder(broadParts.join(" ").split(/\s+/)).join(" ");
  broad = capTokens(broad.split(/\s+/)).join(" ");

  // Context: two diverse anchors
  const diverse = pickDiversePair(anchors);
  const context = dedupeWordsPreserveOrder([subj, ...diverse, "scene", "still"]).join(" ");

  // Domain-biased: choose domains
  const domains = collectionDomains && collectionDomains.length
    ? collectionDomains
    : (isMediaContext(collectionTitle + " " + eventDetails) ? DOMAINS_MEDIA : DOMAINS_REAL);
  const domainExpr = `site:${domains.join(" OR site:")}`;
  const domainBiased = [subj, ...diverse.slice(0,2), domainExpr].join(" ").replace(/\s+/g," ").trim();

  return [broad, context, domainBiased];
}

export function serpParams(q: string) {
  return { engine: "google_images", q, hl: "en", gl: "us", tbs: "itp:photos,isz:l" };
}