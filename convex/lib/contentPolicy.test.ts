import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assertPromptAllowed } from "./contentPolicy.ts";

describe("assertPromptAllowed", () => {
  it("accepts a normal story", () => {
    assert.doesNotThrow(() =>
      assertPromptAllowed(
        "A designer pours coffee in a Berlin kitchen and opens a laptop.",
      ),
    );
  });

  it("rejects too-short prompts", () => {
    assert.throws(() => assertPromptAllowed("hi"), /12 characters/);
  });
});
