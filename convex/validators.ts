import { v } from "convex/values";

export const aspectValidator = v.union(
  v.literal("9:16"),
  v.literal("16:9"),
  v.literal("1:1"),
);

export const projectStatusValidator = v.union(
  v.literal("planning"),
  v.literal("boarding"),
  v.literal("generating"),
  v.literal("ready"),
  v.literal("failed"),
);

export const shotStatusValidator = v.union(
  v.literal("planning"),
  v.literal("queued"),
  v.literal("generating_still"),
  v.literal("still_ready"),
  v.literal("generating_audio"),
  v.literal("audio_ready"),
  v.literal("generating_motion"),
  v.literal("complete"),
  v.literal("failed"),
);

export const styleBibleValidator = v.object({
  look: v.string(),
  palette: v.string(),
  camera: v.string(),
  references: v.array(v.string()),
});

export const beatValidator = v.object({
  t: v.string(),
  summary: v.string(),
});

export const plannedShotValidator = v.object({
  index: v.number(),
  title: v.string(),
  durationMs: v.number(),
  camera: v.string(),
  action: v.string(),
  dialogue: v.union(v.string(), v.null()),
  visualPrompt: v.string(),
  negativePrompt: v.string(),
});

export const boardResultValidator = v.object({
  title: v.string(),
  logline: v.string(),
  styleBible: styleBibleValidator,
  beats: v.array(beatValidator),
  shots: v.array(plannedShotValidator),
});

export const publicShotValidator = v.object({
  _id: v.id("shots"),
  projectId: v.id("projects"),
  index: v.number(),
  title: v.string(),
  camera: v.string(),
  action: v.string(),
  dialogue: v.optional(v.string()),
  visualPrompt: v.string(),
  negativePrompt: v.string(),
  durationMs: v.number(),
  status: shotStatusValidator,
  stillUrl: v.union(v.string(), v.null()),
  audioUrl: v.union(v.string(), v.null()),
  clipUrl: v.union(v.string(), v.null()),
  error: v.optional(v.string()),
});

export const publicProjectValidator = v.object({
  _id: v.id("projects"),
  title: v.string(),
  sourcePrompt: v.string(),
  targetDurationMs: v.number(),
  aspect: aspectValidator,
  tone: v.string(),
  styleBible: styleBibleValidator,
  status: projectStatusValidator,
  logline: v.optional(v.string()),
  beats: v.array(beatValidator),
  provider: v.union(v.literal("xai"), v.literal("fallback")),
  shareToken: v.string(),
  createdAt: v.number(),
  error: v.optional(v.string()),
  shots: v.array(publicShotValidator),
});
