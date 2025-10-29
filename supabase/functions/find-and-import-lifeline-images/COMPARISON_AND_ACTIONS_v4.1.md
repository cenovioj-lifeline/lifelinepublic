# Lovable SerpAPI Integration – Comparison & Actions (v4.1)

This note summarizes how the current Lovable output compared to the intended Guide v4 behavior, and introduces **v4.1** which adds collection-aware logic to fix the mismatches we saw.

---

## 1) What We Tested
**Subject:** Glinda Upland (Wicked: Defying Gravity)  
**Artifacts:** 
- Inputs: `glinda-upland-from-popular-to-good-lifeline-1761754442423.md`
- Lovable queries: `query-preview-1761754437177.md`
- Expected logic: Guide v4 + `buildSerpQueries.ts`

---

## 2) High-Level Scorecard

| Category | Result |
|----------|--------|
| 3 variants per event | ✅ correct (broad, context, domain) |
| Tail phrases (“scene still…”) | ✅ present |
| Subject anchoring (character + collection) | ✅ present |
| Token sanitation (colons/duplication) | ⚠️ colon left in, dup tokens appeared |
| Anchor enforcement (≥2) | ❌ often insufficient |
| Theme cue relevance | ❌ “GoT” magic cues leaked into “Wicked” |
| Domain bias | ⚠️ used HBO/IMDB/Fandom by default; not musical/Oz-specific |
| Universe awareness | ❌ incorrect: warging/weirwood/ravens in Oz |

---

## 3) Concrete Examples

### The Wizard’s True Nature
- **Lovable query:** includes `weirwood, warging, raven` (GoT cues)  
- **Expected (Wicked/Oz cues):** `Wizard Elphaba Morrible chamber truth` with musical/stage props when appropriate

### Ruling Oz
- **Lovable query:** same GoT magic cues misfired  
- **Expected:** Oz governance anchors like `Emerald City, throne, council, public address`

### For Good
- **Lovable query:** missed duet/parting cues  
- **Expected:** `duet, goodbye, friendship, song`

---

## 4) Root Cause
Guide v4 was **universe-agnostic**; the event text triggers generic “magic/vision” terms that the builder mapped to **GoT-style** cues. That contaminates non-GoT collections (e.g., Wicked) with irrelevant tokens and hurts precision.

---

## 5) What v4.1 Changes
**New: `collection profiles`** that switch **domains, anchors, and theme cue dictionaries** based on the collection title.  
Included profiles:
- **Game of Thrones/Westeros/ASOIAF**  
- **Wicked/Oz/Emerald City**

(Profiles can be easily extended for Marvel, Star Wars, The Office, etc.)

### Effects
- **No more “warging/weirwood” in Wicked**
- **Musical/Oz anchors** (Emerald City, Shiz University, Morrible, Wizard of Oz, broom, wand, duet, stage)
- **Domain bias** uses `wickedthemusical.com`, `broadway.com`, `playbill.com`, `fandom.com`, `universalpictures.com`
- **Colon scrub** (e.g., `Wicked: Defying Gravity` → `Wicked Defying Gravity`)
- **Duplicate token suppression**

---

## 6) How to Adopt v4.1
1. **Replace** your current `buildSerpQueries.ts` with **`buildSerpQueries.v4.1.ts`** (rename to `buildSerpQueries.ts` in your codebase).  
2. Keep using the same `serpParams(q)` and `rankResults.ts`.  
3. Optional: add more **collection profiles** (Marvel, Star Wars, The Office) by:
   - setting `domains`,
   - extending `anchors`,
   - and overriding `themeMap` for relevant themes.

---

## 7) Quick QA Checklist (unchanged + new)
- [ ] `type: "Person"` → **character + collection appear in every query**  
- [ ] **≥2 anchors** present; fallback capitalized noun extraction runs if needed  
- [ ] **Deny-list** enforced (`romance/lover/intimate moment`)  
- [ ] **Collection profile** engaged (domains/anchors/themeMap reflect the universe)  
- [ ] **Colon removed** from collection titles in output queries  
- [ ] **Broad** ends with `scene still screenshot`; **Context** uses strongest 2 anchors; **Domain** uses `site:` list from profile  
- [ ] Pass results to `rankResults.ts` and keep top **3–6** unique originals (≥1200px wide preferred; avoid Pinterest/Shutterstock/Aliexpress)  

---

## 8) Example (Wicked – “The Emerald City Invitation”)

**v4.1 Broad (expected)**
