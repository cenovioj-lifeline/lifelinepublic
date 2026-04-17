/**
 * SourceBadge — renders a "From {Podcast} · {Date}" citation with an optional
 * "Listen at mm:ss" link for entries that came from a podcast/video source.
 *
 * Shown only when the entry has a source_extraction_id. Data sources:
 *   - entry.source_podcast_name
 *   - entry.source_episode_title
 *   - entry.source_episode_date (RFC 2822 string from RSS, e.g. "Wed, 18 Jan 2023 11:00:00 -0000")
 *   - entry.details.source_timestamp_display (backfilled, e.g. "3:50")
 *
 * MVP: link target is a Google search for the episode. V2 (TBD): in-site
 * audio player with auto-seek. See docs/podcast-pointer-spec.md.
 *
 * Backfill coverage: 50/800 Prof G entries have this data today. Grows as
 * SI → LP pipeline produces entries with source_extraction_id references.
 *
 * NOT YET WIRED into an entry-rendering component. The spec calls for mounting
 * this inside the existing entry card/detail view wherever entries render on
 * collection and lifeline pages. See spec for placement details.
 */

import React from 'react';

type SourceBadgeEntry = {
  source_extraction_id?: string | null;
  source_podcast_name?: string | null;
  source_episode_title?: string | null;
  source_episode_date?: string | null;
  details?: {
    source_timestamp_display?: string;
    source_timestamp_start_seconds?: number;
    source_rss_url?: string;
  } | null;
};

function formatEpisodeDate(rfc2822: string | null | undefined): string {
  if (!rfc2822) return '';
  const d = new Date(rfc2822);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function buildSearchUrl(podcastName: string | null | undefined, episodeTitle: string | null | undefined): string {
  const q = [podcastName, episodeTitle]
    .filter(Boolean)
    .map(s => `"${s}"`)
    .join(' ');
  return `https://www.google.com/search?q=${encodeURIComponent(q)}`;
}

export function SourceBadge({ entry }: { entry: SourceBadgeEntry }) {
  if (!entry?.source_extraction_id) return null;

  const podcastName = entry.source_podcast_name;
  const episodeTitle = entry.source_episode_title;
  const episodeDateDisplay = formatEpisodeDate(entry.source_episode_date);
  const timestamp = entry.details?.source_timestamp_display;
  const searchUrl = buildSearchUrl(podcastName, episodeTitle);

  return (
    <div className="mt-3 rounded-md border border-border/60 bg-muted/40 p-3 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span role="img" aria-label="microphone">🎙</span>
        <span className="font-medium">From {podcastName}</span>
        {episodeDateDisplay && (
          <>
            <span aria-hidden>·</span>
            <span>{episodeDateDisplay}</span>
          </>
        )}
      </div>
      {episodeTitle && (
        <div className="mt-1 text-foreground">{episodeTitle}</div>
      )}
      <div className="mt-1.5 flex items-center gap-3 text-muted-foreground">
        {timestamp && (
          <span className="font-mono text-xs">Listen at {timestamp}</span>
        )}
        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs underline underline-offset-2 hover:text-foreground"
        >
          find episode →
        </a>
      </div>
    </div>
  );
}

export default SourceBadge;
