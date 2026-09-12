"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { assertPromptAllowed } from "./lib/contentPolicy";
import { fallbackBoard } from "./lib/boardFallback";
import { boardWithXai } from "./lib/xai";
import type { Id } from "./_generated/dataModel";

export const boardStory = action({
  args: {
    sourcePrompt: v.string(),
    targetDurationMs: v.number(),
    aspect: v.union(v.literal("9:16"), v.literal("16:9"), v.literal("1:1")),
    tone: v.string(),
  },
  returns: v.id("projects"),
  handler: async (ctx, args): Promise<Id<"projects">> => {
    assertPromptAllowed(args.sourcePrompt);
    const projectId: Id<"projects"> = await ctx.runMutation(
      internal.generate.createDraftInternal,
      {
        sourcePrompt: args.sourcePrompt,
        targetDurationMs: args.targetDurationMs,
        aspect: args.aspect,
        tone: args.tone,
      },
    );
    await ctx.runMutation(internal.generate.setProjectStatus, {
      projectId,
      status: "boarding",
    });

    let provider: "xai" | "fallback" = "fallback";
    let board = fallbackBoard({
      prompt: args.sourcePrompt,
      targetDurationMs: args.targetDurationMs,
      aspect: args.aspect,
      tone: args.tone,
    });
    if (process.env.XAI_API_KEY) {
      try {
        board = await boardWithXai({
          prompt: args.sourcePrompt,
          targetDurationMs: args.targetDurationMs,
          aspect: args.aspect,
          tone: args.tone,
        });
        provider = "xai";
      } catch (error) {
        console.error("x.ai board failed, using fallback", error);
      }
    }

    const shotIds = await ctx.runMutation(internal.generate.applyBoard, {
      projectId,
      title: board.title,
      logline: board.logline,
      styleBible: board.styleBible,
      beats: board.beats,
      provider,
      shots: board.shots,
    });

    for (const shotId of shotIds) {
      await ctx.scheduler.runAfter(0, internal.media.generateShotAssets, {
        shotId,
      });
    }
    return projectId;
  },
});

export const retryShot = action({
  args: { shotId: v.id("shots") },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    await ctx.runAction(internal.media.generateShotAssets, {
      shotId: args.shotId,
    });
    return null;
  },
});
