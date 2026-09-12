import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { shotStatusValidator, styleBibleValidator } from "./validators";

export const applyBoard = internalMutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    logline: v.string(),
    styleBible: styleBibleValidator,
    beats: v.array(v.object({ t: v.string(), summary: v.string() })),
    provider: v.union(v.literal("xai"), v.literal("fallback")),
    shots: v.array(
      v.object({
        index: v.number(),
        title: v.string(),
        durationMs: v.number(),
        camera: v.string(),
        action: v.string(),
        dialogue: v.union(v.string(), v.null()),
        visualPrompt: v.string(),
        negativePrompt: v.string(),
      }),
    ),
  },
  returns: v.array(v.id("shots")),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    await ctx.db.patch(args.projectId, {
      title: args.title,
      logline: args.logline,
      styleBible: args.styleBible,
      beats: args.beats,
      provider: args.provider,
      status: "generating",
      error: undefined,
    });
    const existing = await ctx.db
      .query("shots")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .take(32);
    for (const shot of existing) {
      await ctx.db.delete(shot._id);
    }
    const ids = [];
    for (const shot of args.shots) {
      const id = await ctx.db.insert("shots", {
        projectId: args.projectId,
        index: shot.index,
        title: shot.title,
        camera: shot.camera,
        action: shot.action,
        dialogue: shot.dialogue ?? undefined,
        visualPrompt: shot.visualPrompt,
        negativePrompt: shot.negativePrompt,
        durationMs: shot.durationMs,
        status: "queued",
      });
      ids.push(id);
    }
    return ids;
  },
});

export const setProjectStatus = internalMutation({
  args: {
    projectId: v.id("projects"),
    status: v.union(
      v.literal("planning"),
      v.literal("boarding"),
      v.literal("generating"),
      v.literal("ready"),
      v.literal("failed"),
    ),
    error: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) {
      throw new Error("Project not found");
    }
    await ctx.db.patch(args.projectId, {
      status: args.status,
      error: args.error,
    });
    return null;
  },
});

export const patchShotMedia = internalMutation({
  args: {
    shotId: v.id("shots"),
    status: shotStatusValidator,
    stillStorageId: v.optional(v.id("_storage")),
    audioStorageId: v.optional(v.id("_storage")),
    falStillRequestId: v.optional(v.string()),
    error: v.optional(v.union(v.string(), v.null())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const shot = await ctx.db.get(args.shotId);
    if (!shot) {
      throw new Error("Shot not found");
    }
    await ctx.db.patch(args.shotId, {
      status: args.status,
      stillStorageId: args.stillStorageId ?? shot.stillStorageId,
      audioStorageId: args.audioStorageId ?? shot.audioStorageId,
      falStillRequestId: args.falStillRequestId ?? shot.falStillRequestId,
      error: args.error === null ? undefined : (args.error ?? shot.error),
    });
    return null;
  },
});

export const getShot = internalQuery({
  args: { shotId: v.id("shots") },
  returns: v.union(
    v.object({
      _id: v.id("shots"),
      projectId: v.id("projects"),
      title: v.string(),
      action: v.string(),
      visualPrompt: v.string(),
      negativePrompt: v.string(),
      dialogue: v.optional(v.string()),
      index: v.number(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const shot = await ctx.db.get(args.shotId);
    if (!shot) return null;
    return {
      _id: shot._id,
      projectId: shot.projectId,
      title: shot.title,
      action: shot.action,
      visualPrompt: shot.visualPrompt,
      negativePrompt: shot.negativePrompt,
      dialogue: shot.dialogue,
      index: shot.index,
    };
  },
});

export const getProjectMeta = internalQuery({
  args: { projectId: v.id("projects") },
  returns: v.union(
    v.object({
      aspect: v.union(v.literal("9:16"), v.literal("16:9"), v.literal("1:1")),
      styleLook: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return null;
    return {
      aspect: project.aspect,
      styleLook: project.styleBible.look,
    };
  },
});

export const createDraftInternal = internalMutation({
  args: {
    sourcePrompt: v.string(),
    targetDurationMs: v.number(),
    aspect: v.union(v.literal("9:16"), v.literal("16:9"), v.literal("1:1")),
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

export const listShotStatuses = internalQuery({
  args: { projectId: v.id("projects") },
  returns: v.array(shotStatusValidator),
  handler: async (ctx, args) => {
    const shots = await ctx.db
      .query("shots")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .take(16);
    return shots.map((shot) => shot.status);
  },
});
