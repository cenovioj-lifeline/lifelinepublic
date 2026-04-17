# Podcast-Pointer Feature Spec

**Status:** Spec ready for build. Data is backfilled and ready.
**Owner thread:** [6B] Prof G Media Site Build
**Date:** 2026-04-16

---

## What it is

For any entry with a `source_extraction_id` (i.e., sourced from a podcast episode or YouTube video), the entry display shows:
1. A small "From {Podcast Name}" badge with episode title + air date
2. A "Listen at {mm:ss}" button that takes the user to the episode at the exact timestamp

Users don't have to fish around to find "what episode did Scott say that on?" — the site tells them and lets them jump.

## Why it matters

LP's value prop shifts from "read a summary" to "read a summary and hear the source." That's the "index yourself" experience the user wants. It's also the feature that makes LP genuinely useful for fans who already know the shows — they can use LP to find clips they want to re-hear.

## Current data availability

| Data point | Source | Status |
|---|---|---|
| `source_extraction_id` | LP `entries` column | 50 / 800 Prof G entries (6.25%) |
| Episode title, air date, podcast name | LP `entries` (`source_episode_title`, `source_episode_date`, `source_podcast_name`) | All 50 |
| Timestamp start/end seconds | Backfilled to `entries.details.source_timestamp_*_seconds` on 2026-04-16 | All 50 |
| Human-readable timestamp | Backfilled to `entries.details.source_timestamp_display` | All 50 |
| Episode duration | `entries.details.source_episode_duration_seconds` | All 50 |
| Podcast RSS URL | `entries.details.source_rss_url` | All 50 |

**Coverage gap:** Only 50 of 800 entries have this data. As daily ingest produces new extractions and LP generates new entries referencing them, coverage grows organically. Backfill for historical entries requires matching title/content to SI extractions — out of scope for this spec.

## URL construction — pick one

We need a URL that takes the user to the episode at a timestamp. Options, ranked:

### Option A: In-site web player (best UX, most work)
- Build a minimal HTML5 audio player component at `/listen/:entryId`
- Player loads the episode's MP3 (either from RSS enclosure URL or re-fetch via Megaphone)
- Auto-seeks to `start_seconds` on load
- User stays on LP
- **Pros:** Full control, universal, keeps user on site, works for Prof G-specific audio pipeline
- **Cons:** Need to either (a) store enclosure URLs at SI ingest time (not currently done) or (b) re-fetch RSS to map episode_id → enclosure URL
- **Effort:** 4-6 hours

### Option B: Apple Podcasts deep link (simple, partial UX)
- URL pattern: `https://podcasts.apple.com/us/podcast/{slug}/id{podcast_id}?i={episode_id}&at=1000lA1V5`
- **Blocker:** Apple Podcasts' iTunes podcast ID and episode ID aren't in our DB. Would need mapping layer per podcast.
- Timestamp support: Limited. Only via Apple-specific params.
- **Effort:** 2-3 hours per podcast source to set up

### Option C: Generic episode web page with text timestamp (pragmatic MVP)
- Link to a Google search for `"{podcast_name}" "{episode_title}"`
- Google typically surfaces the episode's page on profgmedia.com, Apple Podcasts, Spotify, etc.
- Display the timestamp AS TEXT next to the link: "Listen at 3:50"
- User can't auto-jump, but they see what to look for
- **Pros:** Works today, zero infrastructure, no per-episode mapping
- **Cons:** No auto-seek. Two taps (search → site → scrub to 3:50) instead of one
- **Effort:** 30 min

### Option D: Overcast deep link (podcast-app-specific)
- URL pattern: `overcast.fm/+{guid}/{seconds}` — seeks to timestamp if user has Overcast
- Would need episode GUID from RSS (retrievable, not currently stored)
- **Effort:** 3-4 hours (needs RSS re-parse)

## Recommendation

**Ship Option C now. Upgrade to Option A later.**

Option C gets us the provenance display + text-timestamp to 50 entries this week. Option A upgrades the jump-to-moment UX when audio enclosure URLs are wired into SI ingest.

Phasing:
1. **MVP (this thread):** Option C — display badge, episode, date, text timestamp, Google-search fallback link
2. **V2 (next thread):** Option A — in-site player. Requires SI pipeline change to capture enclosure URLs.

## UI spec (MVP)

```
┌───────────────────────────────────────────────────────────┐
│ {Entry title}                                              │
│ {Entry summary/details}                                    │
│                                                            │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ 🎙 From Pivot · Jan 18, 2023                          │ │
│ │ Live from London: Recession Calling?                  │ │
│ │ Listen at 3:50  →  [search episode]                   │ │
│ └───────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────┘
```

Component: `<SourceBadge entry={entry} />` — renders only when `entry.source_extraction_id` is present.

Data access: component reads `entry.source_podcast_name`, `entry.source_episode_title`, `entry.source_episode_date`, and `entry.details.source_timestamp_display` (all already in DB).

Link URL: `https://www.google.com/search?q=${encodeURIComponent('"' + podcast_name + '" "' + episode_title + '"')}`

Style: light border, podcast mic emoji, monospace for timestamp, subtle. Should feel like a citation, not an ad.

## Build steps (for next session)

1. Create `src/components/SourceBadge.tsx` in `~/Claude-Projects/WebApps/LifelinePublic/`
2. Add conditional render in existing entry display component (find via `EntryCard.tsx` or wherever entries render on collection page)
3. Test on the live Prof G collection — verify 50 entries show the badge
4. Deploy to main
5. Verify on lifelinepublic.com/collections/prof-g-media

## Out of scope for MVP

- In-site audio player
- Apple Podcasts / Spotify / Overcast deep links
- Retroactive mapping for the other 750 Prof G entries (no source_extraction_id to match to)
- YouTube video timestamp links (no Prof G YouTube extractions in LP today — all 50 are podcast-sourced)

## Backfill note

The 50 entries were backfilled on 2026-04-16 via a script in the [6B] thread session. Script should be wrapped in `production/` for repeat use on other collections:
- Takes a collection slug
- Finds all entries with `source_extraction_id`
- Joins to SI `extractions` + `episodes` + `podcasts`
- Writes timestamp fields into `entries.details`

Not yet productized. Quick one-off sufficed for Prof G. Backlog item in LP Pipeline.
