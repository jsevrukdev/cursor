import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { falPollUrls } from "./falQueue.ts";

describe("falPollUrls", () => {
  it("uses the queue URLs Fal returns, not the submit path", () => {
    const urls = falPollUrls({
      request_id: "abc",
      status_url: "https://queue.fal.run/fal-ai/flux/requests/abc/status",
      response_url: "https://queue.fal.run/fal-ai/flux/requests/abc",
    });
    assert.equal(urls.requestId, "abc");
    assert.match(urls.statusUrl, /\/fal-ai\/flux\/requests\//);
    assert.doesNotMatch(urls.statusUrl, /schnell/);
  });
});
