"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { falTextToImage, falTts, fetchToBytes } from "./lib/fal";
import { placeholderSvg } from "./lib/placeholderStill";

const DONE = new Set(["complete", "still_ready", "audio_ready", "failed"]);

export const generateShotAssets = internalAction({
  args: { shotId: v.id("shots") },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    const shot = await ctx.runQuery(internal.generate.getShot, {
      shotId: args.shotId,
    });
    if (!shot) {
      throw new Error("Shot not found");
    }
    const project = await ctx.runQuery(internal.generate.getProjectMeta, {
      projectId: shot.projectId,
    });
    if (!project) {
      throw new Error("Project not found");
    }

    await ctx.runMutation(internal.generate.patchShotMedia, {
      shotId: args.shotId,
      status: "generating_still",
      error: null,
    });

    try {
      const still = await makeStill({
        title: shot.title,
        action: shot.action,
        index: shot.index,
        visualPrompt: `${project.styleLook}. ${shot.visualPrompt}`,
        negativePrompt: shot.negativePrompt,
        aspect: project.aspect,
      });
      const stillStorageId = await ctx.storage.store(
        new Blob([new Uint8Array(still.bytes)], { type: still.contentType }),
      );
      await ctx.runMutation(internal.generate.patchShotMedia, {
        shotId: args.shotId,
        status: shot.dialogue ? "generating_audio" : "still_ready",
        stillStorageId,
        falStillRequestId: still.requestId,
        error: null,
      });

      if (shot.dialogue) {
        try {
          const audio = await makeAudio(shot.dialogue);
          const audioStorageId = await ctx.storage.store(
            new Blob([new Uint8Array(audio.bytes)], { type: audio.contentType }),
          );
          await ctx.runMutation(internal.generate.patchShotMedia, {
            shotId: args.shotId,
            status: "complete",
            audioStorageId,
            error: null,
          });
        } catch (error) {
          console.error("audio failed", error);
          await ctx.runMutation(internal.generate.patchShotMedia, {
            shotId: args.shotId,
            status: "still_ready",
            error:
              "VO skipped — still is ready. Retry this shot when Fal TTS is available.",
          });
        }
      } else {
        await ctx.runMutation(internal.generate.patchShotMedia, {
          shotId: args.shotId,
          status: "complete",
          error: null,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Generation failed";
      await ctx.runMutation(internal.generate.patchShotMedia, {
        shotId: args.shotId,
        status: "failed",
        error: message,
      });
    }

    const statuses = await ctx.runQuery(internal.generate.listShotStatuses, {
      projectId: shot.projectId,
    });
    if (statuses.length > 0 && statuses.every((status) => DONE.has(status))) {
      await ctx.runMutation(internal.generate.setProjectStatus, {
        projectId: shot.projectId,
        status: "ready",
      });
    }
    return null;
  },
});

async function makeStill(args: {
  title: string;
  action: string;
  index: number;
  visualPrompt: string;
  negativePrompt: string;
  aspect: "9:16" | "16:9" | "1:1";
}): Promise<{ bytes: ArrayBuffer; contentType: string; requestId?: string }> {
  if (process.env.FAL_KEY) {
    const generated = await falTextToImage({
      prompt: args.visualPrompt,
      negativePrompt: args.negativePrompt,
      aspect: args.aspect,
    });
    const file = await fetchToBytes(generated.url);
    return { ...file, requestId: generated.requestId };
  }
  const svg = placeholderSvg(args);
  return {
    bytes: new TextEncoder().encode(svg).buffer,
    contentType: "image/svg+xml",
    requestId: "placeholder",
  };
}

async function makeAudio(
  dialogue: string,
): Promise<{ bytes: ArrayBuffer; contentType: string }> {
  if (!process.env.FAL_KEY) {
    throw new Error("FAL_KEY is not set");
  }
  const generated = await falTts(dialogue);
  return await fetchToBytes(generated.url);
}
