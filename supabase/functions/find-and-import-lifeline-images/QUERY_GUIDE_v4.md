# Lovable -> SerpAPI Image Query Guide (v4)

Goal: Generate scene-accurate, character-centered, high-quality stills for lifelines of type "Person" by turning each event into three strong SerpAPI queries.
What's new in v4: regex sanitizer, >=2-anchor enforcement, refined theme guardrails, better examples, and a ready-to-drop TypeScript helper.

---

## 0) TL;DR Implementation Order
1. Inputs (per event): characterName, collectionTitle, eventTitle, eventDetails, optional actorName, type (must be "Person").
2. Run extract + sanitize + enforce to get cue words and anchors.
3. Build 3 query variants (broad / context-focused / domain-biased).
4. Call SerpAPI with:
   {"engine":"google_images","hl":"en","gl":"us","tbs":"itp:photos,isz:l"}
5. Rank results (domain > width > title includes subject > sane aspect ratio).
6. Return top 3–6 URLs.

---

## 1) Required Inputs
characterName (e.g., "Bran Stark")
collectionTitle (e.g., "Game of Thrones")
eventTitle (e.g., "Warging During the Battle")
eventDetails (e.g., "...wargs into ravens during Battle of Winterfell...")
actorName (optional)
type (must be "Person")

---

## 2) Cue Extraction (Themes) & Anchors
Themes -> Cues
- Combat/trial: trial by combat, duel, arena, battle scene, weapon
- Injury/death/fall/poison: death scene, falling, final moments
- Magic/vision/warging: visions, magic, transformation, weirwood, raven, warging, godswood
- Politics/royalty/court: council, throne room, court, Dragonpit, coronation
- Allies/journey: companions, journey, group, reunion
- Betrayal/revenge: betrayal, revenge scene
- Travel/discovery: journey, traveling, exploration, landscape
- Religion/ritual/prophecy: ritual, vision, temple, prophecy

Fantasy Anchors (examples) - use when present:
Winterfell, Hodor, Jojen, Meera, Craster's Keep, Children of the Forest, Three-Eyed Raven, Night King, Arya, Sansa, Jon Snow, Tyrion, Cersei, Jaime, Valyrian steel dagger, Tower of Joy, Dragonpit, godswood, ravens

Deny-list (never add unless explicitly present): romance, lover, intimate moment

Stopword scrub: remove title filler like Born, The, A, An, We, When, Everything, Giving (unless part of a proper noun).

Minimum anchors: After extraction, ensure >= 2 event-specific anchors (places/people/objects). If fewer, backfill from nouns in the event text using the order: places -> people -> objects.

---

## 3) Query Variants (always build 3)
1) Broad:
   <characterName> <collectionTitle> (+actorName?) + <cue words> + "scene still screenshot"
2) Context-focused:
   <characterName> <collectionTitle> + <2 strongest anchors> + "scene still"
3) Domain-biased:
   <characterName> <collectionTitle> + <2 strongest anchors> + "site:hbo.com OR site:imdb.com OR site:fandom.com"
(Swap the domain list per franchise.)

Do not use punctuation or quotes in q.

---

## 4) SerpAPI Parameters
{
  "engine": "google_images",
  "q": "<your query>",
  "hl": "en",
  "gl": "us",
  "tbs": "itp:photos,isz:l"
}
Optional: "ijn":"1" (page 2). Use "as_rights" only when you truly need license filters.

---

## 5) Ranking (client-side, optional but recommended)
1. URL domain priority (hbo, imdb, fandom; then vulture, vanityfair, nytimes).
2. width >= 1200.
3. Title contains characterName or collectionTitle.
4. Aspect ratio 1.3–2.0.
5. Penalize pinterest, shutterstock, aliexpress.

---

## 6) Example (Bran - Warging During the Battle)
Ideal q:
Bran Stark Game of Thrones warging ravens Battle of Winterfell Night King godswood scene still screenshot

SerpAPI request:
{"engine":"google_images","q":"Bran Stark Game of Thrones warging ravens Battle of Winterfell Night King godswood scene still screenshot","hl":"en","gl":"us","tbs":"itp:photos,isz:l"}

---

## 7) Drop-in TypeScript Helper (buildSerpQueries.ts)
(See the .ts file included next to this guide.)

---

## 8) Debug Logging (recommended)
Emit this alongside queries so you can inspect and fix mapping quickly:
{
  "characterName": "...",
  "collectionTitle": "...",
  "eventTitle": "...",
  "eventDetails": "...",
  "queries": ["...", "...", "..."]
}

---

## 9) Quality Checklist (pre-send)
- Person? include character + collection in every q
- Deny-list enforced (no romance/lover/intimate moment unless explicit)
- >= 2 anchors present (places/people/objects)
- For visions/warging -> prefer weirwood, ravens, godswood, Night King
- Parentage -> add Rhaegar, Lyanna, Tower of Joy
- Return to Winterfell -> courtyard, wheelchair
- Election -> council, Dragonpit, vote
- Tail: "scene still screenshot"
- SerpAPI params include tbs="itp:photos,isz:l"

Version: 4.0
Author: Custom guide for Lovable Lifeline -> SerpAPI
Objective: Higher precision images with minimal developer tuning.
