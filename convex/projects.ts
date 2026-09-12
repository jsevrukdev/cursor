import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { aspectValidator, publicProjectValidator } from "./validators";
import type { Doc } from "./_generated/dataModel";

async function shotToPublic(
  ctx: { storage: { getUrl: (id: NonNullable<Doc<"shots">["stillStorageId"]>) => Promise<string | null> } },
  shot: Doc<"shots">,
) {
  return {
    _id: shot._id,
    projectId: shot.projectId,
    index: shot.index,
    title: shot.title,
    camera: shot.camera,
    action: shot.action,
    dialogue: shot.dialogue,
    visualPrompt: shot.visualPrompt,
    negativePrompt: shot.negativePrompt,
    durationMs: shot.durationMs,
    status: shot.status,
    stillUrl: shot.stillStorageId
      ? await ctx.storage.getUrl(shot.stillStorageId)
      : null,
    audioUrl: shot.audioStorageId
      ? await ctx.storage.getUrl(shot.audioStorageId)
      : null,
    clipUrl: shot.clipStorageId
      ? await ctx.storage.getUrl(shot.clipStorageId)
      : null,
    error: shot.error,
  };
}

export const getBoard = query({
  args: { projectId: v.id("projects") },
  returns: v.union(publicProjectValidator, v.null()),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      return null;
    }
    const shots = await ctx.db
      .query("shots")
      .withIndex("by_project_and_index", (q) => q.eq("projectId", args.projectId))
      .take(16);
    shots.sort((a, b) => a.index - b.index);
    return {
      _id: project._id,
      title: project.title,
      sourcePrompt: project.sourcePrompt,
      targetDurationMs: project.targetDurationMs,
      aspect: project.aspect,
      tone: project.tone,
      styleBible: project.styleBible,
      status: project.status,
      logline: project.logline,
      beats: project.beats,
      provider: project.provider,
      shareToken: project.shareToken,
      createdAt: project.createdAt,
      error: project.error,
      shots: await Promise.all(shots.map((shot) => shotToPublic(ctx, shot))),
    };
  },
});

export const createDraft = mutation({
  args: {
    sourcePrompt: v.string(),
    targetDurationMs: v.number(),
    aspect: aspectValidator,
    tone: v.string(),
  },
  returns: v.id("projects"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("projects", {
      title: "Untitled board",
      sourcePrompt: args.sourcePrompt,
      targetDurationMs: args.targetDurationMs,
      aspect: args.aspect,
      tone: args.tone,
      styleBible: {
        look: args.tone,
        palette: "",
        camera: "",
        references: [],
      },
      status: "planning",
      beats: [],
      provider: "fallback",
      shareToken: crypto.randomUUID(),
      createdAt: Date.now(),
    });
  },
});

export const updateShotCopy = mutation({
  args: {
    shotId: v.id("shots"),
    visualPrompt: v.optional(v.string()),
    dialogue: v.optional(v.union(v.string(), v.null())),
    action: v.optional(v.string()),
  },
  returns: v.id("shots"),
  handler: async (ctx, args) => {
    const shot = await ctx.db.get(args.shotId);
    if (!shot) {
      throw new Error("Shot not found");
    }
    if (args.visualPrompt !== undefined) {
      await ctx.db.patch(args.shotId, { visualPrompt: args.visualPrompt });
    }
    if (args.action !== undefined) {
      await ctx.db.patch(args.shotId, { action: args.action });
    }
    if (args.dialogue !== undefined) {
      if (args.dialogue === null || args.dialogue.trim() === "") {
        await ctx.db.patch(args.shotId, { dialogue: undefined });
      } else {
        await ctx.db.patch(args.shotId, { dialogue: args.dialogue });
      }
    }
    return args.shotId;
  },
});
