/**
 * Video Lifeline components — pure presentational copies of the production
 * lifeline rendering, adapted for use in Remotion video compositions.
 *
 * See thread [2G-C] "UI to Video Pipeline" / Track C in the OpenClaw vault
 * for context, decisions, and drift policy.
 */

export { VideoLifelineViewer } from "./VideoLifelineViewer";
export type {
  VideoLifelineViewerProps,
  VideoLifelineEntry,
  VideoLifeline,
} from "./VideoLifelineViewer";

export { VideoLifelineMobileViewer } from "./VideoLifelineMobileViewer";
export type { VideoLifelineMobileViewerProps } from "./VideoLifelineMobileViewer";
