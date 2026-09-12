import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  aspectValidator,
  projectStatusValidator,
  shotStatusValidator,
  styleBibleValidator,
} from "./validators";

export default defineSchema({
  projects: defineTable({
    title: v.string(),
    sourcePrompt: v.string(),
    targetDurationMs: v.number(),
    aspect: aspectValidator,
    tone: v.string(),
    styleBible: styleBibleValidator,
    status: projectStatusValidator,
    logline: v.optional(v.string()),
    beats: v.array(
      v.object({
        t: v.string(),
        summary: v.string(),
      }),
    ),
    bedAudioStorageId: v.optional(v.id("_storage")),
    provider: v.union(v.literal("xai"), v.literal("fallback")),
    shareToken: v.string(),
    createdAt: v.number(),
    error: v.optional(v.string()),
  }).index("by_shareToken", ["shareToken"]),

  shots: defineTable({
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
    stillStorageId: v.optional(v.id("_storage")),
    audioStorageId: v.optional(v.id("_storage")),
    clipStorageId: v.optional(v.id("_storage")),
    falStillRequestId: v.optional(v.string()),
    error: v.optional(v.string()),
  })
    .index("by_project", ["projectId"])
    .index("by_project_and_index", ["projectId", "index"]),
});
