import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { nextCursor, slideDurationMs } from "./playback.ts";

describe("slideDurationMs", () => {
  it("caps long shots so the cut actually advances", () => {
    assert.equal(slideDurationMs(7500), 2200);
    assert.equal(slideDurationMs(1000), 1000);
  });
});

describe("nextCursor", () => {
  it("walks to the end then stops", () => {
    assert.deepEqual(nextCursor(0, 3), { cursor: 1, done: false });
    assert.deepEqual(nextCursor(2, 3), { cursor: 0, done: true });
    assert.deepEqual(nextCursor(0, 0), { cursor: 0, done: true });
  });
});
