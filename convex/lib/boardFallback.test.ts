import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fallbackBoard, normalizeBoard } from "./boardFallback.ts";

describe("fallbackBoard", () => {
  it("returns 4-8 shots that sum to the target duration", () => {
    const board = fallbackBoard({
      prompt:
        "She pours coffee. She opens a laptop. Figma cleans up. She says \"That used to take my whole Monday.\" The badge turns green.",
      targetDurationMs: 30000,
      aspect: "9:16",
      tone: "UGC",
    });
    assert.ok(board.shots.length >= 4 && board.shots.length <= 8);
    const sum = board.shots.reduce((acc, shot) => acc + shot.durationMs, 0);
    assert.equal(sum, 30000);
    assert.equal(board.shots.some((shot) => shot.dialogue !== null), true);
  });
});

describe("normalizeBoard", () => {
  it("rescales odd durations to the target", () => {
    const raw = fallbackBoard({
      prompt: "One. Two. Three. Four.",
      targetDurationMs: 20000,
      aspect: "16:9",
      tone: "cinematic",
    });
    raw.shots = raw.shots.map((shot) => ({ ...shot, durationMs: 999 }));
    const next = normalizeBoard(raw, 15000);
    const sum = next.shots.reduce((acc, shot) => acc + shot.durationMs, 0);
    assert.equal(sum, 15000);
  });
});
